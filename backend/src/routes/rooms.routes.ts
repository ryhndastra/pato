import { Router } from "express";
import {
  createRoomHandler,
  getRoomHandler,
  joinRoomHandler,
  myRoomsHandler,
} from "../controllers/rooms.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { joinLimiter } from "../middleware/rateLimit.js";

export const roomsRouter = Router();

roomsRouter.post("/", createRoomHandler);
// route statis /mine wajib di atas /:code, kalau tidak /mine ketangkep sebagai code dinamis.
roomsRouter.get("/mine", requireAuth, myRoomsHandler);
roomsRouter.post("/:code/join", joinLimiter, joinRoomHandler);
roomsRouter.get("/:code", getRoomHandler);
