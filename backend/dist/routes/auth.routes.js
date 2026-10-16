import { Router } from "express";
import { googleHandler, loginHandler, meHandler, registerHandler, updateProfileHandler, } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
export const authRouter = Router();
authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/google", googleHandler);
authRouter.get("/me", requireAuth, meHandler);
authRouter.patch("/profile", requireAuth, updateProfileHandler);
//# sourceMappingURL=auth.routes.js.map