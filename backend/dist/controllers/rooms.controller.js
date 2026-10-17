import { z } from "zod";
import { env } from "../config.js";
import { parseReceiptWithGemini } from "../services/ocr.service.js";
import { broadcastToRoom } from "../websocket.js";
import { claimItem, closeRoom, createRoom, deleteRoom, ForbiddenError, getRoomByCode, InvalidJoinError, ItemNotFoundError, joinRoom, listMyRooms, lockRoom, MemberNotFoundError, OverclaimError, rejectPayment, RoomLockedError, RoomNotFoundError, splitUnclaimedItems, submitPaymentProof, unclaimItem, unlockRoom, verifyPayment, getRoomEvents, postChatMessage, updateRoomGroupPhoto, } from "../services/rooms.service.js";
const createRoomSchema = z.object({
    title: z.string().trim().min(3).max(150),
    host_name: z.string().trim().min(1).max(60),
    bank_name: z.string().trim().max(50).optional(),
    bank_account_no: z.string().trim().max(50).optional(),
    bank_account_name: z.string().trim().max(100).optional(),
    round_mode: z.enum(["none", "hundred", "thousand"]).optional().default("hundred"),
    qris_image_url: z.string().optional(),
    receipt_image_url: z.string().optional(),
    items: z
        .array(z.object({
        name: z.string().trim().min(1).max(150),
        unit_price: z.number().int().nonnegative(),
        quantity: z.number().int().positive().max(999),
    }))
        .min(1)
        .max(100),
    tax_amount: z.number().int().nonnegative().default(0),
    service_amount: z.number().int().nonnegative().default(0),
    discount_amount: z.number().int().nonnegative().default(0),
});
export async function createRoomHandler(req, res) {
    const parsed = createRoomSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
        return;
    }
    const { title, host_name, bank_name, bank_account_no, bank_account_name, round_mode, qris_image_url, receipt_image_url, items, tax_amount, service_amount, discount_amount, } = parsed.data;
    const room = await createRoom({
        title,
        hostName: host_name,
        hostUserId: req.userId,
        bankName: bank_name,
        bankAccountNo: bank_account_no,
        bankAccountName: bank_account_name,
        qrisImageUrl: qris_image_url,
        receiptImageUrl: receipt_image_url,
        items: items.map((item) => ({
            name: item.name,
            unitPrice: item.unit_price,
            quantity: item.quantity,
        })),
        taxAmount: tax_amount,
        serviceAmount: service_amount,
        discountAmount: discount_amount,
        roundMode: round_mode,
    });
    res.status(201).json({
        room_code: room.roomCode,
        status: room.status,
        host_token: room.hostToken,
        share_url: `${env.frontendUrl}/room/${room.roomCode}`,
        subtotal: room.subtotal,
        grand_total: room.grandTotal,
    });
}
const joinRoomSchema = z.object({
    guest_token: z.string().uuid(),
    display_name: z.string().trim().max(60).default(""),
});
export async function joinRoomHandler(req, res) {
    const parsed = joinRoomSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
        return;
    }
    try {
        const result = await joinRoom(String(req.params.code).toUpperCase(), {
            guestToken: parsed.data.guest_token,
            displayName: parsed.data.display_name,
        }, req.userId);
        const code = String(req.params.code).toUpperCase();
        broadcastToRoom(code, { type: "ROOM_UPDATED", action: "MEMBER_JOINED" });
        res.json({
            member_id: result.memberId,
            display_name: result.displayName,
            is_host: result.isHost,
            room_status: result.roomStatus,
        });
    }
    catch (error) {
        if (error instanceof RoomNotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof InvalidJoinError) {
            res.status(400).json({ error: error.message });
            return;
        }
        throw error;
    }
}
export async function getRoomHandler(req, res) {
    const roomCode = String(req.params.code).toUpperCase();
    try {
        const room = await getRoomByCode(roomCode);
        res.json({
            room_code: room.roomCode,
            title: room.title,
            status: room.status,
            host_user_id: room.hostUserId,
            subtotal: room.subtotal,
            tax_amount: room.taxAmount,
            service_amount: room.serviceAmount,
            discount_amount: room.discountAmount,
            grand_total: room.grandTotal,
            bank_name: room.bankName,
            bank_account_no: room.bankAccountNo,
            bank_account_name: room.bankAccountName,
            qris_image_url: room.qrisImageUrl,
            receipt_image_url: room.receiptImageUrl,
            group_photo_url: room.groupPhotoUrl,
            round_mode: room.roundMode,
            items: room.items.map((item) => ({
                id: item.id,
                name: item.name,
                unit_price: item.unitPrice,
                quantity: item.quantity,
                is_shared: item.isShared,
                claimed_quantity: item.claimedQuantity,
                claimed_by_member_ids: item.claimedByMemberIds,
                claims: item.claims.map((c) => ({
                    member_id: c.memberId,
                    portion_quantity: c.portionQuantity,
                })),
            })),
            members: room.members.map((member) => ({
                id: member.id,
                user_id: member.userId,
                display_name: member.displayName,
                is_host: member.isHost,
                subtotal_share: member.subtotalShare,
                raw_share_amount: member.rawShareAmount,
                share_amount: member.shareAmount,
                claimed_item_ids: member.claimedItemIds,
                payment_status: member.paymentStatus,
                proof_image_url: member.proofImageUrl,
                rejection_reason: member.rejectionReason,
            })),
        });
    }
    catch (error) {
        if (error instanceof RoomNotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        throw error;
    }
}
const claimSchema = z.object({
    guest_token: z.string().uuid(),
});
function handleClaimError(error, res) {
    if (error instanceof RoomNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
    }
    if (error instanceof MemberNotFoundError) {
        res.status(403).json({ error: error.message });
        return;
    }
    if (error instanceof ItemNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
    }
    if (error instanceof RoomLockedError) {
        res.status(409).json({ error: error.message });
        return;
    }
    if (error instanceof OverclaimError) {
        res.status(409).json({ error: error.message });
        return;
    }
    throw error;
}
export async function claimItemHandler(req, res) {
    const parsed = claimSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
        return;
    }
    try {
        const code = String(req.params.code).toUpperCase();
        const { event } = await claimItem(code, String(req.params.itemId), parsed.data.guest_token);
        if (event) {
            broadcastToRoom(code, { type: "CHAT_MESSAGE", data: event });
        }
        broadcastToRoom(code, { type: "ROOM_UPDATED", action: "CLAIM_CHANGED" });
        res.status(204).end();
    }
    catch (error) {
        handleClaimError(error, res);
    }
}
export async function unclaimItemHandler(req, res) {
    const parsed = claimSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
        return;
    }
    try {
        const code = String(req.params.code).toUpperCase();
        const { event } = await unclaimItem(code, String(req.params.itemId), parsed.data.guest_token);
        if (event) {
            broadcastToRoom(code, { type: "CHAT_MESSAGE", data: event });
        }
        broadcastToRoom(code, { type: "ROOM_UPDATED", action: "CLAIM_CHANGED" });
        res.status(204).end();
    }
    catch (error) {
        handleClaimError(error, res);
    }
}
export async function lockRoomHandler(req, res) {
    const guestToken = typeof req.body?.guest_token === "string" ? req.body.guest_token : undefined;
    try {
        const code = String(req.params.code).toUpperCase();
        const result = await lockRoom(code, req.userId, guestToken);
        broadcastToRoom(code, { type: "ROOM_UPDATED", action: "ROOM_LOCKED" });
        res.json({ status: result.status });
    }
    catch (error) {
        if (error instanceof RoomNotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof ForbiddenError) {
            res.status(403).json({ error: error.message });
            return;
        }
        throw error;
    }
}
export async function myRoomsHandler(req, res) {
    const rooms = await listMyRooms(req.userId);
    res.json({
        rooms: rooms.map((room) => ({
            room_code: room.roomCode,
            title: room.title,
            status: room.status,
            grand_total: room.grandTotal,
            created_at: room.createdAt,
        })),
    });
}
export async function deleteRoomHandler(req, res) {
    const guestToken = typeof req.body?.guest_token === "string" ? req.body.guest_token : undefined;
    try {
        await deleteRoom(String(req.params.code).toUpperCase(), req.userId, guestToken);
        res.status(204).end();
    }
    catch (error) {
        if (error instanceof RoomNotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof ForbiddenError) {
            res.status(403).json({ error: error.message });
            return;
        }
        throw error;
    }
}
export async function unlockRoomHandler(req, res) {
    const guestToken = typeof req.body?.guest_token === "string" ? req.body.guest_token : undefined;
    try {
        const code = String(req.params.code).toUpperCase();
        const result = await unlockRoom(code, req.userId, guestToken);
        broadcastToRoom(code, { type: "ROOM_UPDATED", action: "ROOM_UNLOCKED" });
        res.json({ status: result.status });
    }
    catch (error) {
        if (error instanceof RoomNotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof ForbiddenError) {
            res.status(403).json({ error: error.message });
            return;
        }
        if (error instanceof RoomLockedError) {
            res.status(409).json({ error: error.message });
            return;
        }
        throw error;
    }
}
export async function closeRoomHandler(req, res) {
    const guestToken = typeof req.body?.guest_token === "string" ? req.body.guest_token : undefined;
    try {
        const code = String(req.params.code).toUpperCase();
        const result = await closeRoom(code, req.userId, guestToken);
        broadcastToRoom(code, { type: "ROOM_UPDATED", action: "ROOM_CLOSED" });
        res.json({ status: result.status });
    }
    catch (error) {
        if (error instanceof RoomNotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof ForbiddenError) {
            res.status(403).json({ error: error.message });
            return;
        }
        throw error;
    }
}
export async function splitUnclaimedHandler(req, res) {
    const guestToken = typeof req.body?.guest_token === "string" ? req.body.guest_token : undefined;
    try {
        const code = String(req.params.code).toUpperCase();
        await splitUnclaimedItems(code, req.userId, guestToken);
        broadcastToRoom(code, { type: "ROOM_UPDATED", action: "UNCLAIMED_SPLIT" });
        res.json({ success: true });
    }
    catch (error) {
        if (error instanceof RoomNotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof ForbiddenError) {
            res.status(403).json({ error: error.message });
            return;
        }
        throw error;
    }
}
const proofSchema = z.object({
    guest_token: z.string().uuid(),
    proof_image_url: z.string().min(1),
});
export async function submitPaymentProofHandler(req, res) {
    const parsed = proofSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
        return;
    }
    try {
        const code = String(req.params.code).toUpperCase();
        await submitPaymentProof(code, parsed.data.guest_token, parsed.data.proof_image_url);
        broadcastToRoom(code, { type: "ROOM_UPDATED", action: "PAYMENT_SUBMITTED" });
        res.json({ success: true });
    }
    catch (error) {
        if (error instanceof RoomNotFoundError || error instanceof MemberNotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        throw error;
    }
}
export async function verifyPaymentHandler(req, res) {
    const guestToken = typeof req.body?.guest_token === "string" ? req.body.guest_token : undefined;
    try {
        const code = String(req.params.code).toUpperCase();
        await verifyPayment(code, String(req.params.memberId), req.userId, guestToken);
        broadcastToRoom(code, { type: "ROOM_UPDATED", action: "PAYMENT_VERIFIED" });
        res.json({ success: true });
    }
    catch (error) {
        if (error instanceof RoomNotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof ForbiddenError) {
            res.status(403).json({ error: error.message });
            return;
        }
        throw error;
    }
}
const rejectSchema = z.object({
    reason: z.string().trim().min(1).max(255),
    guest_token: z.string().optional(),
});
export async function rejectPaymentHandler(req, res) {
    const parsed = rejectSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Alasan penolakan harus diisi." });
        return;
    }
    const guestToken = parsed.data.guest_token;
    try {
        const code = String(req.params.code).toUpperCase();
        await rejectPayment(code, String(req.params.memberId), parsed.data.reason, req.userId, guestToken);
        broadcastToRoom(code, { type: "ROOM_UPDATED", action: "PAYMENT_REJECTED" });
        res.json({ success: true });
    }
    catch (error) {
        if (error instanceof RoomNotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof ForbiddenError) {
            res.status(403).json({ error: error.message });
            return;
        }
        throw error;
    }
}
export async function getRoomEventsHandler(req, res) {
    const roomCode = String(req.params.code).toUpperCase();
    try {
        const events = await getRoomEvents(roomCode);
        res.json(events.map((e) => ({
            id: e.id,
            member_id: e.member_id,
            display_name: e.display_name,
            event_type: e.event_type,
            sender_type: e.sender_type,
            message: e.message,
            created_at: e.created_at,
        })));
    }
    catch (error) {
        if (error instanceof RoomNotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        throw error;
    }
}
const chatSchema = z.object({
    guest_token: z.string().uuid(),
    message: z.string().trim().min(1).max(500),
});
export async function postChatHandler(req, res) {
    const roomCode = String(req.params.code).toUpperCase();
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Pesan tidak valid." });
        return;
    }
    try {
        const event = await postChatMessage(roomCode, parsed.data.guest_token, parsed.data.message);
        const chatPayload = {
            id: event.id,
            member_id: event.member_id,
            display_name: event.display_name,
            event_type: event.event_type,
            sender_type: event.sender_type,
            message: event.message,
            created_at: event.created_at,
        };
        broadcastToRoom(roomCode, { type: "CHAT_MESSAGE", data: chatPayload });
        res.json(chatPayload);
    }
    catch (error) {
        if (error instanceof RoomNotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        if (error instanceof MemberNotFoundError) {
            res.status(400).json({ error: error.message });
            return;
        }
        throw error;
    }
}
const photoSchema = z.object({
    group_photo_url: z.string().nullable(),
});
export async function updateRoomPhotoHandler(req, res) {
    const roomCode = String(req.params.code).toUpperCase();
    const parsed = photoSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Data foto tidak valid." });
        return;
    }
    try {
        const result = await updateRoomGroupPhoto(roomCode, parsed.data.group_photo_url);
        broadcastToRoom(roomCode, { type: "ROOM_UPDATED", action: "PHOTO_UPDATED" });
        res.json(result);
    }
    catch (error) {
        if (error instanceof RoomNotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        throw error;
    }
}
const ocrSchema = z.object({
    image: z.string().min(10, "Foto struk kasir harus dilampirkan."),
});
export async function scanReceiptOcrHandler(req, res) {
    const parsed = ocrSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Foto struk kasir harus dilampirkan dalam format base64." });
        return;
    }
    try {
        const result = await parseReceiptWithGemini(parsed.data.image);
        res.json(result);
    }
    catch (error) {
        console.error("[OCR Controller Error]", error);
        res.status(500).json({
            error: error instanceof Error ? error.message : "Gagal membaca struk kasir dengan AI.",
        });
    }
}
//# sourceMappingURL=rooms.controller.js.map