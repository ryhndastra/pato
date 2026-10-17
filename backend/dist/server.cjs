"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// dist/index.js
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_node_http = __toESM(require("node:http"), 1);

// dist/config.js
var import_config = require("dotenv/config");
var env = {
  port: Number(process.env.PORT ?? 4e3),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev_pato_secret_key_12345"),
  googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "",
  geminiApiKeys: (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "").split(",").map((k) => k.trim()).filter(Boolean)
};
if (!process.env.JWT_SECRET) {
  console.warn("\u26A0\uFE0F PERINGATAN: JWT_SECRET belum di-set di environment variables!");
}

// dist/app.js
var import_cors = __toESM(require("cors"), 1);
var import_express3 = __toESM(require("express"), 1);

// dist/utils/jwt.js
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var EXPIRES_IN = "30d";
function signSession(payload) {
  return import_jsonwebtoken.default.sign(payload, env.jwtSecret, { expiresIn: EXPIRES_IN });
}
function verifySession(token) {
  return import_jsonwebtoken.default.verify(token, env.jwtSecret);
}

// dist/middleware/auth.js
function optionalAuth(req, _res, next) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      req.userId = verifySession(token).sub;
    } catch {
    }
  }
  next();
}
function requireAuth(req, res, next) {
  if (!req.userId) {
    res.status(401).json({ error: "Kamu harus login dulu." });
    return;
  }
  next();
}

// dist/middleware/rateLimit.js
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var MESSAGE = { error: "Terlalu banyak percobaan. Coba lagi sebentar lagi." };
var authLimiter = (0, import_express_rate_limit.default)({
  windowMs: 60 * 1e3,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: MESSAGE
});
var joinLimiter = (0, import_express_rate_limit.default)({
  windowMs: 60 * 1e3,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: MESSAGE
});
var claimLimiter = (0, import_express_rate_limit.default)({
  windowMs: 60 * 1e3,
  limit: 90,
  standardHeaders: true,
  legacyHeaders: false,
  message: MESSAGE
});

// dist/routes/auth.routes.js
var import_express = require("express");

// dist/controllers/auth.controller.js
var import_zod = require("zod");

// dist/services/auth.service.js
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_google_auth_library = require("google-auth-library");

// dist/db.js
var import_node_dns = __toESM(require("node:dns"), 1);
var import_pg = __toESM(require("pg"), 1);
import_node_dns.default.setDefaultResultOrder("ipv4first");
var isCloudSsl = process.env.DATABASE_SSL === "true" || Boolean(process.env.DATABASE_URL?.includes("supabase")) || Boolean(process.env.DATABASE_URL?.includes("sslmode=require"));
var pool = new import_pg.default.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloudSsl ? { rejectUnauthorized: false } : void 0,
  connectionTimeoutMillis: 5e3,
  idleTimeoutMillis: 3e5,
  min: process.env.DB_POOL_MIN ? Number(process.env.DB_POOL_MIN) : 2,
  max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 10,
  keepAlive: true,
  keepAliveInitialDelayMillis: 1e4
});
var TRANSIENT_ERROR_CODES = /* @__PURE__ */ new Set([
  "EAI_AGAIN",
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED"
]);
var rawConnect = pool.connect.bind(pool);
function connectWithRetry(callback) {
  if (typeof callback === "function") {
    const attemptConnect = (attempt) => {
      rawConnect((err, client, done) => {
        if (!err) {
          return callback(null, client, done);
        }
        const code = err?.code;
        if (attempt >= 2 || !code || !TRANSIENT_ERROR_CODES.has(code)) {
          return callback(err, client, done);
        }
        setTimeout(() => attemptConnect(attempt + 1), 200 * (attempt + 1));
      });
    };
    attemptConnect(0);
    return;
  }
  return (async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await rawConnect();
      } catch (error) {
        const code = error?.code;
        if (attempt >= 2 || !code || !TRANSIENT_ERROR_CODES.has(code)) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      }
    }
  })();
}
pool.connect = connectWithRetry;

// dist/services/auth.service.js
var EmailTakenError = class extends Error {
};
var InvalidCredentialsError = class extends Error {
};
var GoogleTokenError = class extends Error {
};
var SALT_ROUNDS = 10;
async function registerWithEmail(name, email, password) {
  const { rows: existing } = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.length > 0) {
    throw new EmailTakenError(`Email ${email} sudah terdaftar.`);
  }
  const passwordHash = await import_bcryptjs.default.hash(password, SALT_ROUNDS);
  const { rows } = await pool.query(`INSERT INTO users (email, password_hash, name, auth_provider)
     VALUES ($1, $2, $3, 'local')
     RETURNING id, email, name, avatar_url, password_hash, default_bank_name, default_bank_account_no, default_bank_account_name, default_round_mode`, [email, passwordHash, name]);
  return toAuthUser(rows[0]);
}
async function loginWithEmail(email, password) {
  const { rows } = await pool.query("SELECT id, email, name, avatar_url, password_hash, default_bank_name, default_bank_account_no, default_bank_account_name, default_round_mode FROM users WHERE email = $1", [email]);
  const user = rows[0];
  if (!user || !user.password_hash) {
    throw new InvalidCredentialsError("Email atau kata sandi salah.");
  }
  const matches = await import_bcryptjs.default.compare(password, user.password_hash);
  if (!matches) {
    throw new InvalidCredentialsError("Email atau kata sandi salah.");
  }
  return toAuthUser(user);
}
var googleClient = new import_google_auth_library.OAuth2Client(env.googleClientId);
async function loginWithGoogle(idToken) {
  if (!env.googleClientId) {
    throw new GoogleTokenError("GOOGLE_CLIENT_ID belum dikonfigurasi di server.");
  }
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.googleClientId
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.error("Google token verification error:", err);
    throw new GoogleTokenError("Token Google tidak valid.");
  }
  if (!payload?.email) {
    throw new GoogleTokenError("Token Google tidak punya email.");
  }
  const { rows } = await pool.query(`INSERT INTO users (email, name, avatar_url, auth_provider)
     VALUES ($1, $2, $3, 'google')
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, updated_at = NOW()
     RETURNING id, email, name, avatar_url, password_hash, default_bank_name, default_bank_account_no, default_bank_account_name, default_round_mode`, [payload.email, payload.name ?? payload.email.split("@")[0], payload.picture ?? null]);
  return toAuthUser(rows[0]);
}
function toAuthUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    hasPassword: Boolean(row.password_hash),
    defaultBankName: row.default_bank_name ?? null,
    defaultBankAccountNo: row.default_bank_account_no ?? null,
    defaultBankAccountName: row.default_bank_account_name ?? null,
    defaultRoundMode: row.default_round_mode ?? "hundred"
  };
}
async function getUserById(userId) {
  const { rows } = await pool.query("SELECT id, email, name, avatar_url, password_hash, default_bank_name, default_bank_account_no, default_bank_account_name, default_round_mode FROM users WHERE id = $1", [userId]);
  if (!rows[0])
    return null;
  return toAuthUser(rows[0]);
}
async function updateUserProfile(userId, params) {
  const { rows } = await pool.query("SELECT id, email, name, avatar_url, password_hash FROM users WHERE id = $1", [userId]);
  const user = rows[0];
  if (!user) {
    throw new Error("Pengguna tidak ditemukan.");
  }
  let newPasswordHash = null;
  if (params.newPassword) {
    if (user.password_hash) {
      if (!params.currentPassword) {
        throw new InvalidCredentialsError("Kata sandi saat ini harus diisi.");
      }
      const matches = await import_bcryptjs.default.compare(params.currentPassword, user.password_hash);
      if (!matches) {
        throw new InvalidCredentialsError("Kata sandi saat ini salah.");
      }
    }
    newPasswordHash = await import_bcryptjs.default.hash(params.newPassword, SALT_ROUNDS);
  }
  const updates = ["updated_at = NOW()"];
  const values = [userId];
  let paramIndex = 2;
  if (params.name !== void 0) {
    updates.push(`name = $${paramIndex++}`);
    values.push(params.name.trim());
  }
  if (params.avatarUrl !== void 0) {
    updates.push(`avatar_url = $${paramIndex++}`);
    values.push(params.avatarUrl);
  }
  if (params.defaultBankName !== void 0) {
    updates.push(`default_bank_name = $${paramIndex++}`);
    values.push(params.defaultBankName ? params.defaultBankName.trim() : null);
  }
  if (params.defaultBankAccountNo !== void 0) {
    updates.push(`default_bank_account_no = $${paramIndex++}`);
    values.push(params.defaultBankAccountNo ? params.defaultBankAccountNo.trim() : null);
  }
  if (params.defaultBankAccountName !== void 0) {
    updates.push(`default_bank_account_name = $${paramIndex++}`);
    values.push(params.defaultBankAccountName ? params.defaultBankAccountName.trim() : null);
  }
  if (params.defaultRoundMode !== void 0) {
    updates.push(`default_round_mode = $${paramIndex++}`);
    values.push(params.defaultRoundMode ? params.defaultRoundMode.trim() : "hundred");
  }
  if (newPasswordHash !== null) {
    updates.push(`password_hash = $${paramIndex++}`);
    values.push(newPasswordHash);
  }
  const query = `
    UPDATE users
    SET ${updates.join(", ")}
    WHERE id = $1
    RETURNING id, email, name, avatar_url, password_hash, default_bank_name, default_bank_account_no, default_bank_account_name, default_round_mode
  `;
  const { rows: updatedRows } = await pool.query(query, values);
  return toAuthUser(updatedRows[0]);
}

