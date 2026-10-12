import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "../db.js";
import { generateRoomCode } from "../utils/roomCode.js";

export class RoomNotFoundError extends Error {}

const UNIQUE_VIOLATION = "23505";

// Deadlock (40P01) atau serialization failure (40001) boleh dicoba ulang terbatas.
const RETRYABLE_TX_CODES = new Set(["40001", "40P01"]);
const MAX_JOIN_ATTEMPTS = 3;

interface CreateRoomItemInput {
  name: string;
  unitPrice: number;
  quantity: number;
}

interface CreateRoomInput {
  title: string;
  hostName: string;
  hostUserId?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  items: CreateRoomItemInput[];
  taxAmount: number;
  serviceAmount: number;
  discountAmount: number;
}

const MAX_ROOM_CODE_ATTEMPTS = 5;

export async function createRoom(input: CreateRoomInput) {
  const hostToken = randomUUID();
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const grandTotal = Math.max(
    0,
    subtotal + input.taxAmount + input.serviceAmount - input.discountAmount,
  );

  for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt++) {
    const roomCode = generateRoomCode(input.title);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { rows: roomRows } = await client.query<{ status: string }>(
        `INSERT INTO rooms (
           room_code, title, host_user_id, bank_name, bank_account_no, bank_account_name,
           subtotal, tax_amount, service_amount, discount_amount, grand_total
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING status`,
        [
          roomCode,
          input.title,
          input.hostUserId ?? null,
          input.bankName ?? null,
          input.bankAccountNo ?? null,
          input.bankAccountName ?? null,
          subtotal,
          input.taxAmount,
          input.serviceAmount,
          input.discountAmount,
          grandTotal,
        ],
      );

      await client.query(
        `INSERT INTO members (room_id, guest_token, display_name, is_host)
         SELECT id, $2, $3, TRUE FROM rooms WHERE room_code = $1`,
        [roomCode, hostToken, input.hostName],
      );

      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i];
        await client.query(
          `INSERT INTO items (room_id, name, unit_price, quantity, sort_order)
           SELECT id, $2, $3, $4, $5 FROM rooms WHERE room_code = $1`,
          [roomCode, item.name, item.unitPrice, item.quantity, i],
        );
      }

      await client.query("COMMIT");
      return {
        roomCode,
        status: roomRows[0].status,
        hostToken,
        subtotal,
        grandTotal,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      const isRoomCodeCollision =
        error instanceof Error &&
        "code" in error &&
        (error as { code?: string }).code === UNIQUE_VIOLATION;
      if (!isRoomCodeCollision) throw error;
    } finally {
      client.release();
    }
  }

  throw new Error("Gagal membuat room setelah beberapa percobaan, coba lagi.");
}

/** "Budi" -> "Budi (2)" jika "Budi" sudah terpakai di room ini. */
async function resolveDisplayName(
  client: PoolClient,
  roomId: string,
  desiredName: string,
) {
  const { rows } = await client.query<{ display_name: string }>(
    `SELECT display_name FROM members WHERE room_id = $1 AND display_name LIKE $2 || '%'`,
    [roomId, desiredName],
  );
  const taken = new Set(rows.map((r) => r.display_name));
  if (!taken.has(desiredName)) return desiredName;

  let n = 2;
  while (taken.has(`${desiredName} (${n})`)) n++;
  return `${desiredName} (${n})`;
}

interface JoinRoomInput {
  guestToken: string;
  displayName: string;
}

interface RoomRow {
  id: string;
  status: string;
}

interface MemberRow {
  id: string;
  display_name: string;
  is_host: boolean;
}

