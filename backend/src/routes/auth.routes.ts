import { Router } from "express";
import {
  googleHandler,
  loginHandler,
  registerHandler,
} from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/google", googleHandler);
