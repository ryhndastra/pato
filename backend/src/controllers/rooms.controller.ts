import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config.js";
import { createRoom, joinRoom, RoomNotFoundError } from "../services/rooms.service.js";

const createRoomSchema = z.object({
  title: z.string().trim().min(3).max(150),
  host_name: z.string().trim().min(1).max(60),
  bank_name: z.string().trim().max(50).optional(),
  bank_account_no: z.string().trim().max(50).optional(),
  bank_account_name: z.string().trim().max(100).optional(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(150),
        unit_price: z.number().int().nonnegative(),
        quantity: z.number().int().positive().max(999),
      }),
    )
    .min(1)
    .max(100),
  tax_amount: z.number().int().nonnegative().default(0),
  service_amount: z.number().int().nonnegative().default(0),
  discount_amount: z.number().int().nonnegative().default(0),
});

export async function createRoomHandler(req: Request, res: Response) {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
    return;
  }

  const {
    title,
    host_name,
    bank_name,
    bank_account_no,
    bank_account_name,
    items,
    tax_amount,
    service_amount,
    discount_amount,
  } = parsed.data;

  const room = await createRoom({
    title,
    hostName: host_name,
    hostUserId: req.userId,
    bankName: bank_name,
    bankAccountNo: bank_account_no,
    bankAccountName: bank_account_name,
    items: items.map((item) => ({
      name: item.name,
      unitPrice: item.unit_price,
      quantity: item.quantity,
    })),
    taxAmount: tax_amount,
    serviceAmount: service_amount,
    discountAmount: discount_amount,
  });

  res.status(201).json({
    room_code: room.roomCode,
    status: room.status,
    host_token: room.hostToken,
    share_url: `${env.frontendUrl}/r/${room.roomCode}`,
    subtotal: room.subtotal,
    grand_total: room.grandTotal,
  });
}

const joinRoomSchema = z.object({
  guest_token: z.string().uuid(),
  display_name: z.string().trim().min(1).max(60),
});

export async function joinRoomHandler(req: Request, res: Response) {
  const parsed = joinRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await joinRoom(String(req.params.code), {
      guestToken: parsed.data.guest_token,
      displayName: parsed.data.display_name,
    });

    res.json({
      member_id: result.memberId,
      display_name: result.displayName,
      is_host: result.isHost,
      room_status: result.roomStatus,
    });
  } catch (error) {
    if (error instanceof RoomNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    throw error;
  }
}