// dist/controllers/auth.controller.js
function sendSession(res, user, status = 200) {
  const token = signSession({ sub: user.id, email: user.email });
  res.status(status).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatarUrl,
      has_password: user.hasPassword,
      default_bank_name: user.defaultBankName,
      default_bank_account_no: user.defaultBankAccountNo,
      default_bank_account_name: user.defaultBankAccountName,
      default_round_mode: user.defaultRoundMode
    }
  });
}
var registerSchema = import_zod.z.object({
  name: import_zod.z.string().trim().min(1).max(100),
  email: import_zod.z.string().trim().toLowerCase().email(),
  password: import_zod.z.string().min(8).max(100)
});
async function registerHandler(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
    return;
  }
  try {
    const user = await registerWithEmail(parsed.data.name, parsed.data.email, parsed.data.password);
    sendSession(res, user, 201);
  } catch (error) {
    if (error instanceof EmailTakenError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
}
var loginSchema = import_zod.z.object({
  email: import_zod.z.string().trim().toLowerCase().email(),
  password: import_zod.z.string().min(1)
});
async function loginHandler(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
    return;
  }
  try {
    const user = await loginWithEmail(parsed.data.email, parsed.data.password);
    sendSession(res, user);
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: error.message });
      return;
    }
    throw error;
  }
}
var googleSchema = import_zod.z.object({
  id_token: import_zod.z.string().min(1)
});
async function googleHandler(req, res) {
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
    return;
  }
  try {
    const user = await loginWithGoogle(parsed.data.id_token);
    sendSession(res, user);
  } catch (error) {
    if (error instanceof GoogleTokenError) {
      res.status(401).json({ error: error.message });
      return;
    }
    throw error;
  }
}
async function meHandler(req, res) {
  if (!req.userId) {
    res.status(401).json({ error: "Kamu harus login dulu." });
    return;
  }
  const user = await getUserById(req.userId);
  if (!user) {
    res.status(404).json({ error: "Pengguna tidak ditemukan." });
    return;
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatarUrl,
      has_password: user.hasPassword,
      default_bank_name: user.defaultBankName,
      default_bank_account_no: user.defaultBankAccountNo,
      default_bank_account_name: user.defaultBankAccountName,
      default_round_mode: user.defaultRoundMode
    }
  });
}
var updateProfileSchema = import_zod.z.object({
  name: import_zod.z.string().trim().min(1).max(100).optional(),
  avatar_url: import_zod.z.string().nullable().optional(),
  current_password: import_zod.z.string().min(1).optional(),
  new_password: import_zod.z.string().min(8).max(100).optional(),
  default_bank_name: import_zod.z.string().nullable().optional(),
  default_bank_account_no: import_zod.z.string().nullable().optional(),
  default_bank_account_name: import_zod.z.string().nullable().optional(),
  default_round_mode: import_zod.z.enum(["none", "hundred", "thousand"]).optional()
});
async function updateProfileHandler(req, res) {
  if (!req.userId) {
    res.status(401).json({ error: "Kamu harus login dulu." });
    return;
  }
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
    return;
  }
  try {
    const updated = await updateUserProfile(req.userId, {
      name: parsed.data.name,
      avatarUrl: parsed.data.avatar_url,
      currentPassword: parsed.data.current_password,
      newPassword: parsed.data.new_password,
      defaultBankName: parsed.data.default_bank_name,
      defaultBankAccountNo: parsed.data.default_bank_account_no,
      defaultBankAccountName: parsed.data.default_bank_account_name,
      defaultRoundMode: parsed.data.default_round_mode
    });
    res.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        avatar_url: updated.avatarUrl,
        has_password: updated.hasPassword,
        default_bank_name: updated.defaultBankName,
        default_bank_account_no: updated.defaultBankAccountNo,
        default_bank_account_name: updated.defaultBankAccountName,
        default_round_mode: updated.defaultRoundMode
      }
    });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
}

// dist/routes/auth.routes.js
var authRouter = (0, import_express.Router)();
authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/google", googleHandler);
authRouter.get("/me", requireAuth, meHandler);
authRouter.patch("/profile", requireAuth, updateProfileHandler);

// dist/routes/rooms.routes.js
var import_express2 = require("express");

// dist/controllers/rooms.controller.js
var import_zod2 = require("zod");

