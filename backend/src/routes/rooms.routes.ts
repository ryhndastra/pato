import { Router } from "express";
import { createRoomHandler, joinRoomHandler } from "../controllers/rooms.controller.js";

export const roomsRouter = Router();

roomsRouter.post("/", createRoomHandler);
roomsRouter.post("/:code/join", joinRoomHandler);
