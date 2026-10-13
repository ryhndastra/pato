import "./config.js";
import dns from "node:dns";
import pg from "pg";

// Di jaringan sandbox ini (lewat Tailscale), getaddrinfo ke host Supabase
// kadang gagal sementara (EAI_AGAIN) dan tanpa timeout eksplisit pg akan
// menggantung puluhan detik sebelum menyerah. Dua mitigasi:
// 1. Prefer IPv4 - sedikit mengurangi kemungkinan resolver nyangkut di AAAA.
// 2. connectionTimeoutMillis - gagal cepat (5 detik) daripada hang lama.
dns.setDefaultResultOrder("ipv4first");

const isSupabaseOrCloud =
  Boolean(process.env.VERCEL) ||
  process.env.NODE_ENV === "production" ||
  Boolean(process.env.DATABASE_URL?.includes("supabase"));

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isSupabaseOrCloud ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 300000,
  min: process.env.DB_POOL_MIN ? Number(process.env.DB_POOL_MIN) : (process.env.VERCEL ? 0 : 2),
  max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : (process.env.VERCEL ? 2 : 10),
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

const TRANSIENT_ERROR_CODES = new Set([
  "EAI_AGAIN",
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
]);

const rawConnect = pool.connect.bind(pool);

/** Retry singkat buat kegagalan koneksi transient (DNS blip, reset jaringan).
 *  Mendukung style callback (yang dipakai internal pool.query) dan Promise style. */
function connectWithRetry(
  callback?: (
    err: Error | null | undefined,
    client: pg.PoolClient | undefined,
    done: (release?: unknown) => void,
  ) => void,
): unknown {
  if (typeof callback === "function") {
    const attemptConnect = (attempt: number) => {
      rawConnect((err, client, done) => {
        if (!err) {
          return callback(null, client, done);
        }
        const code = (err as NodeJS.ErrnoException)?.code;
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
        const code = (error as NodeJS.ErrnoException)?.code;
        if (attempt >= 2 || !code || !TRANSIENT_ERROR_CODES.has(code)) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      }
    }
  })();
}

(pool as unknown as { connect: typeof connectWithRetry }).connect = connectWithRetry;
