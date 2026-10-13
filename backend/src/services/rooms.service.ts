import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { pool } from "../db.js";
import { generateRoomCode } from "../utils/roomCode.js";

export class RoomNotFoundError extends Error {}
export class MemberNotFoundError extends Error {}
export class ItemNotFoundError extends Error {}
export class RoomLockedError extends Error {}
export class OverclaimError extends Error {}
export class ForbiddenError extends Error {}
export class InvalidJoinError extends Error {}

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
  qrisImageUrl?: string;
  receiptImageUrl?: string;
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

      const { rows: roomRows } = await client.query<{ id: string; status: string }>(
        `INSERT INTO rooms (
           room_code, title, host_user_id, bank_name, bank_account_no, bank_account_name,
           subtotal, tax_amount, service_amount, discount_amount, grand_total, qris_image_url, receipt_image_url
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id, status`,
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
          input.qrisImageUrl ?? null,
          input.receiptImageUrl ?? null,
        ],
      );
      const roomId = roomRows[0].id;

      await client.query(
        `INSERT INTO members (room_id, user_id, guest_token, display_name, is_host)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [roomId, input.hostUserId ?? null, hostToken, input.hostName],
      );

      if (input.items.length > 0) {
        const itemValues: unknown[] = [];
        const placeholders: string[] = [];
        for (let i = 0; i < input.items.length; i++) {
          const item = input.items[i];
          const offset = i * 5;
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
          itemValues.push(roomId, item.name, item.unitPrice, item.quantity, i);
        }
        await client.query(
          `INSERT INTO items (room_id, name, unit_price, quantity, sort_order)
           VALUES ${placeholders.join(", ")}`,
          itemValues,
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
  host_user_id: string | null;
}

interface MemberRow {
  id: string;
  display_name: string;
  is_host: boolean;
}

export async function joinRoom(roomCode: string, input: JoinRoomInput, userId?: string) {
  // Serialisasi join per-room lewat row lock supaya nama unik tidak balapan.
  // Retry terbatas hanya untuk deadlock/serialization failure, bukan update konflik.
  for (let attempt = 1; attempt <= MAX_JOIN_ATTEMPTS; attempt++) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: roomRows } = await client.query<RoomRow>(
        "SELECT id, status, host_user_id FROM rooms WHERE room_code = $1 FOR UPDATE",
        [roomCode],
      );
      const room = roomRows[0];
      if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);

      // 1. Reconnect: device/browser yang sama join ulang dengan guest_token tersimpan.
      const { rows: existingRows } = await client.query<MemberRow>(
        "SELECT id, display_name, is_host FROM members WHERE room_id = $1 AND guest_token = $2",
        [room.id, input.guestToken],
      );
      const existingMember = existingRows[0];

      if (existingMember) {
        if (userId) {
          await client.query(
            "UPDATE members SET user_id = $1 WHERE id = $2 AND user_id IS NULL",
            [userId, existingMember.id],
          );
        }
        await client.query("COMMIT");
        return {
          memberId: existingMember.id,
          displayName: existingMember.display_name,
          isHost: existingMember.is_host,
          roomStatus: room.status,
        };
      }

      // 2. Reconnect via Authenticated User: Host di device lain / incognito
      if (userId) {
        if (room.host_user_id === userId) {
          const { rows: hostMemberRows } = await client.query<MemberRow>(
            "SELECT id, display_name, is_host FROM members WHERE room_id = $1 AND is_host = TRUE",
            [room.id],
          );
          if (hostMemberRows[0]) {
            await client.query(
              "UPDATE members SET guest_token = $1, user_id = $2 WHERE id = $3",
              [input.guestToken, userId, hostMemberRows[0].id],
            );
            await client.query("COMMIT");
            return {
              memberId: hostMemberRows[0].id,
              displayName: hostMemberRows[0].display_name,
              isHost: true,
              roomStatus: room.status,
            };
          }
        }

        const { rows: userMemberRows } = await client.query<MemberRow>(
          "SELECT id, display_name, is_host FROM members WHERE room_id = $1 AND user_id = $2",
          [room.id, userId],
        );
        if (userMemberRows[0]) {
          await client.query(
            "UPDATE members SET guest_token = $1 WHERE id = $2",
            [input.guestToken, userMemberRows[0].id],
          );
          await client.query("COMMIT");
          return {
            memberId: userMemberRows[0].id,
            displayName: userMemberRows[0].display_name,
            isHost: userMemberRows[0].is_host,
            roomStatus: room.status,
          };
        }
      }

      const trimmedName = input.displayName ? input.displayName.trim() : "";
      if (!trimmedName) {
        throw new InvalidJoinError("Nama harus diisi untuk gabung ke meja.");
      }

      const displayName = await resolveDisplayName(client, room.id, trimmedName);

      const { rows: insertedRows } = await client.query<MemberRow>(
        `INSERT INTO members (room_id, user_id, guest_token, display_name, is_host)
         VALUES ($1, $2, $3, $4, FALSE)
         RETURNING id, display_name, is_host`,
        [room.id, userId ?? null, input.guestToken, displayName],
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
  host_user_id: string | null;
  subtotal: string;
  tax_amount: string;
  service_amount: string;
  discount_amount: string;
  grand_total: string;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
  qris_image_url: string | null;
  receipt_image_url: string | null;
  items: RoomItemRow[];
  members: MemberRowFull[];
  claims: ClaimJoinRow[];
  payments: PaymentRow[];
}

interface PaymentRow {
  member_id: string;
  status: "PENDING" | "REJECTED" | "VERIFIED";
  proof_image_url: string | null;
  rejection_reason: string | null;
}

interface RoomItemRow {
  id: string;
  name: string;
  unit_price: string;
  quantity: number;
  is_shared: boolean;
}

interface MemberRowFull {
  id: string;
  user_id: string | null;
  display_name: string;
  is_host: boolean;
}

interface ClaimJoinRow {
  item_id: string;
  member_id: string;
  portion_quantity: string;
  unit_price: string;
  quantity: number;
  is_shared: boolean;
}

/** Hitung berapa rupiah tiap member nanggung, proporsional ke porsi yang
 *  benar-benar diklaim - bukan dibagi rata. Item non-shared dibagi per unit
 *  (price-per-unit x porsi), item shared dibagi rata ke semua yang klaim. */
function computeMemberShares(
  members: MemberRowFull[],
  claims: ClaimJoinRow[],
  room: { subtotal: number; taxAmount: number; serviceAmount: number; discountAmount: number },
) {
  const claimsByItem = new Map<string, ClaimJoinRow[]>();
  for (const claim of claims) {
    const list = claimsByItem.get(claim.item_id) ?? [];
    list.push(claim);
    claimsByItem.set(claim.item_id, list);
  }

  const memberItemSubtotal = new Map<string, number>();
  for (const itemClaims of claimsByItem.values()) {
    const first = itemClaims[0];
    const itemTotal = Number(first.unit_price) * first.quantity;

    if (first.is_shared) {
      const perClaimer = itemTotal / itemClaims.length;
      for (const claim of itemClaims) {
        memberItemSubtotal.set(
          claim.member_id,
          (memberItemSubtotal.get(claim.member_id) ?? 0) + perClaimer,
        );
      }
    } else {
      const pricePerUnit = first.quantity > 0 ? itemTotal / first.quantity : 0;
      for (const claim of itemClaims) {
        memberItemSubtotal.set(
          claim.member_id,
          (memberItemSubtotal.get(claim.member_id) ?? 0) +
            pricePerUnit * Number(claim.portion_quantity),
        );
      }
    }
  }

  return members.map((member) => {
    const itemSubtotal = memberItemSubtotal.get(member.id) ?? 0;
    const ratio = room.subtotal > 0 ? itemSubtotal / room.subtotal : 0;
    const taxShare = room.taxAmount * ratio;
    const serviceShare = room.serviceAmount * ratio;
    const discountShare = room.discountAmount * ratio;
    const shareAmount = Math.max(
      0,
      Math.round(itemSubtotal + taxShare + serviceShare - discountShare),
    );

    return {
      id: member.id,
      userId: member.user_id,
      displayName: member.display_name,
      isHost: member.is_host,
      subtotalShare: Math.round(itemSubtotal),
      shareAmount,
      claimedItemIds: claims
        .filter((c) => c.member_id === member.id)
        .map((c) => c.item_id),
    };
  });
}

export async function getRoomByCode(roomCode: string) {
  const { rows: roomRows } = await pool.query<RoomDetailRow>(
    `SELECT
       r.id, r.room_code, r.title, r.status, r.host_user_id, r.subtotal, r.tax_amount, r.service_amount,
       r.discount_amount, r.grand_total, r.bank_name, r.bank_account_no, r.bank_account_name,
       r.qris_image_url, r.receipt_image_url,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'id', i.id,
           'name', i.name,
           'unit_price', i.unit_price,
           'quantity', i.quantity,
           'is_shared', i.is_shared
         ) ORDER BY i.sort_order ASC, i.created_at ASC), '[]'::json)
         FROM items i
         WHERE i.room_id = r.id
       ) AS items,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'id', m.id,
           'user_id', m.user_id,
           'display_name', m.display_name,
           'is_host', m.is_host
         ) ORDER BY m.is_host DESC, m.joined_at ASC), '[]'::json)
         FROM members m
         WHERE m.room_id = r.id
       ) AS members,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'item_id', ic.item_id,
           'member_id', ic.member_id,
           'portion_quantity', ic.portion_quantity,
           'unit_price', i.unit_price,
           'quantity', i.quantity,
           'is_shared', i.is_shared
         )), '[]'::json)
         FROM item_claims ic
         JOIN items i ON i.id = ic.item_id
         WHERE i.room_id = r.id
       ) AS claims,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'member_id', p.member_id,
           'status', p.status,
           'proof_image_url', p.proof_image_url,
           'rejection_reason', p.rejection_reason
         )), '[]'::json)
         FROM payments p
         WHERE p.room_id = r.id
       ) AS payments
     FROM rooms r
     WHERE r.room_code = $1`,
    [roomCode],
  );
  const room = roomRows[0];
  if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);

  const itemRows = room.items || [];
  const memberRows = room.members || [];
  const claimRows = room.claims || [];
  const paymentRows = room.payments || [];

  const paymentsByMember = new Map<string, PaymentRow>();
  for (const p of paymentRows) {
    paymentsByMember.set(p.member_id, p);
  }

  const roomTotals = {
    subtotal: Number(room.subtotal),
    taxAmount: Number(room.tax_amount),
    serviceAmount: Number(room.service_amount),
    discountAmount: Number(room.discount_amount),
  };
  const rawMembers = computeMemberShares(memberRows, claimRows, roomTotals);
  const members = rawMembers.map((m) => {
    const payment = paymentsByMember.get(m.id);
    return {
      ...m,
      paymentStatus: m.isHost
        ? ("VERIFIED" as const)
        : ((payment?.status ?? "UNPAID") as "UNPAID" | "PENDING" | "VERIFIED" | "REJECTED"),
      proofImageUrl: payment?.proof_image_url ?? null,
      rejectionReason: payment?.rejection_reason ?? null,
    };
  });

  const claimsByItem = new Map<string, ClaimJoinRow[]>();
  for (const claim of claimRows) {
    const list = claimsByItem.get(claim.item_id) ?? [];
    list.push(claim);
    claimsByItem.set(claim.item_id, list);
  }

  return {
    roomCode: room.room_code,
    title: room.title,
    status: room.status,
    hostUserId: room.host_user_id,
    subtotal: roomTotals.subtotal,
    taxAmount: roomTotals.taxAmount,
    serviceAmount: roomTotals.serviceAmount,
    discountAmount: roomTotals.discountAmount,
    grandTotal: Number(room.grand_total),
    bankName: room.bank_name,
    bankAccountNo: room.bank_account_no,
    bankAccountName: room.bank_account_name,
    qrisImageUrl: room.qris_image_url,
    receiptImageUrl: room.receipt_image_url,
    items: itemRows.map((item) => {
      const itemClaims = claimsByItem.get(item.id) ?? [];
      return {
        id: item.id,
        name: item.name,
        unitPrice: Number(item.unit_price),
        quantity: item.quantity,
        isShared: item.is_shared,
        claimedQuantity: itemClaims.reduce(
          (sum, c) => sum + Number(c.portion_quantity),
          0,
        ),
        claimedByMemberIds: itemClaims.map((c) => c.member_id),
        claims: itemClaims.map((c) => ({
          memberId: c.member_id,
          portionQuantity: Number(c.portion_quantity),
        })),
      };
    }),
    members,
  };
}

async function resolveMember(client: PoolClient, roomId: string, guestToken: string) {
  const { rows } = await client.query<{ id: string }>(
    "SELECT id FROM members WHERE room_id = $1 AND guest_token = $2",
    [roomId, guestToken],
  );
  const member = rows[0];
  if (!member) {
    throw new MemberNotFoundError("Kamu belum gabung ke room ini.");
  }
  return member.id;
}

async function lockRoomRowForClaim(client: PoolClient, roomCode: string) {
  const { rows } = await client.query<{ id: string; status: string }>(
    "SELECT id, status FROM rooms WHERE room_code = $1 FOR UPDATE",
    [roomCode],
  );
  const room = rows[0];
  if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  if (room.status === "LOCKED" || room.status === "CLOSED") {
    throw new RoomLockedError("Room ini sudah dikunci, klaim tidak bisa diubah lagi.");
  }
  return room;
}

export async function claimItem(roomCode: string, itemId: string, guestToken: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const room = await lockRoomRowForClaim(client, roomCode);
    const memberId = await resolveMember(client, room.id, guestToken);

    const { rows: itemRows } = await client.query<{
      id: string;
      name: string;
      quantity: number;
      is_shared: boolean;
    }>(
      "SELECT id, name, quantity, is_shared FROM items WHERE id = $1 AND room_id = $2",
      [itemId, room.id],
    );
    const item = itemRows[0];
    if (!item) throw new ItemNotFoundError("Item tidak ditemukan di room ini.");

    if (!item.is_shared) {
      const { rows: claimedRows } = await client.query<{ total: string | null }>(
        "SELECT SUM(portion_quantity) AS total FROM item_claims WHERE item_id = $1",
        [itemId],
      );
      const alreadyClaimed = Number(claimedRows[0]?.total ?? 0);
      if (alreadyClaimed + 1 > item.quantity) {
        throw new OverclaimError("Porsi item ini sudah habis diklaim.");
      }
    }

    await client.query(
      `INSERT INTO item_claims (item_id, member_id, portion_quantity)
       VALUES ($1, $2, 1)
       ON CONFLICT (item_id, member_id)
       DO UPDATE SET portion_quantity = item_claims.portion_quantity + 1`,
      [itemId, memberId],
    );

    await client.query(
      "UPDATE rooms SET status = 'CLAIMING', updated_at = NOW() WHERE id = $1 AND status = 'DRAFT'",
      [room.id],
    );

    const { rows: memberRows } = await client.query<{ display_name: string }>(
      "SELECT display_name FROM members WHERE id = $1",
      [memberId],
    );
    const memberName = memberRows[0]?.display_name ?? "Member";

    await client.query(
      `INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
       VALUES ($1, $2, 'CLAIM_ITEM', 'SYSTEM', $3, NOW())`,
      [room.id, memberId, `${memberName} mengklaim 1x ${item.name}`],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function unclaimItem(roomCode: string, itemId: string, guestToken: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const room = await lockRoomRowForClaim(client, roomCode);
    const memberId = await resolveMember(client, room.id, guestToken);

    const { rows: currentClaimRows } = await client.query<{ portion_quantity: string }>(
      "SELECT portion_quantity FROM item_claims WHERE item_id = $1 AND member_id = $2",
      [itemId, memberId],
    );
    const currentPortion = Number(currentClaimRows[0]?.portion_quantity ?? 0);

    if (currentPortion > 1) {
      await client.query(
        "UPDATE item_claims SET portion_quantity = portion_quantity - 1 WHERE item_id = $1 AND member_id = $2",
        [itemId, memberId],
      );
    } else {
      await client.query(
        "DELETE FROM item_claims WHERE item_id = $1 AND member_id = $2",
        [itemId, memberId],
      );
    }

    const { rows: memberRows } = await client.query<{ display_name: string }>(
      "SELECT display_name FROM members WHERE id = $1",
      [memberId],
    );
    const memberName = memberRows[0]?.display_name ?? "Member";

    const { rows: itemRows } = await client.query<{ name: string }>(
      "SELECT name FROM items WHERE id = $1",
      [itemId],
    );
    const itemName = itemRows[0]?.name ?? "item";

    await client.query(
      `INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
       VALUES ($1, $2, 'UNCLAIM_ITEM', 'SYSTEM', $3, NOW())`,
      [room.id, memberId, `${memberName} melepas porsi ${itemName}`],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function assertIsHost(
  clientOrPool: Pool | PoolClient,
  roomId: string,
  hostUserId?: string,
  guestToken?: string,
) {
  if (hostUserId) {
    const { rows: roomRows } = await clientOrPool.query<{ host_user_id: string | null }>(
      "SELECT host_user_id FROM rooms WHERE id = $1",
      [roomId],
    );
    if (roomRows[0]?.host_user_id && roomRows[0].host_user_id === hostUserId) {
      return true;
    }

    const { rows: memberRows } = await clientOrPool.query<{ is_host: boolean }>(
      "SELECT is_host FROM members WHERE room_id = $1 AND user_id = $2 AND is_host = TRUE",
      [roomId, hostUserId],
    );
    if (memberRows.length > 0) {
      return true;
    }
  }

  if (guestToken) {
    const { rows: memberRows } = await clientOrPool.query<{ is_host: boolean }>(
      "SELECT is_host FROM members WHERE room_id = $1 AND guest_token = $2 AND is_host = TRUE",
      [roomId, guestToken],
    );
    if (memberRows.length > 0) {
      return true;
    }
  }

  throw new ForbiddenError("Kamu bukan host room ini.");
}

export async function lockRoom(roomCode: string, hostUserId?: string, guestToken?: string) {
  const { rows } = await pool.query<{
    id: string;
    host_user_id: string | null;
    status: string;
  }>("SELECT id, host_user_id, status FROM rooms WHERE room_code = $1", [roomCode]);

  const room = rows[0];
  if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  await assertIsHost(pool, room.id, hostUserId, guestToken);

  if (room.status === "LOCKED" || room.status === "CLOSED") {
    return { status: room.status };
  }

  const { rows: updated } = await pool.query<{ status: string }>(
    `UPDATE rooms SET status = 'LOCKED', locked_at = NOW(), updated_at = NOW()
     WHERE id = $1 RETURNING status`,
    [room.id],
  );

  await pool.query(
    `INSERT INTO room_events (room_id, event_type, sender_type, message, created_at)
     VALUES ($1, 'BILL_LOCKED', 'SYSTEM', 'Tagihan telah dikunci oleh Host. Nominal pembayaran kini bersifat final.', NOW())`,
    [room.id],
  );

  return { status: updated[0].status };
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

export async function deleteRoom(roomCode: string, hostUserId?: string, guestToken?: string) {
  const { rows } = await pool.query<{ id: string; host_user_id: string | null }>(
    "SELECT id, host_user_id FROM rooms WHERE room_code = $1",
    [roomCode],
  );
  const room = rows[0];
  if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  await assertIsHost(pool, room.id, hostUserId, guestToken);

  await pool.query("DELETE FROM rooms WHERE id = $1", [room.id]);
}

export async function unlockRoom(roomCode: string, hostUserId?: string, guestToken?: string) {
  const { rows } = await pool.query<{
    id: string;
    host_user_id: string | null;
    status: string;
  }>("SELECT id, host_user_id, status FROM rooms WHERE room_code = $1", [roomCode]);

  const room = rows[0];
  if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  await assertIsHost(pool, room.id, hostUserId, guestToken);

  if (room.status === "CLOSED") {
    throw new RoomLockedError("Room sudah ditutup permanen.");
  }

  const { rows: updated } = await pool.query<{ status: string }>(
    `UPDATE rooms SET status = 'CLAIMING', updated_at = NOW()
     WHERE id = $1 RETURNING status`,
    [room.id],
  );

  await pool.query(
    `INSERT INTO room_events (room_id, event_type, sender_type, message, created_at)
     VALUES ($1, 'BILL_UNLOCKED', 'SYSTEM', 'Host membuka kembali kunci meja untuk penyesuaian porsi menu.', NOW())`,
    [room.id],
  );

  return { status: updated[0].status };
}

export async function closeRoom(roomCode: string, hostUserId?: string, guestToken?: string) {
  const { rows } = await pool.query<{
    id: string;
    host_user_id: string | null;
    status: string;
  }>("SELECT id, host_user_id, status FROM rooms WHERE room_code = $1", [roomCode]);

  const room = rows[0];
  if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  await assertIsHost(pool, room.id, hostUserId, guestToken);

  const { rows: updated } = await pool.query<{ status: string }>(
    `UPDATE rooms SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW()
     WHERE id = $1 RETURNING status`,
    [room.id],
  );
  return { status: updated[0].status };
}

export async function splitUnclaimedItems(roomCode: string, hostUserId?: string, guestToken?: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: roomRows } = await client.query<{
      id: string;
      host_user_id: string | null;
      status: string;
    }>("SELECT id, host_user_id, status FROM rooms WHERE room_code = $1 FOR UPDATE", [roomCode]);

    const room = roomRows[0];
    if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
    await assertIsHost(client, room.id, hostUserId, guestToken);

    const { rows: members } = await client.query<{ id: string }>(
      "SELECT id FROM members WHERE room_id = $1",
      [room.id],
    );
    if (members.length === 0) {
      await client.query("COMMIT");
      return;
    }

    const { rows: items } = await client.query<{ id: string; quantity: number }>(
      "SELECT id, quantity FROM items WHERE room_id = $1",
      [room.id],
    );

    const { rows: claims } = await client.query<{ item_id: string; total: string | null }>(
      `SELECT item_id, SUM(portion_quantity) as total
       FROM item_claims ic
       JOIN items i ON i.id = ic.item_id
       WHERE i.room_id = $1
       GROUP BY item_id`,
      [room.id],
    );
    const claimedMap = new Map(claims.map((c) => [c.item_id, Number(c.total ?? 0)]));

    for (const item of items) {
      const claimedQty = claimedMap.get(item.id) ?? 0;
      const remainingQty = item.quantity - claimedQty;
      if (remainingQty > 0) {
        const portionPerMember = remainingQty / members.length;
        for (const member of members) {
          await client.query(
            `INSERT INTO item_claims (item_id, member_id, portion_quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (item_id, member_id)
             DO UPDATE SET portion_quantity = item_claims.portion_quantity + EXCLUDED.portion_quantity`,
            [item.id, member.id, portionPerMember],
          );
        }
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function submitPaymentProof(
  roomCode: string,
  guestToken: string,
  proofImageUrl: string,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: roomRows } = await client.query<{ id: string }>(
      "SELECT id FROM rooms WHERE room_code = $1",
      [roomCode],
    );
    const room = roomRows[0];
    if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);

    const memberId = await resolveMember(client, room.id, guestToken);

    await client.query(
      `INSERT INTO payments (room_id, member_id, proof_image_url, status, submitted_at, updated_at)
       VALUES ($1, $2, $3, 'PENDING', NOW(), NOW())
       ON CONFLICT (room_id, member_id)
       DO UPDATE SET
         proof_image_url = EXCLUDED.proof_image_url,
         status = 'PENDING',
         rejection_reason = NULL,
         submitted_at = NOW(),
         updated_at = NOW()`,
      [room.id, memberId, proofImageUrl],
    );

    const { rows: memberRows } = await client.query<{ display_name: string }>(
      "SELECT display_name FROM members WHERE id = $1",
      [memberId],
    );
    const memberName = memberRows[0]?.display_name ?? "Member";

    await client.query(
      `INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
       VALUES ($1, $2, 'PROOF_UPLOADED', 'SYSTEM', $3, NOW())`,
      [room.id, memberId, `${memberName} mengunggah bukti transfer.`],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function verifyPayment(
  roomCode: string,
  memberId: string,
  hostUserId?: string,
  guestToken?: string,
) {
  const { rows: roomRows } = await pool.query<{ id: string; host_user_id: string | null }>(
    "SELECT id, host_user_id FROM rooms WHERE room_code = $1",
    [roomCode],
  );
  const room = roomRows[0];
  if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  await assertIsHost(pool, room.id, hostUserId, guestToken);

  await pool.query(
    `INSERT INTO payments (room_id, member_id, status, verified_at, updated_at)
     VALUES ($1, $2, 'VERIFIED', NOW(), NOW())
     ON CONFLICT (room_id, member_id)
     DO UPDATE SET
       status = 'VERIFIED',
       verified_at = NOW(),
       rejection_reason = NULL,
       updated_at = NOW()`,
    [room.id, memberId],
  );

  const { rows: memberRows } = await pool.query<{ display_name: string }>(
    "SELECT display_name FROM members WHERE id = $1",
    [memberId],
  );
  const memberName = memberRows[0]?.display_name ?? "Member";

  await pool.query(
    `INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
     VALUES ($1, $2, 'PAYMENT_VERIFIED', 'SYSTEM', $3, NOW())`,
    [room.id, memberId, `Pembayaran ${memberName} telah diverifikasi lunas oleh Host.`],
  );
}

export async function rejectPayment(
  roomCode: string,
  memberId: string,
  reason: string,
  hostUserId?: string,
  guestToken?: string,
) {
  const { rows: roomRows } = await pool.query<{ id: string; host_user_id: string | null }>(
    "SELECT id, host_user_id FROM rooms WHERE room_code = $1",
    [roomCode],
  );
  const room = roomRows[0];
  if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  await assertIsHost(pool, room.id, hostUserId, guestToken);

  await pool.query(
    `INSERT INTO payments (room_id, member_id, status, rejection_reason, updated_at)
     VALUES ($1, $2, 'REJECTED', $3, NOW())
     ON CONFLICT (room_id, member_id)
     DO UPDATE SET
       status = 'REJECTED',
       rejection_reason = $3,
       updated_at = NOW()`,
    [room.id, memberId, reason],
  );

  const { rows: memberRows } = await pool.query<{ display_name: string }>(
    "SELECT display_name FROM members WHERE id = $1",
    [memberId],
  );
  const memberName = memberRows[0]?.display_name ?? "Member";

  await pool.query(
    `INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
     VALUES ($1, $2, 'PAYMENT_REJECTED', 'SYSTEM', $3, NOW())`,
    [room.id, memberId, `Bukti transfer ${memberName} ditolak: ${reason}`],
  );
}

export interface RoomEventRow {
  id: string;
  room_id: string;
  member_id: string | null;
  display_name: string | null;
  event_type: string;
  sender_type: "SYSTEM" | "MEMBER";
  message: string;
  created_at: Date;
}

export async function getRoomEvents(roomCode: string): Promise<RoomEventRow[]> {
  const { rows } = await pool.query<RoomEventRow>(
    `SELECT re.id, re.room_id, re.member_id, re.event_type, re.sender_type, re.message, re.created_at,
            m.display_name
     FROM room_events re
     JOIN rooms r ON r.id = re.room_id
     LEFT JOIN members m ON m.id = re.member_id
     WHERE r.room_code = $1
     ORDER BY re.created_at ASC
     LIMIT 100`,
    [roomCode],
  );
  return rows;
}

export async function postChatMessage(roomCode: string, guestToken: string, message: string) {
  const clean = message.trim();
  if (!clean) throw new Error("Pesan tidak boleh kosong.");

  const { rows: roomRows } = await pool.query<{ id: string }>(
    "SELECT id FROM rooms WHERE room_code = $1",
    [roomCode],
  );
  const room = roomRows[0];
  if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);

  const client = await pool.connect();
  try {
    const memberId = await resolveMember(client, room.id, guestToken);
    const { rows: memberRows } = await client.query<{ display_name: string }>(
      "SELECT display_name FROM members WHERE id = $1",
      [memberId],
    );
    const displayName = memberRows[0]?.display_name ?? "Tamu";

    const { rows: inserted } = await client.query<RoomEventRow>(
      `INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
       VALUES ($1, $2, 'CHAT_MESSAGE', 'MEMBER', $3, NOW())
       RETURNING id, room_id, member_id, event_type, sender_type, message, created_at`,
      [room.id, memberId, clean],
    );
    return {
      ...inserted[0],
      display_name: displayName,
    };
  } finally {
    client.release();
  }
}
