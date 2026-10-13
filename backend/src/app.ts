import "./config.js";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { env } from "./config.js";
import { optionalAuth } from "./middleware/auth.js";
import { authLimiter } from "./middleware/rateLimit.js";
import { authRouter } from "./routes/auth.routes.js";
import { roomsRouter } from "./routes/rooms.routes.js";

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        env.corsOrigin === "*" ||
        origin === env.corsOrigin ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(optionalAuth);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authLimiter, authRouter);
app.use("/auth", authLimiter, authRouter);

app.use("/api/rooms", roomsRouter);
app.use("/rooms", roomsRouter);

// Express 5 forwards rejected async handlers here automatically.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan di server." });
});

export default app;
