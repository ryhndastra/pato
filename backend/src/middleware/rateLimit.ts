import rateLimit from "express-rate-limit";

const MESSAGE = { error: "Terlalu banyak percobaan. Coba lagi sebentar lagi." };

// Limiter terpisah per-bucket supaya trafik GET normal tidak ikut kena.
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: MESSAGE,
});

export const joinLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: MESSAGE,
});
