import { Router } from "express";
import {
  claimItemHandler,
  closeRoomHandler,
  createRoomHandler,
  deleteRoomHandler,
  getRoomHandler,
  joinRoomHandler,
  lockRoomHandler,
  myRoomsHandler,
  rejectPaymentHandler,
  splitUnclaimedHandler,
  submitPaymentProofHandler,
  unclaimItemHandler,
  unlockRoomHandler,
  verifyPaymentHandler,
  getRoomEventsHandler,
  postChatHandler,
  scanReceiptOcrHandler,
  updateRoomPhotoHandler,
  addReceiptHandler,
  deleteReceiptHandler,
} from "../controllers/rooms.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { claimLimiter, joinLimiter } from "../middleware/rateLimit.js";

export const roomsRouter = Router();

roomsRouter.post("/:code/receipts", optionalAuth, addReceiptHandler);
roomsRouter.delete("/:code/receipts/:receiptId", optionalAuth, deleteReceiptHandler);

roomsRouter.post("/ocr", scanReceiptOcrHandler);
roomsRouter.post("/:code/ocr", scanReceiptOcrHandler);
roomsRouter.post("/", optionalAuth, createRoomHandler);
// route statis /mine wajib di atas /:code, kalau tidak /mine ketangkep sebagai code dinamis.
roomsRouter.get("/mine", requireAuth, myRoomsHandler);
roomsRouter.post("/:code/join", optionalAuth, joinLimiter, joinRoomHandler);
roomsRouter.get("/:code", getRoomHandler);
roomsRouter.delete("/:code", optionalAuth, deleteRoomHandler);
roomsRouter.post("/:code/lock", optionalAuth, lockRoomHandler);
roomsRouter.post("/:code/unlock", optionalAuth, unlockRoomHandler);
roomsRouter.post("/:code/close", optionalAuth, closeRoomHandler);
roomsRouter.post("/:code/split-unclaimed", optionalAuth, splitUnclaimedHandler);
roomsRouter.post("/:code/items/:itemId/claim", claimLimiter, claimItemHandler);
roomsRouter.delete("/:code/items/:itemId/claim", claimLimiter, unclaimItemHandler);
roomsRouter.post("/:code/payments/proof", submitPaymentProofHandler);
roomsRouter.post("/:code/payments/:memberId/verify", optionalAuth, verifyPaymentHandler);
roomsRouter.post("/:code/payments/:memberId/reject", optionalAuth, rejectPaymentHandler);
roomsRouter.get("/:code/events", getRoomEventsHandler);
roomsRouter.post("/:code/chat", postChatHandler);
roomsRouter.post("/:code/photo", updateRoomPhotoHandler);


