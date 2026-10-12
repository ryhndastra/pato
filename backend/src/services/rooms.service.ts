import { randomUUID } from "node:crypto";
import { pool } from "../db.js";
import { generateRoomCode } from "../utils/roomCode.js";

export class RoomNotFoundError extends Error {}

const UNIQUE_VIOLATION = "23505";

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

/** "Budi" -> "Budi (2)" if "Budi" is already taken in this room. */
async function resolveDisplayName(roomId: string, desiredName: string) {
  const { rows } = await pool.query<{ display_name: string }>(
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
  const { rows: roomRows } = await pool.query<RoomRow>(
    "SELECT id, status FROM rooms WHERE room_code = $1",
    [roomCode],
  );
  const room = roomRows[0];
  if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);

  // Reconnect: same device/browser rejoining with its persisted guest_token.
  const { rows: existingRows } = await pool.query<MemberRow>(
    "SELECT id, display_name, is_host FROM members WHERE room_id = $1 AND guest_token = $2",
    [room.id, input.guestToken],
  );
  const existingMember = existingRows[0];

  if (existingMember) {
    return {
      memberId: existingMember.id,
      displayName: existingMember.display_name,
      isHost: existingMember.is_host,
      roomStatus: room.status,
    };
  }

  const displayName = await resolveDisplayName(room.id, input.displayName);

  const { rows: insertedRows } = await pool.query<MemberRow>(
    `INSERT INTO members (room_id, guest_token, display_name, is_host)
     VALUES ($1, $2, $3, FALSE)
     RETURNING id, display_name, is_host`,
    [room.id, input.guestToken, displayName],
  );
  const member = insertedRows[0];

  return {
    memberId: member.id,
    displayName: member.display_name,
    isHost: member.is_host,
    roomStatus: room.status,
  };
}