export async function joinRoom(roomCode: string, input: JoinRoomInput) {
  // Serialisasi join per-room lewat row lock supaya nama unik tidak balapan.
  // Retry terbatas hanya untuk deadlock/serialization failure, bukan update konflik.
  for (let attempt = 1; attempt <= MAX_JOIN_ATTEMPTS; attempt++) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: roomRows } = await client.query<RoomRow>(
        "SELECT id, status FROM rooms WHERE room_code = $1 FOR UPDATE",
        [roomCode],
      );
      const room = roomRows[0];
      if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);

      // Reconnect: device/browser yang sama join ulang dengan guest_token tersimpan.
      const { rows: existingRows } = await client.query<MemberRow>(
        "SELECT id, display_name, is_host FROM members WHERE room_id = $1 AND guest_token = $2",
        [room.id, input.guestToken],
      );
      const existingMember = existingRows[0];

      if (existingMember) {
        await client.query("COMMIT");
        return {
          memberId: existingMember.id,
          displayName: existingMember.display_name,
          isHost: existingMember.is_host,
          roomStatus: room.status,
        };
      }

      const displayName = await resolveDisplayName(client, room.id, input.displayName);

      const { rows: insertedRows } = await client.query<MemberRow>(
        `INSERT INTO members (room_id, guest_token, display_name, is_host)
         VALUES ($1, $2, $3, FALSE)
         RETURNING id, display_name, is_host`,
        [room.id, input.guestToken, displayName],
      );
      const member = insertedRows[0];

      await client.query("COMMIT");
      return {
        memberId: member.id,
        displayName: member.display_name,
        isHost: member.is_host,
        roomStatus: room.status,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      const code =
        error instanceof Error && "code" in error
          ? (error as { code?: string }).code
          : undefined;
      const isRetryable = code !== undefined && RETRYABLE_TX_CODES.has(code);
      if (isRetryable && attempt < MAX_JOIN_ATTEMPTS) continue;
      throw error;
    } finally {
      client.release();
    }
  }

  throw new Error("Gagal join room karena konflik bersamaan, coba lagi.");
}

interface RoomDetailRow {
  id: string;
  room_code: string;
  title: string;
  status: string;
  subtotal: string;
  tax_amount: string;
  service_amount: string;
  discount_amount: string;
  grand_total: string;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
}

interface RoomItemRow {
  id: string;
  name: string;
  unit_price: string;
  quantity: number;
  is_shared: boolean;
}

export async function getRoomByCode(roomCode: string) {
  const { rows: roomRows } = await pool.query<RoomDetailRow>(
    `SELECT id, room_code, title, status, subtotal, tax_amount, service_amount,
            discount_amount, grand_total, bank_name, bank_account_no, bank_account_name
     FROM rooms
     WHERE room_code = $1`,
    [roomCode],
  );
  const room = roomRows[0];
  if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);

  // Query terpisah supaya detail room dan item tidak jadi cartesian product saat di-join.
  const { rows: itemRows } = await pool.query<RoomItemRow>(
    `SELECT id, name, unit_price, quantity, is_shared
     FROM items
     WHERE room_id = $1
     ORDER BY sort_order ASC, created_at ASC`,
    [room.id],
  );

  return {
    roomCode: room.room_code,
    title: room.title,
    status: room.status,
    subtotal: Number(room.subtotal),
    taxAmount: Number(room.tax_amount),
    serviceAmount: Number(room.service_amount),
    discountAmount: Number(room.discount_amount),
    grandTotal: Number(room.grand_total),
    bankName: room.bank_name,
    bankAccountNo: room.bank_account_no,
    bankAccountName: room.bank_account_name,
    items: itemRows.map((item) => ({
      id: item.id,
      name: item.name,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
      isShared: item.is_shared,
    })),
  };
}

interface MyRoomRow {
  room_code: string;
  title: string;
  status: string;
  grand_total: string;
  created_at: Date;
}

export async function listMyRooms(hostUserId: string) {
  const { rows } = await pool.query<MyRoomRow>(
    `SELECT room_code, title, status, grand_total, created_at
     FROM rooms
     WHERE host_user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [hostUserId],
  );

  return rows.map((row) => ({
    roomCode: row.room_code,
    title: row.title,
    status: row.status,
    grandTotal: Number(row.grand_total),
    createdAt: row.created_at,
  }));
}