// dist/services/ocr.service.js
var keyRotationIndex = 0;
var OCR_PROMPT = `
Kamu adalah asisten keuangan ahli pembaca struk restoran kasir di Indonesia untuk aplikasi split bill "PaTo".
Tugasmu adalah membaca gambar struk kasir yang dilampirkan dan mengekstrak rincian item, kuantitas, harga, pajak, dan service secara sangat akurat.

Aturan Penting:
1. Normalisasi nama menu/singkatan khas resto Indonesia ke nama yang jelas & rapi (contoh: 'Slmn Roll' -> 'Salmon Roll', 'Ocha Dngn' -> 'Ocha Dingin', 'Aym Grg' -> 'Ayam Goreng', 'Es T.Mns' -> 'Es Teh Manis').
2. Pisahkan baris Pajak Resto (PB1 / PPN 10-11%) dan Service Charge (5-10%) dari daftar item makanan/minuman! Jangan masukkan pajak/service ke dalam daftar menu items.
3. Kuantitas (quantity) harus bilangan bulat positif (minimal 1). Jika di struk tertulis "2x 15.000", quantity = 2, unitPrice = 15000.
4. Jika struk menampilkan diskon kasir / voucher promo, masukkan ke field discountAmount.
5. Jika ada nama restoran di kepala struk, isi field 'title' dengan nama resto tersebut (misal: "Sushi Tei Senopati", "Kopi Kenangan", "RM Padang Sederhana"). Jika tidak jelas, gunakan "Resto Makan Bareng".
6. Output WAJIB berupa JSON valid murni yang mematuhi skema berikut:
{
  "title": string,
  "items": [
    {
      "name": string,
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number
    }
  ],
  "subtotal": number,
  "taxAmount": number,
  "serviceAmount": number,
  "discountAmount": number,
  "grandTotal": number
}
`;
var CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-2.5-flash"
];
async function parseReceiptWithGemini(imageBase64OrDataUrl) {
  const keys = env.geminiApiKeys;
  if (!keys || keys.length === 0) {
    throw new Error("GEMINI_API_KEYS belum diatur di environment variable backend!");
  }
  let mimeType = "image/jpeg";
  let rawBase64 = imageBase64OrDataUrl;
  if (imageBase64OrDataUrl.startsWith("data:")) {
    const match = imageBase64OrDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      rawBase64 = match[2];
    }
  }
  let lastError = null;
  const totalKeys = keys.length;
  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const currentKey = keys[keyRotationIndex % totalKeys];
    keyRotationIndex = (keyRotationIndex + 1) % totalKeys;
    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: OCR_PROMPT },
                  {
                    inlineData: {
                      mimeType: mimeType || "image/jpeg",
                      data: rawBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1
            }
          })
        });
        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`[OCR Gemini] Model ${model} dengan key ${currentKey.slice(0, 10)}... mengembalikan status ${response.status}:`, errBody);
          if (response.status === 429 || response.status === 503 || response.status === 404) {
            continue;
          }
          throw new Error(`Gagal menghubungi Gemini API: ${response.statusText}`);
        }
        const data = await response.json();
        const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidate) {
          throw new Error("Tidak dapat mendeteksi teks dari foto struk.");
        }
        const parsed = JSON.parse(candidate);
        const items = Array.isArray(parsed.items) ? parsed.items.map((it) => {
          const qty = Math.max(1, Math.round(Number(it.quantity) || 1));
          const unitPrice = Math.max(0, Math.round(Number(it.unitPrice) || Number(it.price) || 0));
          const name = String(it.name || "Item Menu").trim();
          return {
            name,
            quantity: qty,
            unitPrice,
            totalPrice: unitPrice * qty
          };
        }).filter((it) => it.name.length > 0 && it.unitPrice > 0) : [];
        const calculatedSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const subtotal = Math.max(0, Math.round(Number(parsed.subtotal) || calculatedSubtotal));
        const taxAmount = Math.max(0, Math.round(Number(parsed.taxAmount) || 0));
        const serviceAmount = Math.max(0, Math.round(Number(parsed.serviceAmount) || 0));
        const discountAmount = Math.max(0, Math.round(Number(parsed.discountAmount) || 0));
        const grandTotal = Math.max(0, Math.round(Number(parsed.grandTotal) || subtotal + taxAmount + serviceAmount - discountAmount));
        return {
          title: String(parsed.title || "Resto Makan Bareng").trim(),
          items,
          subtotal,
          taxAmount,
          serviceAmount,
          discountAmount,
          grandTotal
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[OCR Gemini Attempt Fail] ${lastError.message}`);
      }
    }
  }
  throw lastError || new Error("Gagal membaca struk kasir, silakan coba lagi atau input manual.");
}

// dist/websocket.js
var import_ws = require("ws");
var roomClients = /* @__PURE__ */ new Map();
function initWebSocketServer(server2) {
  const wss = new import_ws.WebSocketServer({ server: server2, path: "/api/ws" });
  wss.on("connection", (ws, req) => {
    try {
      const parsedUrl = new URL(req.url ?? "", "http://localhost");
      const roomCode = parsedUrl.searchParams.get("roomCode")?.toUpperCase();
      if (!roomCode) {
        ws.close(1008, "Missing roomCode query param");
        return;
      }
      if (!roomClients.has(roomCode)) {
        roomClients.set(roomCode, /* @__PURE__ */ new Set());
      }
      const clients = roomClients.get(roomCode);
      clients.add(ws);
      let isAlive = true;
      ws.on("pong", () => {
        isAlive = true;
      });
      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
          }
        } catch {
        }
      });
      ws.on("close", () => {
        clients.delete(ws);
        if (clients.size === 0) {
          roomClients.delete(roomCode);
        }
      });
      ws.on("error", (err) => {
        console.error(`[WebSocket Error][Room ${roomCode}]`, err.message);
      });
      ws.send(JSON.stringify({
        type: "CONNECTED",
        roomCode,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }));
    } catch (err) {
      console.error("[WebSocket Connection Handler Error]", err);
      ws.close(1011, "Internal server error");
    }
  });
  const heartbeatInterval = setInterval(() => {
    for (const [code, clients] of roomClients.entries()) {
      for (const ws of clients) {
        if (ws.readyState === import_ws.WebSocket.OPEN) {
          ws.ping();
        } else if (ws.readyState === import_ws.WebSocket.CLOSED || ws.readyState === import_ws.WebSocket.CLOSING) {
          clients.delete(ws);
        }
      }
      if (clients.size === 0) {
        roomClients.delete(code);
      }
    }
  }, 3e4);
  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });
  return wss;
}
function broadcastToRoom(roomCode, payload) {
  const upper = roomCode.toUpperCase();
  const clients = roomClients.get(upper);
  if (!clients || clients.size === 0)
    return;
  const data = JSON.stringify({
    ...payload,
    roomCode: upper,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  for (const ws of clients) {
    if (ws.readyState === import_ws.WebSocket.OPEN) {
      try {
        ws.send(data);
      } catch (err) {
        console.error(`[WebSocket Broadcast Error][Room ${upper}]`, err);
      }
    }
  }
}

// dist/services/rooms.service.js
var import_node_crypto2 = require("node:crypto");

// dist/utils/roomCode.js
var import_node_crypto = require("node:crypto");
var SUFFIX_LENGTH = 4;
var MAX_ROOM_CODE_LENGTH = 12;
var MAX_SLUG_LENGTH = MAX_ROOM_CODE_LENGTH - SUFFIX_LENGTH;
function slugifyTitle(title) {
  const firstWord = title.normalize("NFKD").toUpperCase().replace(/[^A-Z0-9\s]/g, "").trim().split(/\s+/)[0];
  const slug = (firstWord ?? "").slice(0, MAX_SLUG_LENGTH);
  return slug.length > 0 ? slug : "ROOM";
}
function generateRoomCode(title) {
  const suffix = (0, import_node_crypto.randomInt)(100, 1e3);
  return `${slugifyTitle(title)}-${suffix}`;
}

// dist/services/rooms.service.js
var RoomNotFoundError = class extends Error {
};
var MemberNotFoundError = class extends Error {
};
var ItemNotFoundError = class extends Error {
};
var RoomLockedError = class extends Error {
};
var OverclaimError = class extends Error {
};
var ForbiddenError = class extends Error {
};
var InvalidJoinError = class extends Error {
};
var UNIQUE_VIOLATION = "23505";
var RETRYABLE_TX_CODES = /* @__PURE__ */ new Set(["40001", "40P01"]);
var MAX_JOIN_ATTEMPTS = 3;
var MAX_ROOM_CODE_ATTEMPTS = 5;
async function createRoom(input) {
  const hostToken = (0, import_node_crypto2.randomUUID)();
  const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal + input.taxAmount + input.serviceAmount - input.discountAmount);
  const roundMode = input.roundMode || "hundred";
  for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt++) {
    const roomCode = generateRoomCode(input.title);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: roomRows } = await client.query(`INSERT INTO rooms (
           room_code, title, host_user_id, bank_name, bank_account_no, bank_account_name,
           subtotal, tax_amount, service_amount, discount_amount, grand_total, qris_image_url, receipt_image_url, round_mode
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id, status`, [
        roomCode,
        input.title,
        input.hostUserId ?? null,
        input.bankName ?? null,
        input.bankAccountNo ?? null,
        input.bankAccountName ?? null,
        subtotal,
        input.taxAmount,
        input.serviceAmount,
        input.discountAmount,
        grandTotal,
        input.qrisImageUrl ?? null,
        input.receiptImageUrl ?? null,
        roundMode
      ]);
      const roomId = roomRows[0].id;
      const { rows: memberRows } = await client.query(`INSERT INTO members (room_id, user_id, guest_token, display_name, is_host)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING id`, [roomId, input.hostUserId ?? null, hostToken, input.hostName]);
      const hostMemberId = memberRows[0]?.id;
      const { rows: receiptRows } = await client.query(`INSERT INTO receipts (
           room_id, payer_member_id, payer_name, title, receipt_image_url,
           subtotal, tax_amount, service_amount, discount_amount, grand_total,
           bank_name, bank_account_no, bank_account_name, qris_image_url,
           created_by_member_id, sort_order
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0)
         RETURNING id`, [
        roomId,
        hostMemberId ?? null,
        input.hostName,
        input.title,
        input.receiptImageUrl ?? null,
        subtotal,
        input.taxAmount,
        input.serviceAmount,
        input.discountAmount,
        grandTotal,
        input.bankName ?? null,
        input.bankAccountNo ?? null,
        input.bankAccountName ?? null,
        input.qrisImageUrl ?? null,
        hostMemberId ?? null
      ]);
      const primaryReceiptId = receiptRows[0]?.id ?? null;
      if (input.items.length > 0) {
        const itemValues = [];
        const placeholders = [];
        for (let i = 0; i < input.items.length; i++) {
          const item = input.items[i];
          const offset = i * 6;
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
          itemValues.push(roomId, item.name, item.unitPrice, item.quantity, i, primaryReceiptId);
        }
        await client.query(`INSERT INTO items (room_id, name, unit_price, quantity, sort_order, receipt_id)
           VALUES ${placeholders.join(", ")}`, itemValues);
      }
      await client.query("COMMIT");
      return {
        roomCode,
        status: roomRows[0].status,
        hostToken,
        subtotal,
        grandTotal
      };
    } catch (error) {
      await client.query("ROLLBACK");
      const isRoomCodeCollision = error instanceof Error && "code" in error && error.code === UNIQUE_VIOLATION;
      if (!isRoomCodeCollision)
        throw error;
    } finally {
      client.release();
    }
  }
  throw new Error("Gagal membuat room setelah beberapa percobaan, coba lagi.");
}
async function resolveDisplayName(client, roomId, desiredName) {
  const trimmed = desiredName.trim();
  const { rows } = await client.query(`SELECT display_name FROM members WHERE room_id = $1 AND LOWER(display_name) LIKE LOWER($2) || '%'`, [roomId, trimmed]);
  const takenLower = new Set(rows.map((r) => r.display_name.trim().toLowerCase()));
  if (!takenLower.has(trimmed.toLowerCase()))
    return trimmed;
  let n = 2;
  while (takenLower.has(`${trimmed.toLowerCase()} (${n})`))
    n++;
  return `${trimmed} (${n})`;
}
async function joinRoom(roomCode, input, userId) {
  for (let attempt = 1; attempt <= MAX_JOIN_ATTEMPTS; attempt++) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: roomRows } = await client.query("SELECT id, status, host_user_id FROM rooms WHERE room_code = $1 FOR UPDATE", [roomCode]);
      const room = roomRows[0];
      if (!room)
        throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
      const { rows: existingRows } = await client.query("SELECT id, display_name, is_host FROM members WHERE room_id = $1 AND guest_token = $2", [room.id, input.guestToken]);
      const existingMember = existingRows[0];
      if (existingMember) {
        if (userId) {
          await client.query("UPDATE members SET user_id = $1 WHERE id = $2 AND user_id IS NULL", [userId, existingMember.id]);
        }
        await client.query("COMMIT");
        return {
          memberId: existingMember.id,
          displayName: existingMember.display_name,
          isHost: existingMember.is_host,
          roomStatus: room.status
        };
      }
      if (userId) {
        if (room.host_user_id === userId) {
          const { rows: hostMemberRows } = await client.query("SELECT id, display_name, is_host FROM members WHERE room_id = $1 AND is_host = TRUE", [room.id]);
          if (hostMemberRows[0]) {
            await client.query("UPDATE members SET guest_token = $1, user_id = $2 WHERE id = $3", [input.guestToken, userId, hostMemberRows[0].id]);
            await client.query("COMMIT");
            return {
              memberId: hostMemberRows[0].id,
              displayName: hostMemberRows[0].display_name,
              isHost: true,
              roomStatus: room.status
            };
          }
        }
        const { rows: userMemberRows } = await client.query("SELECT id, display_name, is_host FROM members WHERE room_id = $1 AND user_id = $2", [room.id, userId]);
        if (userMemberRows[0]) {
          await client.query("UPDATE members SET guest_token = $1 WHERE id = $2", [input.guestToken, userMemberRows[0].id]);
          await client.query("COMMIT");
          return {
            memberId: userMemberRows[0].id,
            displayName: userMemberRows[0].display_name,
            isHost: userMemberRows[0].is_host,
            roomStatus: room.status
          };
        }
      }
      const trimmedName = input.displayName ? input.displayName.trim() : "";
      if (!trimmedName) {
        throw new InvalidJoinError("Nama harus diisi untuk gabung ke meja.");
      }
      const displayName = await resolveDisplayName(client, room.id, trimmedName);
      const { rows: insertedRows } = await client.query(`INSERT INTO members (room_id, user_id, guest_token, display_name, is_host)
         VALUES ($1, $2, $3, $4, FALSE)
         RETURNING id, display_name, is_host`, [room.id, userId ?? null, input.guestToken, displayName]);
      const member = insertedRows[0];
      await client.query("COMMIT");
      return {
        memberId: member.id,
        displayName: member.display_name,
        isHost: member.is_host,
        roomStatus: room.status
      };
    } catch (error) {
      await client.query("ROLLBACK");
      const code = error instanceof Error && "code" in error ? error.code : void 0;
      const isRetryable = code !== void 0 && RETRYABLE_TX_CODES.has(code);
      if (isRetryable && attempt < MAX_JOIN_ATTEMPTS)
        continue;
      throw error;
    } finally {
      client.release();
    }
  }
  throw new Error("Gagal join room karena konflik bersamaan, coba lagi.");
}
function applyRounding(amount, roundMode = "hundred") {
  if (amount <= 0)
    return 0;
  if (roundMode === "thousand") {
    return Math.ceil(amount / 1e3) * 1e3;
  }
  if (roundMode === "none") {
    return Math.round(amount);
  }
  return Math.ceil(amount / 100) * 100;
}
function computeMemberShares(members, claims, receipts, room) {
  const host = members.find((m) => m.is_host);
  if (receipts && receipts.length > 0) {
    const claimsByItem2 = /* @__PURE__ */ new Map();
    for (const claim of claims) {
      const list = claimsByItem2.get(claim.item_id) ?? [];
      list.push(claim);
      claimsByItem2.set(claim.item_id, list);
    }
    const receiptMemberSubtotals = /* @__PURE__ */ new Map();
    for (const rc of receipts) {
      receiptMemberSubtotals.set(rc.id, /* @__PURE__ */ new Map());
    }
    const defaultReceiptId = receipts[0]?.id;
    for (const itemClaims of claimsByItem2.values()) {
      const first = itemClaims[0];
      const itemTotal = Number(first.unit_price) * first.quantity;
      const targetReceiptId = first.receipt_id || defaultReceiptId;
      const memberSubMap = receiptMemberSubtotals.get(targetReceiptId) ?? receiptMemberSubtotals.get(defaultReceiptId);
      if (memberSubMap) {
        if (first.is_shared) {
          const perClaimer = itemTotal / itemClaims.length;
          for (const claim of itemClaims) {
            memberSubMap.set(claim.member_id, (memberSubMap.get(claim.member_id) ?? 0) + perClaimer);
          }
        } else {
          const pricePerUnit = first.quantity > 0 ? itemTotal / first.quantity : 0;
          for (const claim of itemClaims) {
            memberSubMap.set(claim.member_id, (memberSubMap.get(claim.member_id) ?? 0) + pricePerUnit * Number(claim.portion_quantity));
          }
        }
      }
    }
    return members.map((member) => {
      const breakdown = [];
      let totalRawShare = 0;
      let totalSubtotalShare = 0;
      for (const rc of receipts) {
        const memberSubMap = receiptMemberSubtotals.get(rc.id);
        const itemSub = memberSubMap?.get(member.id) ?? 0;
        const rcSub = Number(rc.subtotal);
        const ratio = rcSub > 0 ? itemSub / rcSub : 0;
        const taxShare = Number(rc.tax_amount) * ratio;
        const svcShare = Number(rc.service_amount) * ratio;
        const discShare = Number(rc.discount_amount) * ratio;
        const rawReceiptShare = Math.max(0, itemSub + taxShare + svcShare - discShare);
        const roundedReceiptShare = applyRounding(rawReceiptShare, room.roundMode ?? "hundred");
        totalSubtotalShare += itemSub;
        totalRawShare += rawReceiptShare;
        if (roundedReceiptShare > 0 || itemSub > 0) {
          breakdown.push({
            receiptId: rc.id,
            title: rc.title,
            payerMemberId: rc.payer_member_id,
            payerName: rc.payer_name || "Host",
            amount: roundedReceiptShare,
            bankName: rc.bank_name || room.bankName,
            bankAccountNo: rc.bank_account_no || room.bankAccountNo,
            bankAccountName: rc.bank_account_name || room.bankAccountName,
            qrisImageUrl: rc.qris_image_url || room.qrisImageUrl
          });
        }
      }
      const totalShareAmount = breakdown.reduce((sum, b) => sum + b.amount, 0);
      return {
        id: member.id,
        userId: member.user_id,
        displayName: member.display_name,
        isHost: member.is_host,
        subtotalShare: Math.round(totalSubtotalShare),
        rawShareAmount: Math.round(totalRawShare),
        shareAmount: totalShareAmount,
        receiptBreakdown: breakdown,
        claimedItemIds: claims.filter((c) => c.member_id === member.id).map((c) => c.item_id)
      };
    });
  }
  const claimsByItem = /* @__PURE__ */ new Map();
  for (const claim of claims) {
    const list = claimsByItem.get(claim.item_id) ?? [];
    list.push(claim);
    claimsByItem.set(claim.item_id, list);
  }
  const memberItemSubtotal = /* @__PURE__ */ new Map();
  for (const itemClaims of claimsByItem.values()) {
    const first = itemClaims[0];
    const itemTotal = Number(first.unit_price) * first.quantity;
    if (first.is_shared) {
      const perClaimer = itemTotal / itemClaims.length;
      for (const claim of itemClaims) {
        memberItemSubtotal.set(claim.member_id, (memberItemSubtotal.get(claim.member_id) ?? 0) + perClaimer);
      }
    } else {
      const pricePerUnit = first.quantity > 0 ? itemTotal / first.quantity : 0;
      for (const claim of itemClaims) {
        memberItemSubtotal.set(claim.member_id, (memberItemSubtotal.get(claim.member_id) ?? 0) + pricePerUnit * Number(claim.portion_quantity));
      }
    }
  }
  return members.map((member) => {
    const itemSubtotal = memberItemSubtotal.get(member.id) ?? 0;
    const ratio = room.subtotal > 0 ? itemSubtotal / room.subtotal : 0;
    const taxShare = room.taxAmount * ratio;
    const serviceShare = room.serviceAmount * ratio;
    const discountShare = room.discountAmount * ratio;
    const rawShare = Math.max(0, itemSubtotal + taxShare + serviceShare - discountShare);
    const shareAmount = applyRounding(rawShare, room.roundMode ?? "hundred");
    return {
      id: member.id,
      userId: member.user_id,
      displayName: member.display_name,
      isHost: member.is_host,
      subtotalShare: Math.round(itemSubtotal),
      rawShareAmount: Math.round(rawShare),
      shareAmount,
      receiptBreakdown: [
        {
          receiptId: "primary",
          title: room.title,
          payerMemberId: host?.id ?? null,
          payerName: host?.display_name ?? "Host",
          amount: shareAmount,
          bankName: room.bankName,
          bankAccountNo: room.bankAccountNo,
          bankAccountName: room.bankAccountName,
          qrisImageUrl: room.qrisImageUrl
        }
      ],
      claimedItemIds: claims.filter((c) => c.member_id === member.id).map((c) => c.item_id)
    };
  });
}
async function getRoomByCode(roomCode) {
  const { rows: roomRows } = await pool.query(`SELECT
       r.id, r.room_code, r.title, r.status, r.host_user_id, r.subtotal, r.tax_amount, r.service_amount,
       r.discount_amount, r.grand_total, r.bank_name, r.bank_account_no, r.bank_account_name,
       r.qris_image_url, r.receipt_image_url, r.group_photo_url, r.round_mode,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'id', rc.id,
           'title', rc.title,
           'payer_member_id', rc.payer_member_id,
           'payer_name', rc.payer_name,
           'subtotal', rc.subtotal,
           'tax_amount', rc.tax_amount,
           'service_amount', rc.service_amount,
           'discount_amount', rc.discount_amount,
           'grand_total', rc.grand_total,
           'bank_name', rc.bank_name,
           'bank_account_no', rc.bank_account_no,
           'bank_account_name', rc.bank_account_name,
           'qris_image_url', rc.qris_image_url,
           'receipt_image_url', rc.receipt_image_url,
           'created_by_member_id', rc.created_by_member_id,
           'sort_order', rc.sort_order,
           'created_at', rc.created_at
         ) ORDER BY rc.sort_order ASC, rc.created_at ASC), '[]'::json)
         FROM receipts rc
         WHERE rc.room_id = r.id
       ) AS receipts,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'id', i.id,
           'name', i.name,
           'unit_price', i.unit_price,
           'quantity', i.quantity,
           'is_shared', i.is_shared,
           'receipt_id', i.receipt_id
         ) ORDER BY i.sort_order ASC, i.created_at ASC), '[]'::json)
         FROM items i
         WHERE i.room_id = r.id
       ) AS items,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'id', m.id,
           'user_id', m.user_id,
           'display_name', m.display_name,
           'is_host', m.is_host
         ) ORDER BY m.is_host DESC, m.joined_at ASC), '[]'::json)
         FROM members m
         WHERE m.room_id = r.id
       ) AS members,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'item_id', ic.item_id,
           'member_id', ic.member_id,
           'portion_quantity', ic.portion_quantity,
           'unit_price', i.unit_price,
           'quantity', i.quantity,
           'is_shared', i.is_shared,
           'receipt_id', i.receipt_id
         )), '[]'::json)
         FROM item_claims ic
         JOIN items i ON i.id = ic.item_id
         WHERE i.room_id = r.id
       ) AS claims,
       (
         SELECT COALESCE(json_agg(json_build_object(
           'member_id', p.member_id,
           'status', p.status,
           'proof_image_url', p.proof_image_url,
           'rejection_reason', p.rejection_reason
         )), '[]'::json)
         FROM payments p
         WHERE p.room_id = r.id
       ) AS payments
     FROM rooms r
     WHERE r.room_code = $1`, [roomCode]);
  const room = roomRows[0];
  if (!room)
    throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  const itemRows = room.items || [];
  const memberRows = room.members || [];
  const claimRows = room.claims || [];
  const paymentRows = room.payments || [];
  const receiptRows = room.receipts || [];
  const paymentsByMember = /* @__PURE__ */ new Map();
  for (const p of paymentRows) {
    paymentsByMember.set(p.member_id, p);
  }
  const roomTotals = {
    title: room.title,
    subtotal: Number(room.subtotal),
    taxAmount: Number(room.tax_amount),
    serviceAmount: Number(room.service_amount),
    discountAmount: Number(room.discount_amount),
    grandTotal: Number(room.grand_total),
    bankName: room.bank_name,
    bankAccountNo: room.bank_account_no,
    bankAccountName: room.bank_account_name,
    qrisImageUrl: room.qris_image_url,
    roundMode: room.round_mode ?? "hundred"
  };
  const rawMembers = computeMemberShares(memberRows, claimRows, receiptRows, roomTotals);
  const members = rawMembers.map((m) => {
    const payment = paymentsByMember.get(m.id);
    return {
      ...m,
      paymentStatus: m.isHost ? "VERIFIED" : payment?.status ?? "UNPAID",
      proofImageUrl: payment?.proof_image_url ?? null,
      rejectionReason: payment?.rejection_reason ?? null
    };
  });
  const claimsByItem = /* @__PURE__ */ new Map();
  for (const claim of claimRows) {
    const list = claimsByItem.get(claim.item_id) ?? [];
    list.push(claim);
    claimsByItem.set(claim.item_id, list);
  }
  return {
    roomCode: room.room_code,
    title: room.title,
    status: room.status,
    hostUserId: room.host_user_id,
    subtotal: roomTotals.subtotal,
    taxAmount: roomTotals.taxAmount,
    serviceAmount: roomTotals.serviceAmount,
    discountAmount: roomTotals.discountAmount,
    grandTotal: Number(room.grand_total),
    bankName: room.bank_name,
    bankAccountNo: room.bank_account_no,
    bankAccountName: room.bank_account_name,
    qrisImageUrl: room.qris_image_url,
    receiptImageUrl: room.receipt_image_url,
    groupPhotoUrl: room.group_photo_url,
    roundMode: room.round_mode ?? "hundred",
    receipts: receiptRows.map((rc) => ({
      id: rc.id,
      title: rc.title,
      payerMemberId: rc.payer_member_id,
      payerName: rc.payer_name || "Host",
      subtotal: Number(rc.subtotal),
      taxAmount: Number(rc.tax_amount),
      serviceAmount: Number(rc.service_amount),
      discountAmount: Number(rc.discount_amount),
      grandTotal: Number(rc.grand_total),
      bankName: rc.bank_name,
      bankAccountNo: rc.bank_account_no,
      bankAccountName: rc.bank_account_name,
      qrisImageUrl: rc.qris_image_url,
      receiptImageUrl: rc.receipt_image_url,
      createdByMemberId: rc.created_by_member_id,
      sortOrder: rc.sort_order,
      createdAt: rc.created_at
    })),
    items: itemRows.map((item) => {
      const itemClaims = claimsByItem.get(item.id) ?? [];
      return {
        id: item.id,
        name: item.name,
        unitPrice: Number(item.unit_price),
        quantity: item.quantity,
        isShared: item.is_shared,
        receiptId: item.receipt_id ?? null,
        claimedQuantity: itemClaims.reduce((sum, c) => sum + Number(c.portion_quantity), 0),
        claimedByMemberIds: itemClaims.map((c) => c.member_id),
        claims: itemClaims.map((c) => ({
          memberId: c.member_id,
          portionQuantity: Number(c.portion_quantity)
        }))
      };
    }),
    members
  };
}
async function resolveMember(client, roomId, guestToken) {
  const { rows } = await client.query("SELECT id FROM members WHERE room_id = $1 AND guest_token = $2", [roomId, guestToken]);
  const member = rows[0];
  if (!member) {
    throw new MemberNotFoundError("Kamu belum gabung ke room ini.");
  }
  return member.id;
}
async function lockRoomRowForClaim(client, roomCode) {
  const { rows } = await client.query("SELECT id, status FROM rooms WHERE room_code = $1 FOR UPDATE", [roomCode]);
  const room = rows[0];
  if (!room)
    throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  if (room.status === "LOCKED" || room.status === "CLOSED") {
    throw new RoomLockedError("Room ini sudah dikunci, klaim tidak bisa diubah lagi.");
  }
  return room;
}
async function claimItem(roomCode, itemId, guestToken) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const room = await lockRoomRowForClaim(client, roomCode);
    const memberId = await resolveMember(client, room.id, guestToken);
    const { rows: itemRows } = await client.query("SELECT id, name, quantity, is_shared FROM items WHERE id = $1 AND room_id = $2", [itemId, room.id]);
    const item = itemRows[0];
    if (!item)
      throw new ItemNotFoundError("Item tidak ditemukan di room ini.");
    if (!item.is_shared) {
      const { rows: claimedRows } = await client.query("SELECT SUM(portion_quantity) AS total FROM item_claims WHERE item_id = $1", [itemId]);
      const alreadyClaimed = Number(claimedRows[0]?.total ?? 0);
      if (alreadyClaimed + 1 > item.quantity) {
        throw new OverclaimError("Porsi item ini sudah habis diklaim.");
      }
    }
    await client.query(`INSERT INTO item_claims (item_id, member_id, portion_quantity)
       VALUES ($1, $2, 1)
       ON CONFLICT (item_id, member_id)
       DO UPDATE SET portion_quantity = item_claims.portion_quantity + 1`, [itemId, memberId]);
    await client.query("UPDATE rooms SET status = 'CLAIMING', updated_at = NOW() WHERE id = $1 AND status = 'DRAFT'", [room.id]);
    const { rows: memberRows } = await client.query("SELECT display_name FROM members WHERE id = $1", [memberId]);
    const memberName = memberRows[0]?.display_name ?? "Member";
    const { rows: eventRows } = await client.query(`INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
       VALUES ($1, $2, 'CLAIM_ITEM', 'SYSTEM', $3, NOW())
       RETURNING id, room_id, member_id, event_type, sender_type, message, created_at`, [room.id, memberId, `${memberName} mengklaim 1x ${item.name}`]);
    await client.query("COMMIT");
    return {
      event: {
        id: eventRows[0].id,
        member_id: eventRows[0].member_id,
        display_name: memberName,
        event_type: eventRows[0].event_type,
        sender_type: eventRows[0].sender_type,
        message: eventRows[0].message,
        created_at: eventRows[0].created_at
      }
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function unclaimItem(roomCode, itemId, guestToken) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const room = await lockRoomRowForClaim(client, roomCode);
    const memberId = await resolveMember(client, room.id, guestToken);
    const { rows: currentClaimRows } = await client.query("SELECT portion_quantity FROM item_claims WHERE item_id = $1 AND member_id = $2", [itemId, memberId]);
    const currentPortion = Number(currentClaimRows[0]?.portion_quantity ?? 0);
    if (currentPortion > 1) {
      await client.query("UPDATE item_claims SET portion_quantity = portion_quantity - 1 WHERE item_id = $1 AND member_id = $2", [itemId, memberId]);
    } else {
      await client.query("DELETE FROM item_claims WHERE item_id = $1 AND member_id = $2", [itemId, memberId]);
    }
    const { rows: memberRows } = await client.query("SELECT display_name FROM members WHERE id = $1", [memberId]);
    const memberName = memberRows[0]?.display_name ?? "Member";
    const { rows: itemRows } = await client.query("SELECT name FROM items WHERE id = $1", [itemId]);
    const itemName = itemRows[0]?.name ?? "item";
    const { rows: eventRows } = await client.query(`INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
       VALUES ($1, $2, 'UNCLAIM_ITEM', 'SYSTEM', $3, NOW())
       RETURNING id, room_id, member_id, event_type, sender_type, message, created_at`, [room.id, memberId, `${memberName} melepas porsi ${itemName}`]);
    await client.query("COMMIT");
    return {
      event: {
        id: eventRows[0].id,
        member_id: eventRows[0].member_id,
        display_name: memberName,
        event_type: eventRows[0].event_type,
        sender_type: eventRows[0].sender_type,
        message: eventRows[0].message,
        created_at: eventRows[0].created_at
      }
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function assertIsHost(clientOrPool, roomId, hostUserId, guestToken) {
  if (hostUserId) {
    const { rows: roomRows } = await clientOrPool.query("SELECT host_user_id FROM rooms WHERE id = $1", [roomId]);
    if (roomRows[0]?.host_user_id && roomRows[0].host_user_id === hostUserId) {
      return true;
    }
    const { rows: memberRows } = await clientOrPool.query("SELECT is_host FROM members WHERE room_id = $1 AND user_id = $2 AND is_host = TRUE", [roomId, hostUserId]);
    if (memberRows.length > 0) {
      return true;
    }
  }
  if (guestToken) {
    const { rows: memberRows } = await clientOrPool.query("SELECT is_host FROM members WHERE room_id = $1 AND guest_token = $2 AND is_host = TRUE", [roomId, guestToken]);
    if (memberRows.length > 0) {
      return true;
    }
  }
  throw new ForbiddenError("Kamu bukan host room ini.");
}
async function lockRoom(roomCode, hostUserId, guestToken) {
  const { rows } = await pool.query("SELECT id, host_user_id, status FROM rooms WHERE room_code = $1", [roomCode]);
  const room = rows[0];
  if (!room)
    throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  await assertIsHost(pool, room.id, hostUserId, guestToken);
  if (room.status === "LOCKED" || room.status === "CLOSED") {
    return { status: room.status };
  }
  const { rows: updated } = await pool.query(`UPDATE rooms SET status = 'LOCKED', locked_at = NOW(), updated_at = NOW()
     WHERE id = $1 RETURNING status`, [room.id]);
  await pool.query(`INSERT INTO room_events (room_id, event_type, sender_type, message, created_at)
     VALUES ($1, 'BILL_LOCKED', 'SYSTEM', 'Tagihan telah dikunci oleh Host. Nominal pembayaran kini bersifat final.', NOW())`, [room.id]);
  return { status: updated[0].status };
}
async function listMyRooms(hostUserId) {
  const { rows } = await pool.query(`SELECT room_code, title, status, grand_total, created_at
     FROM rooms
     WHERE host_user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`, [hostUserId]);
  return rows.map((row) => ({
    roomCode: row.room_code,
    title: row.title,
    status: row.status,
    grandTotal: Number(row.grand_total),
    createdAt: row.created_at
  }));
}
async function deleteRoom(roomCode, hostUserId, guestToken) {
  const { rows } = await pool.query("SELECT id, host_user_id FROM rooms WHERE room_code = $1", [roomCode]);
  const room = rows[0];
  if (!room)
    throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  await assertIsHost(pool, room.id, hostUserId, guestToken);
  await pool.query("DELETE FROM rooms WHERE id = $1", [room.id]);
}
async function unlockRoom(roomCode, hostUserId, guestToken) {
  const { rows } = await pool.query("SELECT id, host_user_id, status FROM rooms WHERE room_code = $1", [roomCode]);
  const room = rows[0];
  if (!room)
    throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  await assertIsHost(pool, room.id, hostUserId, guestToken);
  if (room.status === "CLOSED") {
    throw new RoomLockedError("Room sudah ditutup permanen.");
  }
  const { rows: updated } = await pool.query(`UPDATE rooms SET status = 'CLAIMING', updated_at = NOW()
     WHERE id = $1 RETURNING status`, [room.id]);
  await pool.query(`INSERT INTO room_events (room_id, event_type, sender_type, message, created_at)
     VALUES ($1, 'BILL_UNLOCKED', 'SYSTEM', 'Host membuka kembali kunci meja untuk penyesuaian porsi menu.', NOW())`, [room.id]);
  return { status: updated[0].status };
}
async function closeRoom(roomCode, hostUserId, guestToken) {
  const { rows } = await pool.query("SELECT id, host_user_id, status FROM rooms WHERE room_code = $1", [roomCode]);
  const room = rows[0];
  if (!room)
    throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  await assertIsHost(pool, room.id, hostUserId, guestToken);
  const { rows: updated } = await pool.query(`UPDATE rooms
     SET status = 'CLOSED',
         closed_at = NOW(),
         receipt_image_url = NULL,
         media_purged_at = NOW(),
         updated_at = NOW()
     WHERE id = $1 RETURNING status`, [room.id]);
  await pool.query(`UPDATE payments SET proof_image_url = NULL WHERE room_id = $1`, [room.id]);
  return { status: updated[0].status };
}
async function purgeOldRoomMedia() {
  try {
    const { rows: targetRooms } = await pool.query(`SELECT id, room_code FROM rooms
       WHERE (status = 'CLOSED' OR created_at < NOW() - INTERVAL '7 days')
         AND (media_purged_at IS NULL OR receipt_image_url IS NOT NULL)`);
    if (targetRooms.length === 0)
      return { purgedRoomsCount: 0 };
    for (const r of targetRooms) {
      await pool.query(`UPDATE payments SET proof_image_url = NULL WHERE room_id = $1 AND proof_image_url IS NOT NULL`, [r.id]);
      await pool.query(`UPDATE rooms SET receipt_image_url = NULL, media_purged_at = NOW() WHERE id = $1`, [r.id]);
    }
    console.log(`[Storage Purge Worker] Purged ephemeral media for ${targetRooms.length} room(s).`);
    return { purgedRoomsCount: targetRooms.length };
  } catch (err) {
    console.error("[Storage Purge Worker Error]", err);
    return { purgedRoomsCount: 0 };
  }
}
async function splitUnclaimedItems(roomCode, hostUserId, guestToken) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: roomRows } = await client.query("SELECT id, host_user_id, status FROM rooms WHERE room_code = $1 FOR UPDATE", [roomCode]);
    const room = roomRows[0];
    if (!room)
      throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
    await assertIsHost(client, room.id, hostUserId, guestToken);
    const { rows: members } = await client.query("SELECT id FROM members WHERE room_id = $1", [room.id]);
    if (members.length === 0) {
      await client.query("COMMIT");
      return;
    }
    const { rows: items } = await client.query("SELECT id, quantity FROM items WHERE room_id = $1", [room.id]);
    const { rows: claims } = await client.query(`SELECT item_id, SUM(portion_quantity) as total
       FROM item_claims ic
       JOIN items i ON i.id = ic.item_id
       WHERE i.room_id = $1
       GROUP BY item_id`, [room.id]);
    const claimedMap = new Map(claims.map((c) => [c.item_id, Number(c.total ?? 0)]));
    for (const item of items) {
      const claimedQty = claimedMap.get(item.id) ?? 0;
      const remainingQty = item.quantity - claimedQty;
      if (remainingQty > 0) {
        const portionPerMember = remainingQty / members.length;
        for (const member of members) {
          await client.query(`INSERT INTO item_claims (item_id, member_id, portion_quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (item_id, member_id)
             DO UPDATE SET portion_quantity = item_claims.portion_quantity + EXCLUDED.portion_quantity`, [item.id, member.id, portionPerMember]);
        }
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function submitPaymentProof(roomCode, guestToken, proofImageUrl) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: roomRows } = await client.query("SELECT id FROM rooms WHERE room_code = $1", [roomCode]);
    const room = roomRows[0];
    if (!room)
      throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
    const memberId = await resolveMember(client, room.id, guestToken);
    await client.query(`INSERT INTO payments (room_id, member_id, proof_image_url, status, submitted_at, updated_at)
       VALUES ($1, $2, $3, 'PENDING', NOW(), NOW())
       ON CONFLICT (room_id, member_id)
       DO UPDATE SET
         proof_image_url = EXCLUDED.proof_image_url,
         status = 'PENDING',
         rejection_reason = NULL,
         submitted_at = NOW(),
         updated_at = NOW()`, [room.id, memberId, proofImageUrl]);
    const { rows: memberRows } = await client.query("SELECT display_name FROM members WHERE id = $1", [memberId]);
    const memberName = memberRows[0]?.display_name ?? "Member";
    await client.query(`INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
       VALUES ($1, $2, 'PROOF_UPLOADED', 'SYSTEM', $3, NOW())`, [room.id, memberId, `${memberName} mengunggah bukti transfer.`]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function verifyPayment(roomCode, memberId, hostUserId, guestToken) {
  const { rows: roomRows } = await pool.query("SELECT id, host_user_id FROM rooms WHERE room_code = $1", [roomCode]);
  const room = roomRows[0];
  if (!room)
    throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  await assertIsHost(pool, room.id, hostUserId, guestToken);
  await pool.query(`INSERT INTO payments (room_id, member_id, status, verified_at, updated_at)
     VALUES ($1, $2, 'VERIFIED', NOW(), NOW())
     ON CONFLICT (room_id, member_id)
     DO UPDATE SET
       status = 'VERIFIED',
       verified_at = NOW(),
       rejection_reason = NULL,
       updated_at = NOW()`, [room.id, memberId]);
  const { rows: memberRows } = await pool.query("SELECT display_name FROM members WHERE id = $1", [memberId]);
  const memberName = memberRows[0]?.display_name ?? "Member";
  await pool.query(`INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
     VALUES ($1, $2, 'PAYMENT_VERIFIED', 'SYSTEM', $3, NOW())`, [room.id, memberId, `Pembayaran ${memberName} telah diverifikasi lunas oleh Host.`]);
}
async function rejectPayment(roomCode, memberId, reason, hostUserId, guestToken) {
  const { rows: roomRows } = await pool.query("SELECT id, host_user_id FROM rooms WHERE room_code = $1", [roomCode]);
  const room = roomRows[0];
  if (!room)
    throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  await assertIsHost(pool, room.id, hostUserId, guestToken);
  await pool.query(`INSERT INTO payments (room_id, member_id, status, rejection_reason, updated_at)
     VALUES ($1, $2, 'REJECTED', $3, NOW())
     ON CONFLICT (room_id, member_id)
     DO UPDATE SET
       status = 'REJECTED',
       rejection_reason = $3,
       updated_at = NOW()`, [room.id, memberId, reason]);
  const { rows: memberRows } = await pool.query("SELECT display_name FROM members WHERE id = $1", [memberId]);
  const memberName = memberRows[0]?.display_name ?? "Member";
  await pool.query(`INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
     VALUES ($1, $2, 'PAYMENT_REJECTED', 'SYSTEM', $3, NOW())`, [room.id, memberId, `Bukti transfer ${memberName} ditolak: ${reason}`]);
}
async function getRoomEvents(roomCode) {
  const { rows } = await pool.query(`SELECT re.id, re.room_id, re.member_id, re.event_type, re.sender_type, re.message, re.created_at,
            m.display_name
     FROM room_events re
     JOIN rooms r ON r.id = re.room_id
     LEFT JOIN members m ON m.id = re.member_id
     WHERE r.room_code = $1
     ORDER BY re.created_at ASC
     LIMIT 100`, [roomCode]);
  return rows;
}
async function postChatMessage(roomCode, guestToken, message) {
  const clean = message.trim();
  if (!clean)
    throw new Error("Pesan tidak boleh kosong.");
  const { rows: roomRows } = await pool.query("SELECT id FROM rooms WHERE room_code = $1", [roomCode]);
  const room = roomRows[0];
  if (!room)
    throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  const client = await pool.connect();
  try {
    const memberId = await resolveMember(client, room.id, guestToken);
    const { rows: memberRows } = await client.query("SELECT display_name FROM members WHERE id = $1", [memberId]);
    const displayName = memberRows[0]?.display_name ?? "Tamu";
    const { rows: inserted } = await client.query(`INSERT INTO room_events (room_id, member_id, event_type, sender_type, message, created_at)
       VALUES ($1, $2, 'CHAT_MESSAGE', 'MEMBER', $3, NOW())
       RETURNING id, room_id, member_id, event_type, sender_type, message, created_at`, [room.id, memberId, clean]);
    return {
      ...inserted[0],
      display_name: displayName
    };
  } finally {
    client.release();
  }
}
async function updateRoomGroupPhoto(roomCode, groupPhotoUrl) {
  const { rows } = await pool.query("SELECT id FROM rooms WHERE room_code = $1", [roomCode]);
  const room = rows[0];
  if (!room)
    throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
  await pool.query("UPDATE rooms SET group_photo_url = $1, updated_at = NOW() WHERE id = $2", [groupPhotoUrl, room.id]);
  return { groupPhotoUrl };
}
async function addReceiptToRoom(roomCode, input, callerGuestToken, callerUserId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: roomRows } = await client.query("SELECT id, status, round_mode FROM rooms WHERE room_code = $1 FOR UPDATE", [roomCode]);
    const room = roomRows[0];
    if (!room)
      throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
    if (room.status === "CLOSED") {
      throw new RoomLockedError("Meja ini sudah selesai (closed), tidak bisa menambah struk.");
    }
    let callerMemberId = null;
    let callerName = "Member";
    if (callerGuestToken) {
      const { rows: memRows } = await client.query("SELECT id, display_name FROM members WHERE room_id = $1 AND guest_token = $2", [room.id, callerGuestToken]);
      if (memRows[0]) {
        callerMemberId = memRows[0].id;
        callerName = memRows[0].display_name;
      }
    } else if (callerUserId) {
      const { rows: memRows } = await client.query("SELECT id, display_name FROM members WHERE room_id = $1 AND user_id = $2", [room.id, callerUserId]);
      if (memRows[0]) {
        callerMemberId = memRows[0].id;
        callerName = memRows[0].display_name;
      }
    }
    let payerMemberId = input.payerMemberId || callerMemberId;
    let payerName = input.payerName;
    if (payerMemberId && !payerName) {
      const { rows: pRows } = await client.query("SELECT display_name FROM members WHERE id = $1", [payerMemberId]);
      if (pRows[0])
        payerName = pRows[0].display_name;
    }
    if (!payerName)
      payerName = callerName;
    const subtotal = input.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    const grandTotal = Math.max(0, subtotal + input.taxAmount + input.serviceAmount - input.discountAmount);
    const { rows: sortRows } = await client.query("SELECT MAX(sort_order) AS max_order FROM receipts WHERE room_id = $1", [room.id]);
    const nextOrder = (sortRows[0]?.max_order ?? 0) + 1;
    const { rows: newReceiptRows } = await client.query(`INSERT INTO receipts (
         room_id, payer_member_id, payer_name, title, receipt_image_url,
         subtotal, tax_amount, service_amount, discount_amount, grand_total,
         bank_name, bank_account_no, bank_account_name, qris_image_url,
         created_by_member_id, sort_order
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING id`, [
      room.id,
      payerMemberId,
      payerName,
      input.title,
      input.receiptImageUrl ?? null,
      subtotal,
      input.taxAmount,
      input.serviceAmount,
      input.discountAmount,
      grandTotal,
      input.bankName ?? null,
      input.bankAccountNo ?? null,
      input.bankAccountName ?? null,
      input.qrisImageUrl ?? null,
      callerMemberId,
      nextOrder
    ]);
    const receiptId = newReceiptRows[0].id;
    if (input.items.length > 0) {
      const itemValues = [];
      const placeholders = [];
      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i];
        const offset = i * 7;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
        itemValues.push(room.id, item.name, item.unitPrice, item.quantity, item.isShared ?? false, i, receiptId);
      }
      await client.query(`INSERT INTO items (room_id, name, unit_price, quantity, is_shared, sort_order, receipt_id)
         VALUES ${placeholders.join(", ")}`, itemValues);
    }
    await client.query(`UPDATE rooms r
       SET subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM receipts WHERE room_id = r.id),
           tax_amount = (SELECT COALESCE(SUM(tax_amount), 0) FROM receipts WHERE room_id = r.id),
           service_amount = (SELECT COALESCE(SUM(service_amount), 0) FROM receipts WHERE room_id = r.id),
           discount_amount = (SELECT COALESCE(SUM(discount_amount), 0) FROM receipts WHERE room_id = r.id),
           grand_total = (SELECT COALESCE(SUM(grand_total), 0) FROM receipts WHERE room_id = r.id),
           updated_at = NOW()
       WHERE r.id = $1`, [room.id]);
    if (room.status === "LOCKED") {
      await client.query("UPDATE rooms SET status = 'CLAIMING', locked_at = NULL WHERE id = $1", [room.id]);
    }
    await client.query(`INSERT INTO room_events (room_id, sender_type, message)
       VALUES ($1, 'SYSTEM', $2)`, [room.id, `${callerName} menambahkan struk baru: ${input.title}`]);
    await client.query("COMMIT");
    return await getRoomByCode(roomCode);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function deleteReceiptFromRoom(roomCode, receiptId, callerGuestToken, callerUserId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: roomRows } = await client.query("SELECT id, status, host_user_id FROM rooms WHERE room_code = $1 FOR UPDATE", [roomCode]);
    const room = roomRows[0];
    if (!room)
      throw new RoomNotFoundError(`Room ${roomCode} tidak ditemukan.`);
    if (room.status === "CLOSED") {
      throw new RoomLockedError("Meja ini sudah selesai (closed), tidak bisa menghapus struk.");
    }
    const { rows: rcRows } = await client.query("SELECT id, title, created_by_member_id FROM receipts WHERE id = $1 AND room_id = $2", [receiptId, room.id]);
    const rc = rcRows[0];
    if (!rc)
      throw new Error("Struk tidak ditemukan.");
    await client.query("DELETE FROM receipts WHERE id = $1", [receiptId]);
    await client.query(`UPDATE rooms r
       SET subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM receipts WHERE room_id = r.id),
           tax_amount = (SELECT COALESCE(SUM(tax_amount), 0) FROM receipts WHERE room_id = r.id),
           service_amount = (SELECT COALESCE(SUM(service_amount), 0) FROM receipts WHERE room_id = r.id),
           discount_amount = (SELECT COALESCE(SUM(discount_amount), 0) FROM receipts WHERE room_id = r.id),
           grand_total = (SELECT COALESCE(SUM(grand_total), 0) FROM receipts WHERE room_id = r.id),
           updated_at = NOW()
       WHERE r.id = $1`, [room.id]);
    await client.query(`INSERT INTO room_events (room_id, sender_type, message)
       VALUES ($1, 'SYSTEM', $2)`, [room.id, `Struk ${rc.title} telah dihapus`]);
    await client.query("COMMIT");
    return await getRoomByCode(roomCode);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// dist/controllers/rooms.controller.js
var createRoomSchema = import_zod2.z.object({
  title: import_zod2.z.string().trim().min(3).max(150),
  host_name: import_zod2.z.string().trim().min(1).max(60),
  bank_name: import_zod2.z.string().trim().max(50).optional(),
  bank_account_no: import_zod2.z.string().trim().max(50).optional(),
  bank_account_name: import_zod2.z.string().trim().max(100).optional(),
  round_mode: import_zod2.z.enum(["none", "hundred", "thousand"]).optional().default("hundred"),
  qris_image_url: import_zod2.z.string().optional(),
  receipt_image_url: import_zod2.z.string().optional(),
  items: import_zod2.z.array(import_zod2.z.object({
    name: import_zod2.z.string().trim().min(1).max(150),
    unit_price: import_zod2.z.number().int().nonnegative(),
    quantity: import_zod2.z.number().int().positive().max(999)
  })).min(1).max(100),
  tax_amount: import_zod2.z.number().int().nonnegative().default(0),
  service_amount: import_zod2.z.number().int().nonnegative().default(0),
  discount_amount: import_zod2.z.number().int().nonnegative().default(0)
});
async function createRoomHandler(req, res) {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
    return;
  }
  const { title, host_name, bank_name, bank_account_no, bank_account_name, round_mode, qris_image_url, receipt_image_url, items, tax_amount, service_amount, discount_amount } = parsed.data;
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
      quantity: item.quantity
    })),
    taxAmount: tax_amount,
    serviceAmount: service_amount,
    discountAmount: discount_amount,
    roundMode: round_mode
  });
  res.status(201).json({
    room_code: room.roomCode,
    status: room.status,
    host_token: room.hostToken,
    share_url: `${env.frontendUrl}/room/${room.roomCode}`,
    subtotal: room.subtotal,
    grand_total: room.grandTotal
  });
}
var joinRoomSchema = import_zod2.z.object({
  guest_token: import_zod2.z.string().uuid(),
  display_name: import_zod2.z.string().trim().max(60).default("")
});
async function joinRoomHandler(req, res) {
  const parsed = joinRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
    return;
  }
  try {
    const result = await joinRoom(String(req.params.code).toUpperCase(), {
      guestToken: parsed.data.guest_token,
      displayName: parsed.data.display_name
    }, req.userId);
    const code = String(req.params.code).toUpperCase();
    broadcastToRoom(code, { type: "ROOM_UPDATED", action: "MEMBER_JOINED" });
    res.json({
      member_id: result.memberId,
      display_name: result.displayName,
      is_host: result.isHost,
      room_status: result.roomStatus
    });
  } catch (error) {
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
async function getRoomHandler(req, res) {
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
      receipts: (room.receipts || []).map((rc) => ({
        id: rc.id,
        title: rc.title,
        payer_member_id: rc.payerMemberId,
        payer_name: rc.payerName,
        subtotal: rc.subtotal,
        tax_amount: rc.taxAmount,
        service_amount: rc.serviceAmount,
        discount_amount: rc.discountAmount,
        grand_total: rc.grandTotal,
        bank_name: rc.bankName,
        bank_account_no: rc.bankAccountNo,
        bank_account_name: rc.bankAccountName,
        qris_image_url: rc.qrisImageUrl,
        receipt_image_url: rc.receiptImageUrl,
        created_by_member_id: rc.createdByMemberId,
        sort_order: rc.sortOrder,
        created_at: rc.createdAt
      })),
      items: room.items.map((item) => ({
        id: item.id,
        name: item.name,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        is_shared: item.isShared,
        receipt_id: item.receiptId,
        claimed_quantity: item.claimedQuantity,
        claimed_by_member_ids: item.claimedByMemberIds,
        claims: item.claims.map((c) => ({
          member_id: c.memberId,
          portion_quantity: c.portionQuantity
        }))
      })),
      members: room.members.map((member) => ({
        id: member.id,
        user_id: member.userId,
        display_name: member.displayName,
        is_host: member.isHost,
        subtotal_share: member.subtotalShare,
        raw_share_amount: member.rawShareAmount,
        share_amount: member.shareAmount,
        receipt_breakdown: (member.receiptBreakdown || []).map((rb) => ({
          receipt_id: rb.receiptId,
          title: rb.title,
          payer_member_id: rb.payerMemberId,
          payer_name: rb.payerName,
          amount: rb.amount,
          bank_name: rb.bankName,
          bank_account_no: rb.bankAccountNo,
          bank_account_name: rb.bankAccountName,
          qris_image_url: rb.qrisImageUrl
        })),
        claimed_item_ids: member.claimedItemIds,
        payment_status: member.paymentStatus,
        proof_image_url: member.proofImageUrl,
        rejection_reason: member.rejectionReason
      }))
    });
  } catch (error) {
    if (error instanceof RoomNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    throw error;
  }
}
var claimSchema = import_zod2.z.object({
  guest_token: import_zod2.z.string().uuid()
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
async function claimItemHandler(req, res) {
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
  } catch (error) {
    handleClaimError(error, res);
  }
}
async function unclaimItemHandler(req, res) {
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
  } catch (error) {
    handleClaimError(error, res);
  }
}
async function lockRoomHandler(req, res) {
  const guestToken = typeof req.body?.guest_token === "string" ? req.body.guest_token : void 0;
  try {
    const code = String(req.params.code).toUpperCase();
    const result = await lockRoom(code, req.userId, guestToken);
    broadcastToRoom(code, { type: "ROOM_UPDATED", action: "ROOM_LOCKED" });
    res.json({ status: result.status });
  } catch (error) {
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
async function myRoomsHandler(req, res) {
  const rooms = await listMyRooms(req.userId);
  res.json({
    rooms: rooms.map((room) => ({
      room_code: room.roomCode,
      title: room.title,
      status: room.status,
      grand_total: room.grandTotal,
      created_at: room.createdAt
    }))
  });
}
async function deleteRoomHandler(req, res) {
  const guestToken = typeof req.body?.guest_token === "string" ? req.body.guest_token : void 0;
  try {
    await deleteRoom(String(req.params.code).toUpperCase(), req.userId, guestToken);
    res.status(204).end();
  } catch (error) {
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
async function unlockRoomHandler(req, res) {
  const guestToken = typeof req.body?.guest_token === "string" ? req.body.guest_token : void 0;
  try {
    const code = String(req.params.code).toUpperCase();
    const result = await unlockRoom(code, req.userId, guestToken);
    broadcastToRoom(code, { type: "ROOM_UPDATED", action: "ROOM_UNLOCKED" });
    res.json({ status: result.status });
  } catch (error) {
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
async function closeRoomHandler(req, res) {
  const guestToken = typeof req.body?.guest_token === "string" ? req.body.guest_token : void 0;
  try {
    const code = String(req.params.code).toUpperCase();
    const result = await closeRoom(code, req.userId, guestToken);
    broadcastToRoom(code, { type: "ROOM_UPDATED", action: "ROOM_CLOSED" });
    res.json({ status: result.status });
  } catch (error) {
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
async function splitUnclaimedHandler(req, res) {
  const guestToken = typeof req.body?.guest_token === "string" ? req.body.guest_token : void 0;
  try {
    const code = String(req.params.code).toUpperCase();
    await splitUnclaimedItems(code, req.userId, guestToken);
    broadcastToRoom(code, { type: "ROOM_UPDATED", action: "UNCLAIMED_SPLIT" });
    res.json({ success: true });
  } catch (error) {
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
var proofSchema = import_zod2.z.object({
  guest_token: import_zod2.z.string().uuid(),
  proof_image_url: import_zod2.z.string().min(1)
});
async function submitPaymentProofHandler(req, res) {
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
  } catch (error) {
    if (error instanceof RoomNotFoundError || error instanceof MemberNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    throw error;
  }
}
async function verifyPaymentHandler(req, res) {
  const guestToken = typeof req.body?.guest_token === "string" ? req.body.guest_token : void 0;
  try {
    const code = String(req.params.code).toUpperCase();
    await verifyPayment(code, String(req.params.memberId), req.userId, guestToken);
    broadcastToRoom(code, { type: "ROOM_UPDATED", action: "PAYMENT_VERIFIED" });
    res.json({ success: true });
  } catch (error) {
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
var rejectSchema = import_zod2.z.object({
  reason: import_zod2.z.string().trim().min(1).max(255),
  guest_token: import_zod2.z.string().optional()
});
async function rejectPaymentHandler(req, res) {
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
  } catch (error) {
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
async function getRoomEventsHandler(req, res) {
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
      created_at: e.created_at
    })));
  } catch (error) {
    if (error instanceof RoomNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    throw error;
  }
}
var chatSchema = import_zod2.z.object({
  guest_token: import_zod2.z.string().uuid(),
  message: import_zod2.z.string().trim().min(1).max(500)
});
async function postChatHandler(req, res) {
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
      created_at: event.created_at
    };
    broadcastToRoom(roomCode, { type: "CHAT_MESSAGE", data: chatPayload });
    res.json(chatPayload);
  } catch (error) {
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
var photoSchema = import_zod2.z.object({
  group_photo_url: import_zod2.z.string().nullable()
});
async function updateRoomPhotoHandler(req, res) {
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
  } catch (error) {
    if (error instanceof RoomNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    throw error;
  }
}
var ocrSchema = import_zod2.z.object({
  image: import_zod2.z.string().min(10, "Foto struk kasir harus dilampirkan.")
});
async function scanReceiptOcrHandler(req, res) {
  const parsed = ocrSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Foto struk kasir harus dilampirkan dalam format base64." });
    return;
  }
  try {
    const result = await parseReceiptWithGemini(parsed.data.image);
    res.json(result);
  } catch (error) {
    console.error("[OCR Controller Error]", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Gagal membaca struk kasir dengan AI."
    });
  }
}
var addReceiptSchema = import_zod2.z.object({
  title: import_zod2.z.string().trim().min(2).max(150),
  receipt_image_url: import_zod2.z.string().optional(),
  payer_member_id: import_zod2.z.string().uuid().optional(),
  payer_name: import_zod2.z.string().trim().max(100).optional(),
  bank_name: import_zod2.z.string().trim().max(50).optional(),
  bank_account_no: import_zod2.z.string().trim().max(50).optional(),
  bank_account_name: import_zod2.z.string().trim().max(100).optional(),
  qris_image_url: import_zod2.z.string().optional(),
  tax_amount: import_zod2.z.number().int().nonnegative().default(0),
  service_amount: import_zod2.z.number().int().nonnegative().default(0),
  discount_amount: import_zod2.z.number().int().nonnegative().default(0),
  items: import_zod2.z.array(import_zod2.z.object({
    name: import_zod2.z.string().trim().min(1).max(150),
    unit_price: import_zod2.z.number().int().nonnegative(),
    quantity: import_zod2.z.number().int().positive().max(999),
    is_shared: import_zod2.z.boolean().optional().default(false)
  })).min(1).max(100)
});
async function addReceiptHandler(req, res) {
  const parsed = addReceiptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data struk tidak valid.", details: parsed.error.flatten() });
    return;
  }
  const roomCode = String(req.params.code);
  const guestToken = req.headers["x-guest-token"];
  const userId = req.userId;
  try {
    const updated = await addReceiptToRoom(roomCode, {
      title: parsed.data.title,
      receiptImageUrl: parsed.data.receipt_image_url,
      payerMemberId: parsed.data.payer_member_id,
      payerName: parsed.data.payer_name,
      bankName: parsed.data.bank_name,
      bankAccountNo: parsed.data.bank_account_no,
      bankAccountName: parsed.data.bank_account_name,
      qrisImageUrl: parsed.data.qris_image_url,
      taxAmount: parsed.data.tax_amount,
      serviceAmount: parsed.data.service_amount,
      discountAmount: parsed.data.discount_amount,
      items: parsed.data.items.map((i) => ({
        name: i.name,
        unitPrice: i.unit_price,
        quantity: i.quantity,
        isShared: i.is_shared
      }))
    }, guestToken, userId);
    broadcastToRoom(roomCode, { type: "ROOM_UPDATED", action: "RECEIPT_ADDED" });
    res.status(201).json(updated);
  } catch (error) {
    if (error instanceof RoomNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof RoomLockedError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
}
async function deleteReceiptHandler(req, res) {
  const roomCode = String(req.params.code);
  const receiptId = String(req.params.receiptId);
  const guestToken = req.headers["x-guest-token"];
  const userId = req.userId;
  try {
    const updated = await deleteReceiptFromRoom(roomCode, receiptId, guestToken, userId);
    broadcastToRoom(roomCode, { type: "ROOM_UPDATED", action: "RECEIPT_DELETED" });
    res.json(updated);
  } catch (error) {
    if (error instanceof RoomNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof RoomLockedError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
}

// dist/routes/rooms.routes.js
var roomsRouter = (0, import_express2.Router)();
roomsRouter.post("/:code/receipts", optionalAuth, addReceiptHandler);
roomsRouter.delete("/:code/receipts/:receiptId", optionalAuth, deleteReceiptHandler);
roomsRouter.post("/ocr", scanReceiptOcrHandler);
roomsRouter.post("/:code/ocr", scanReceiptOcrHandler);
roomsRouter.post("/", optionalAuth, createRoomHandler);
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

// dist/app.js
var app = (0, import_express3.default)();
app.use((0, import_cors.default)({
  origin: (origin, callback) => {
    if (!origin)
      return callback(null, true);
    if (env.corsOrigin === "*" || origin === env.corsOrigin || origin.endsWith(".vercel.app") || origin.includes("localhost")) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(import_express3.default.json({ limit: "10mb" }));
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
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan di server." });
});

// dist/index.js
var server = import_node_http.default.createServer(app);
initWebSocketServer(server);
if (!process.env.VERCEL) {
  server.listen(env.port, () => {
    console.log(`PaTo backend (HTTP + WebSocket) jalan di http://localhost:${env.port}`);
    purgeOldRoomMedia().catch((err) => console.error("[Storage Purge Worker] Startup run failed:", err));
    const PURGE_INTERVAL_MS = 12 * 60 * 60 * 1e3;
    setInterval(() => {
      purgeOldRoomMedia().catch((err) => console.error("[Storage Purge Worker] Periodic run failed:", err));
    }, PURGE_INTERVAL_MS);
  });
}
var index_default = app;
