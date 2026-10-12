import "./config.js";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { env } from "./config.js";
import { optionalAuth } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.routes.js";
import { roomsRouter } from "./routes/rooms.routes.js";

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(optionalAuth);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/rooms", roomsRouter);

// Express 5 forwards rejected async handlers here automatically.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan di server." });
});

app.listen(env.port, () => {
  console.log(`PaTo backend jalan di http://localhost:${env.port}`);
});
