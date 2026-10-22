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
  roundMode?: string;
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

  const roundMode = input.roundMode || "hundred";

  for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt++) {
    const roomCode = generateRoomCode(input.title);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { rows: roomRows } = await client.query<{ id: string; status: string }>(
        `INSERT INTO rooms (
           room_code, title, host_user_id, bank_name, bank_account_no, bank_account_name,
           subtotal, tax_amount, service_amount, discount_amount, grand_total, qris_image_url, receipt_image_url, round_mode
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
          roundMode,
        ],
      );
      const roomId = roomRows[0].id;

      const { rows: memberRows } = await client.query<{ id: string }>(
        `INSERT INTO members (room_id, user_id, guest_token, display_name, is_host)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING id`,
        [roomId, input.hostUserId ?? null, hostToken, input.hostName],
      );
      const hostMemberId = memberRows[0]?.id;

      // Insert primary receipt record
      const { rows: receiptRows } = await client.query<{ id: string }>(
        `INSERT INTO receipts (
           room_id, payer_member_id, payer_name, title, receipt_image_url,
           subtotal, tax_amount, service_amount, discount_amount, grand_total,
           bank_name, bank_account_no, bank_account_name, qris_image_url,
           created_by_member_id, sort_order
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0)
         RETURNING id`,
        [
          roomId,
          hostMemberId ?? null,
          input.hostName,
          input.title,
          input.receiptImageUrl ?? null,
          subtotal,
          input.taxAmount,
          input.serviceAmount,
          input.discountAmount,
          grandTotal,
          input.bankName ?? null,
          input.bankAccountNo ?? null,
          input.bankAccountName ?? null,
          input.qrisImageUrl ?? null,
          hostMemberId ?? null,
        ],
      );
      const primaryReceiptId = receiptRows[0]?.id ?? null;

      if (input.items.length > 0) {
        const itemValues: unknown[] = [];
        const placeholders: string[] = [];
        for (let i = 0; i < input.items.length; i++) {
          const item = input.items[i];
          const offset = i * 6;
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
          itemValues.push(roomId, item.name, item.unitPrice, item.quantity, i, primaryReceiptId);
        }
        await client.query(
          `INSERT INTO items (room_id, name, unit_price, quantity, sort_order, receipt_id)
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

/** "Budi" -> "Budi (2)" jika "Budi" sudah terpakai di room ini (case-insensitive). */
async function resolveDisplayName(
  client: PoolClient,
  roomId: string,
  desiredName: string,
) {
  const trimmed = desiredName.trim();
  const { rows } = await client.query<{ display_name: string }>(
    `SELECT display_name FROM members WHERE room_id = $1 AND LOWER(display_name) LIKE LOWER($2) || '%'`,
    [roomId, trimmed],
  );
  const takenLower = new Set(rows.map((r) => r.display_name.trim().toLowerCase()));
  if (!takenLower.has(trimmed.toLowerCase())) return trimmed;

  let n = 2;
  while (takenLower.has(`${trimmed.toLowerCase()} (${n})`)) n++;
  return `${trimmed} (${n})`;
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

export interface ReceiptDetailRow {
  id: string;
  title: string;
  payer_member_id: string | null;
  payer_name: string | null;
  subtotal: string | number;
  tax_amount: string | number;
  service_amount: string | number;
  discount_amount: string | number;
  grand_total: string | number;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
  qris_image_url: string | null;
  receipt_image_url: string | null;
  created_by_member_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface MemberReceiptBreakdown {
  receiptId: string;
  title: string;
  payerMemberId: string | null;
  payerName: string;
  amount: number;
  bankName: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  qrisImageUrl: string | null;
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
  group_photo_url: string | null;
  round_mode: string | null;
  receipts: ReceiptDetailRow[];
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
  receipt_id: string | null;
}

interface MemberRowFull {
  id: string;
  user_id: string | null;
  display_name: string;
  is_host: boolean;
  avatar_url?: string | null;
}

interface ClaimJoinRow {
  item_id: string;
  member_id: string;
  portion_quantity: string;
  unit_price: string;
  quantity: number;
  is_shared: boolean;
  receipt_id: string | null;
}

export function applyRounding(amount: number, roundMode: string = "hundred"): number {
  if (amount <= 0) return 0;
  if (roundMode === "thousand") {
    return Math.ceil(amount / 1000) * 1000;
  }
  if (roundMode === "none") {
    return Math.round(amount);
  }
  // Default: round up to hundreds
  return Math.ceil(amount / 100) * 100;
}

/** Hitung berapa rupiah tiap member nanggung, proporsional ke porsi yang
 *  benar-benar diklaim - akurat per struk jika ada multi-struk. */
function computeMemberShares(
  members: MemberRowFull[],
  claims: ClaimJoinRow[],
  receipts: ReceiptDetailRow[],
  room: {
    title: string;
    subtotal: number;
    taxAmount: number;
    serviceAmount: number;
    discountAmount: number;
    grandTotal: number;
    bankName: string | null;
    bankAccountNo: string | null;
    bankAccountName: string | null;
    qrisImageUrl: string | null;
    roundMode?: string;
  },
) {
  const host = members.find((m) => m.is_host);

  // Jika ada multi-receipt: hitung proporsional per struk
  if (receipts && receipts.length > 0) {
    const claimsByItem = new Map<string, ClaimJoinRow[]>();
    for (const claim of claims) {
      const list = claimsByItem.get(claim.item_id) ?? [];
      list.push(claim);
      claimsByItem.set(claim.item_id, list);
    }

    const receiptMemberSubtotals = new Map<string, Map<string, number>>();
    for (const rc of receipts) {
      receiptMemberSubtotals.set(rc.id, new Map<string, number>());
    }

    const defaultReceiptId = receipts[0]?.id;

    for (const itemClaims of claimsByItem.values()) {
      const first = itemClaims[0];
      const itemTotal = Number(first.unit_price) * first.quantity;
      const targetReceiptId = first.receipt_id || defaultReceiptId;
      const memberSubMap = receiptMemberSubtotals.get(targetReceiptId) ?? receiptMemberSubtotals.get(defaultReceiptId);

      if (memberSubMap) {
        if (first.is_shared) {
          const perClaimer = itemTotal / itemClaims.length;
          for (const claim of itemClaims) {
            memberSubMap.set(
              claim.member_id,
              (memberSubMap.get(claim.member_id) ?? 0) + perClaimer,
            );
          }
        } else {
          const pricePerUnit = first.quantity > 0 ? itemTotal / first.quantity : 0;
          for (const claim of itemClaims) {
            memberSubMap.set(
              claim.member_id,
              (memberSubMap.get(claim.member_id) ?? 0) +
                pricePerUnit * Number(claim.portion_quantity),
            );
          }
        }
      }
    }

    return members.map((member) => {
      const breakdown: MemberReceiptBreakdown[] = [];
      let totalRawShare = 0;
      let totalSubtotalShare = 0;

      for (const rc of receipts) {
        const memberSubMap = receiptMemberSubtotals.get(rc.id);
        const itemSub = memberSubMap?.get(member.id) ?? 0;
        const rcSub = Number(rc.subtotal);
        const ratio = rcSub > 0 ? itemSub / rcSub : 0;
        const taxShare = Number(rc.tax_amount) * ratio;
        const svcShare = Number(rc.service_amount) * ratio;
        const discShare = Number(rc.discount_amount) * ratio;
        const rawReceiptShare = Math.max(0, itemSub + taxShare + svcShare - discShare);
        const roundedReceiptShare = applyRounding(rawReceiptShare, room.roundMode ?? "hundred");

        totalSubtotalShare += itemSub;
        totalRawShare += rawReceiptShare;

        if (roundedReceiptShare > 0 || itemSub > 0) {
          breakdown.push({
            receiptId: rc.id,
            title: rc.title,
            payerMemberId: rc.payer_member_id,
            payerName: rc.payer_name || "Host",
            amount: roundedReceiptShare,
            bankName: rc.bank_name || room.bankName,
            bankAccountNo: rc.bank_account_no || room.bankAccountNo,
            bankAccountName: rc.bank_account_name || room.bankAccountName,
            qrisImageUrl: rc.qris_image_url || room.qrisImageUrl,
          });
        }
      }

      const totalShareAmount = breakdown.reduce((sum, b) => sum + b.amount, 0);

      return {
        id: member.id,
        userId: member.user_id,
        displayName: member.display_name,
        avatarUrl: member.avatar_url ?? null,
        isHost: member.is_host,
        subtotalShare: Math.round(totalSubtotalShare),
        rawShareAmount: Math.round(totalRawShare),
        shareAmount: totalShareAmount,
        receiptBreakdown: breakdown,
        claimedItemIds: claims
          .filter((c) => c.member_id === member.id)
          .map((c) => c.item_id),
      };
    });
  }

  // Fallback untuk room lama tanpa tabel receipts
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
    const rawShare = Math.max(
      0,
      itemSubtotal + taxShare + serviceShare - discountShare,
    );
    const shareAmount = applyRounding(rawShare, room.roundMode ?? "hundred");

    return {
      id: member.id,
      userId: member.user_id,
      displayName: member.display_name,
      avatarUrl: member.avatar_url ?? null,
      isHost: member.is_host,
      subtotalShare: Math.round(itemSubtotal),
      rawShareAmount: Math.round(rawShare),
      shareAmount,
      receiptBreakdown: [
        {
          receiptId: "primary",
          title: room.title,
          payerMemberId: host?.id ?? null,
          payerName: host?.display_name ?? "Host",
          amount: shareAmount,
          bankName: room.bankName,
          bankAccountNo: room.bankAccountNo,
          bankAccountName: room.bankAccountName,
          qrisImageUrl: room.qrisImageUrl,
        },
      ],
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
       r.qris_image_url, r.receipt_image_url, r.group_photo_url, r.round_mode,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'id', rc.id,
           'title', rc.title,
           'payer_member_id', rc.payer_member_id,
           'payer_name', rc.payer_name,
           'subtotal', rc.subtotal,
           'tax_amount', rc.tax_amount,
           'service_amount', rc.service_amount,
           'discount_amount', rc.discount_amount,
           'grand_total', rc.grand_total,
           'bank_name', rc.bank_name,
           'bank_account_no', rc.bank_account_no,
           'bank_account_name', rc.bank_account_name,
           'qris_image_url', rc.qris_image_url,
           'receipt_image_url', rc.receipt_image_url,
           'created_by_member_id', rc.created_by_member_id,
           'sort_order', rc.sort_order,
           'created_at', rc.created_at
         ) ORDER BY rc.sort_order ASC, rc.created_at ASC), '[]'::json)
         FROM receipts rc
         WHERE rc.room_id = r.id
       ) AS receipts,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'id', i.id,
           'name', i.name,
           'unit_price', i.unit_price,
           'quantity', i.quantity,
           'is_shared', i.is_shared,
           'receipt_id', i.receipt_id
         ) ORDER BY i.sort_order ASC, i.created_at ASC), '[]'::json)
         FROM items i
         WHERE i.room_id = r.id
       ) AS items,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'id', m.id,
           'user_id', m.user_id,
           'display_name', m.display_name,
           'is_host', m.is_host,
           'avatar_url', u.avatar_url
         ) ORDER BY m.is_host DESC, m.joined_at ASC), '[]'::json)
         FROM members m
         LEFT JOIN users u ON u.id = m.user_id
         WHERE m.room_id = r.id
       ) AS members,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'item_id', ic.item_id,
           'member_id', ic.member_id,
           'portion_quantity', ic.portion_quantity,
           'unit_price', i.unit_price,
           'quantity', i.quantity,
           'is_shared', i.is_shared,
           'receipt_id', i.receipt_id
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
  const receiptRows = room.receipts || [];

  const paymentsByMember = new Map<string, PaymentRow>();
  for (const p of paymentRows) {
    paymentsByMember.set(p.member_id, p);
  }

  const roomTotals = {
    title: room.title,
    subtotal: Number(room.subtotal),
    taxAmount: Number(room.tax_amount),
    serviceAmount: Number(room.service_amount),
    discountAmount: Number(room.discount_amount),
    grandTotal: Number(room.grand_total),
    bankName: room.bank_name,
    bankAccountNo: room.bank_account_no,
    bankAccountName: room.bank_account_name,
    qrisImageUrl: room.qris_image_url,
    roundMode: room.round_mode ?? "hundred",
  };
  const rawMembers = computeMemberShares(memberRows, claimRows, receiptRows, roomTotals);
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
    groupPhotoUrl: room.group_photo_url,
    roundMode: room.round_mode ?? "hundred",
    receipts: receiptRows.map((rc) => ({
      id: rc.id,
      title: rc.title,
      payerMemberId: rc.payer_member_id,
      payerName: rc.payer_name || "Host",
      subtotal: Number(rc.subtotal),
      taxAmount: Number(rc.tax_amount),
      serviceAmount: Number(rc.service_amount),
      discountAmount: Number(rc.discount_amount),
      grandTotal: Number(rc.grand_total),
      bankName: rc.bank_name,
      bankAccountNo: rc.bank_account_no,
      bankAccountName: rc.bank_account_name,
      qrisImageUrl: rc.qris_image_url,
      receiptImageUrl: rc.receipt_image_url,
      createdByMemberId: rc.created_by_member_id,
      sortOrder: rc.sort_order,
      createdAt: rc.created_at,
    })),
    items: itemRows.map((item) => {
      const itemClaims = claimsByItem.get(item.id) ?? [];
      return {
        id: item.id,
        name: item.name,
        unitPrice: Number(item.unit_price),
        quantity: item.quantity,
        isShared: item.is_shared,
        receiptId: item.receipt_id ?? null,
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

    const { rows: eventRows } = await client.query<{
      id: string;
      room_id: string;
      member_id: string;
      event_type: string;
      sender_type: "SYSTEM" | "MEMBER";
      message: string;
      created_at: string;
    }>(
      `INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
       VALUES ($1, $2, 'CLAIM_ITEM', 'SYSTEM', $3, NOW())
       RETURNING id, room_id, member_id, event_type, sender_type, message, created_at`,
      [room.id, memberId, `${memberName} mengklaim 1x ${item.name}`],
    );

    await client.query("COMMIT");

    return {
      event: {
        id: eventRows[0].id,
        member_id: eventRows[0].member_id,
        display_name: memberName,
        event_type: eventRows[0].event_type,
        sender_type: eventRows[0].sender_type,
        message: eventRows[0].message,
        created_at: eventRows[0].created_at,
      },
    };
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

    const { rows: eventRows } = await client.query<{
      id: string;
      room_id: string;
      member_id: string;
      event_type: string;
      sender_type: "SYSTEM" | "MEMBER";
      message: string;
      created_at: string;
    }>(
      `INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
       VALUES ($1, $2, 'UNCLAIM_ITEM', 'SYSTEM', $3, NOW())
       RETURNING id, room_id, member_id, event_type, sender_type, message, created_at`,
      [room.id, memberId, `${memberName} melepas porsi ${itemName}`],
    );

    await client.query("COMMIT");

    return {
      event: {
        id: eventRows[0].id,
        member_id: eventRows[0].member_id,
        display_name: memberName,
        event_type: eventRows[0].event_type,
        sender_type: eventRows[0].sender_type,
        message: eventRows[0].message,
        created_at: eventRows[0].created_at,
      },
    };
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
    `UPDATE rooms
     SET status = 'CLOSED',
         closed_at = NOW(),
         receipt_image_url = NULL,
         media_purged_at = NOW(),
         updated_at = NOW()
     WHERE id = $1 RETURNING status`,
    [room.id],
  );

  // F10 Ephemeral Storage Purge: Hapus bukti pembayaran ketika room ditutup
  await pool.query(
    `UPDATE payments SET proof_image_url = NULL WHERE room_id = $1`,
    [room.id],
  );

  return { status: updated[0].status };
}

/**
 * F10 Ephemeral Storage Auto-Purge Worker:
 * Membersihkan gambar bukti transfer dan struk kasir untuk room yang sudah CLOSED
 * atau room yang umurnya lebih dari 7 hari untuk menghemat kapasitas disk dan menjaga privasi.
 */
export async function purgeOldRoomMedia() {
  try {
    const { rows: targetRooms } = await pool.query<{ id: string; room_code: string }>(
      `SELECT id, room_code FROM rooms
       WHERE (status = 'CLOSED' OR created_at < NOW() - INTERVAL '7 days')
         AND (media_purged_at IS NULL OR receipt_image_url IS NOT NULL)`
    );

    if (targetRooms.length === 0) return { purgedRoomsCount: 0 };

    for (const r of targetRooms) {
      await pool.query(
        `UPDATE payments SET proof_image_url = NULL WHERE room_id = $1 AND proof_image_url IS NOT NULL`,
        [r.id],
      );
      await pool.query(
        `UPDATE rooms SET receipt_image_url = NULL, media_purged_at = NOW() WHERE id = $1`,
        [r.id],
      );
    }

    console.log(`[Storage Purge Worker] Purged ephemeral media for ${targetRooms.length} room(s).`);
    return { purgedRoomsCount: targetRooms.length };
  } catch (err) {
    console.error("[Storage Purge Worker Error]", err);
    return { purgedRoomsCount: 0 };
  }
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

export async function updateRoomGroupPhoto(roomCode: string, groupPhotoUrl: string | null) {
  const { rows } = await pool.query<{ id: string }>(
    "SELECT id FROM rooms WHERE room_code = $1",
    [roomCode],
  );
  const room = rows[0];
  if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);

  await pool.query(
    "UPDATE rooms SET group_photo_url = $1, updated_at = NOW() WHERE id = $2",
    [groupPhotoUrl, room.id],
  );

  return { groupPhotoUrl };
}

export interface AddReceiptItemInput {
  name: string;
  unitPrice: number;
  quantity: number;
  isShared?: boolean;
}

export interface AddReceiptInput {
  title: string;
  receiptImageUrl?: string;
  payerMemberId?: string;
  payerName?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  qrisImageUrl?: string;
  taxAmount: number;
  serviceAmount: number;
  discountAmount: number;
  items: AddReceiptItemInput[];
}

export async function addReceiptToRoom(
  roomCode: string,
  input: AddReceiptInput,
  callerGuestToken?: string,
  callerUserId?: string,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: roomRows } = await client.query<{ id: string; status: string; round_mode: string | null }>(
      "SELECT id, status, round_mode FROM rooms WHERE room_code = $1 FOR UPDATE",
      [roomCode],
    );
    const room = roomRows[0];
    if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
    if (room.status === "CLOSED") {
      throw new RoomLockedError("Meja ini sudah selesai (closed), tidak bisa menambah struk.");
    }

    let callerMemberId: string | null = null;
    let callerName: string = "Member";
    if (callerGuestToken) {
      const { rows: memRows } = await client.query<{ id: string; display_name: string }>(
        "SELECT id, display_name FROM members WHERE room_id = $1 AND guest_token = $2",
        [room.id, callerGuestToken],
      );
      if (memRows[0]) {
        callerMemberId = memRows[0].id;
        callerName = memRows[0].display_name;
      }
    }
    if (!callerMemberId && callerUserId) {
      const { rows: memRows } = await client.query<{ id: string; display_name: string }>(
        "SELECT id, display_name FROM members WHERE room_id = $1 AND user_id = $2",
        [room.id, callerUserId],
      );
      if (memRows[0]) {
        callerMemberId = memRows[0].id;
        callerName = memRows[0].display_name;
      }
    }

    // Pastikan room memiliki struk utama jika room dibuat sebelum migrasi multi-struk
    const { rows: existingRc } = await client.query<{ id: string }>(
      "SELECT id FROM receipts WHERE room_id = $1 ORDER BY sort_order ASC, created_at ASC LIMIT 1",
      [room.id],
    );
    if (!existingRc[0]) {
      const { rows: hostRows } = await client.query<{ id: string; display_name: string }>(
        "SELECT id, display_name FROM members WHERE room_id = $1 AND is_host = TRUE LIMIT 1",
        [room.id],
      );
      const hostMem = hostRows[0];
      const { rows: roomFullRows } = await client.query<{
        title: string;
        receipt_image_url: string | null;
        subtotal: number;
        tax_amount: number;
        service_amount: number;
        discount_amount: number;
        grand_total: number;
        bank_name: string | null;
        bank_account_no: string | null;
        bank_account_name: string | null;
        qris_image_url: string | null;
      }>(
        `SELECT title, receipt_image_url, subtotal, tax_amount, service_amount, discount_amount,
                grand_total, bank_name, bank_account_no, bank_account_name, qris_image_url
         FROM rooms WHERE id = $1`,
        [room.id],
      );
      const rFull = roomFullRows[0];
      if (rFull) {
        const { rows: primaryRcRows } = await client.query<{ id: string }>(
          `INSERT INTO receipts (
             room_id, payer_member_id, payer_name, title, receipt_image_url,
             subtotal, tax_amount, service_amount, discount_amount, grand_total,
             bank_name, bank_account_no, bank_account_name, qris_image_url,
             created_by_member_id, sort_order
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0)
           RETURNING id`,
          [
            room.id,
            hostMem?.id ?? null,
            hostMem?.display_name ?? "Host",
            rFull.title,
            rFull.receipt_image_url,
            rFull.subtotal,
            rFull.tax_amount,
            rFull.service_amount,
            rFull.discount_amount,
            rFull.grand_total,
            rFull.bank_name,
            rFull.bank_account_no,
            rFull.bank_account_name,
            rFull.qris_image_url,
            hostMem?.id ?? null,
          ],
        );
        const primaryRcId = primaryRcRows[0].id;
        await client.query(
          "UPDATE items SET receipt_id = $1 WHERE room_id = $2 AND receipt_id IS NULL",
          [primaryRcId, room.id],
        );
      }
    }

    let payerMemberId: string | null = input.payerMemberId || callerMemberId;
    let payerName = input.payerName;
    if (payerMemberId) {
      const { rows: pRows } = await client.query<{ display_name: string }>(
        "SELECT display_name FROM members WHERE id = $1 AND room_id = $2",
        [payerMemberId, room.id],
      );
      if (pRows[0]) {
        if (!payerName) payerName = pRows[0].display_name;
      } else {
        payerMemberId = null;
      }
    }
    if (!payerName) payerName = callerName;

    const subtotal = input.items.reduce((s, it) => s + Math.round(it.unitPrice) * it.quantity, 0);
    const taxAmt = Math.round(input.taxAmount);
    const serviceAmt = Math.round(input.serviceAmount);
    const discountAmt = Math.round(input.discountAmount);
    const grandTotal = Math.max(0, subtotal + taxAmt + serviceAmt - discountAmt);

    const { rows: sortRows } = await client.query<{ max_order: number | null }>(
      "SELECT MAX(sort_order) AS max_order FROM receipts WHERE room_id = $1",
      [room.id],
    );
    const nextOrder = (sortRows[0]?.max_order ?? 0) + 1;

    const { rows: newReceiptRows } = await client.query<{ id: string }>(
      `INSERT INTO receipts (
         room_id, payer_member_id, payer_name, title, receipt_image_url,
         subtotal, tax_amount, service_amount, discount_amount, grand_total,
         bank_name, bank_account_no, bank_account_name, qris_image_url,
         created_by_member_id, sort_order
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING id`,
      [
        room.id,
        payerMemberId ?? null,
        payerName ?? "Host",
        input.title,
        input.receiptImageUrl ?? null,
        subtotal,
        taxAmt,
        serviceAmt,
        discountAmt,
        grandTotal,
        input.bankName ?? null,
        input.bankAccountNo ?? null,
        input.bankAccountName ?? null,
        input.qrisImageUrl ?? null,
        callerMemberId ?? null,
        nextOrder,
      ],
    );
    const receiptId = newReceiptRows[0].id;

    if (input.items.length > 0) {
      const itemValues: unknown[] = [];
      const placeholders: string[] = [];
      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i];
        const offset = i * 7;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
        itemValues.push(room.id, item.name, Math.round(item.unitPrice), item.quantity, item.isShared ?? false, i, receiptId);
      }
      await client.query(
        `INSERT INTO items (room_id, name, unit_price, quantity, is_shared, sort_order, receipt_id)
         VALUES ${placeholders.join(", ")}`,
        itemValues,
      );
    }

    // Recalculate room totals from all receipts
    await client.query(
      `UPDATE rooms r
       SET subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM receipts WHERE room_id = r.id),
           tax_amount = (SELECT COALESCE(SUM(tax_amount), 0) FROM receipts WHERE room_id = r.id),
           service_amount = (SELECT COALESCE(SUM(service_amount), 0) FROM receipts WHERE room_id = r.id),
           discount_amount = (SELECT COALESCE(SUM(discount_amount), 0) FROM receipts WHERE room_id = r.id),
           grand_total = (SELECT COALESCE(SUM(grand_total), 0) FROM receipts WHERE room_id = r.id),
           updated_at = NOW()
       WHERE r.id = $1`,
      [room.id],
    );

    // If room was LOCKED, unlock it back to CLAIMING so members can claim new items!
    if (room.status === "LOCKED") {
      await client.query("UPDATE rooms SET status = 'CLAIMING', locked_at = NULL WHERE id = $1", [room.id]);
    }

    await client.query(
      `INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
       VALUES ($1, $2, 'RECEIPT_ADDED', 'SYSTEM', $3, NOW())`,
      [room.id, callerMemberId ?? null, `${callerName} menambahkan struk baru: ${input.title}`],
    );

    await client.query("COMMIT");

    return await getRoomByCode(roomCode);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteReceiptFromRoom(
  roomCode: string,
  receiptId: string,
  callerGuestToken?: string,
  callerUserId?: string,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: roomRows } = await client.query<{ id: string; status: string; host_user_id: string | null }>(
      "SELECT id, status, host_user_id FROM rooms WHERE room_code = $1 FOR UPDATE",
      [roomCode],
    );
    const room = roomRows[0];
    if (!room) throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
    if (room.status === "CLOSED") {
      throw new RoomLockedError("Meja ini sudah selesai (closed), tidak bisa menghapus struk.");
    }

    // Pastikan tidak menghapus satu-satunya struk yang ada
    const { rows: countRows } = await client.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM receipts WHERE room_id = $1",
      [room.id],
    );
    if (Number(countRows[0]?.count ?? 0) <= 1) {
      throw new Error("Struk utama tidak bisa dihapus. Minimal harus ada 1 struk dalam room.");
    }

    let callerMemberId: string | null = null;
    let callerName: string = "Member";
    if (callerGuestToken) {
      const { rows: memRows } = await client.query<{ id: string; display_name: string }>(
        "SELECT id, display_name FROM members WHERE room_id = $1 AND guest_token = $2",
        [room.id, callerGuestToken],
      );
      if (memRows[0]) {
        callerMemberId = memRows[0].id;
        callerName = memRows[0].display_name;
      }
    }
    if (!callerMemberId && callerUserId) {
      const { rows: memRows } = await client.query<{ id: string; display_name: string }>(
        "SELECT id, display_name FROM members WHERE room_id = $1 AND user_id = $2",
        [room.id, callerUserId],
      );
      if (memRows[0]) {
        callerMemberId = memRows[0].id;
        callerName = memRows[0].display_name;
      }
    }

    const { rows: rcRows } = await client.query<{ id: string; title: string; created_by_member_id: string | null }>(
      "SELECT id, title, created_by_member_id FROM receipts WHERE id = $1 AND room_id = $2",
      [receiptId, room.id],
    );
    const rc = rcRows[0];
    if (!rc) throw new Error("Struk tidak ditemukan.");

    // Delete receipt (cascade deletes items and claims)
    await client.query("DELETE FROM receipts WHERE id = $1", [receiptId]);

    // Recalculate room totals
    await client.query(
      `UPDATE rooms r
       SET subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM receipts WHERE room_id = r.id),
           tax_amount = (SELECT COALESCE(SUM(tax_amount), 0) FROM receipts WHERE room_id = r.id),
           service_amount = (SELECT COALESCE(SUM(service_amount), 0) FROM receipts WHERE room_id = r.id),
           discount_amount = (SELECT COALESCE(SUM(discount_amount), 0) FROM receipts WHERE room_id = r.id),
           grand_total = (SELECT COALESCE(SUM(grand_total), 0) FROM receipts WHERE room_id = r.id),
           updated_at = NOW()
       WHERE r.id = $1`,
      [room.id],
    );

    await client.query(
      `INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
       VALUES ($1, $2, 'RECEIPT_DELETED', 'SYSTEM', $3, NOW())`,
      [room.id, callerMemberId ?? null, `Struk ${rc.title} telah dihapus oleh ${callerName}`],
    );

    await client.query("COMMIT");

    return await getRoomByCode(roomCode);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

