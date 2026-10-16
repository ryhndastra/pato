import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config.js";
import { pool } from "../db.js";

export class EmailTakenError extends Error {}
export class InvalidCredentialsError extends Error {}
export class GoogleTokenError extends Error {}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  hasPassword?: boolean;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  password_hash: string | null;
}

const SALT_ROUNDS = 10;

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  const { rows: existing } = await pool.query<{ id: string }>(
    "SELECT id FROM users WHERE email = $1",
    [email],
  );
  if (existing.length > 0) {
    throw new EmailTakenError(`Email ${email} sudah terdaftar.`);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { rows } = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash, name, auth_provider)
     VALUES ($1, $2, $3, 'local')
     RETURNING id, email, name, avatar_url, password_hash`,
    [email, passwordHash, name],
  );

  return toAuthUser(rows[0]);
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const { rows } = await pool.query<UserRow>(
    "SELECT id, email, name, avatar_url, password_hash FROM users WHERE email = $1",
    [email],
  );
  const user = rows[0];
  if (!user || !user.password_hash) {
    throw new InvalidCredentialsError("Email atau kata sandi salah.");
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    throw new InvalidCredentialsError("Email atau kata sandi salah.");
  }

  return toAuthUser(user);
}

const googleClient = new OAuth2Client(env.googleClientId);

export async function loginWithGoogle(idToken: string): Promise<AuthUser> {
  if (!env.googleClientId) {
    throw new GoogleTokenError("GOOGLE_CLIENT_ID belum dikonfigurasi di server.");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.error("Google token verification error:", err);
    throw new GoogleTokenError("Token Google tidak valid.");
  }

  if (!payload?.email) {
    throw new GoogleTokenError("Token Google tidak punya email.");
  }

  const { rows } = await pool.query<UserRow>(
    `INSERT INTO users (email, name, avatar_url, auth_provider)
     VALUES ($1, $2, $3, 'google')
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, updated_at = NOW()
     RETURNING id, email, name, avatar_url, password_hash`,
    [payload.email, payload.name ?? payload.email.split("@")[0], payload.picture ?? null],
  );

  return toAuthUser(rows[0]);
}

function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    hasPassword: Boolean(row.password_hash),
  };
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const { rows } = await pool.query<UserRow>(
    "SELECT id, email, name, avatar_url, password_hash FROM users WHERE id = $1",
    [userId],
  );
  if (!rows[0]) return null;
  return toAuthUser(rows[0]);
}

export async function updateUserProfile(
  userId: string,
  params: {
    name?: string;
    avatarUrl?: string | null;
    currentPassword?: string;
    newPassword?: string;
  },
): Promise<AuthUser> {
  const { rows } = await pool.query<UserRow>(
    "SELECT id, email, name, avatar_url, password_hash FROM users WHERE id = $1",
    [userId],
  );
  const user = rows[0];
  if (!user) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  let newPasswordHash: string | null = null;
  if (params.newPassword) {
    if (user.password_hash) {
      if (!params.currentPassword) {
        throw new InvalidCredentialsError("Kata sandi saat ini harus diisi.");
      }
      const matches = await bcrypt.compare(params.currentPassword, user.password_hash);
      if (!matches) {
        throw new InvalidCredentialsError("Kata sandi saat ini salah.");
      }
    }
    newPasswordHash = await bcrypt.hash(params.newPassword, SALT_ROUNDS);
  }

  const updates: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [userId];
  let paramIndex = 2;

  if (params.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(params.name.trim());
  }

  if (params.avatarUrl !== undefined) {
    updates.push(`avatar_url = $${paramIndex++}`);
    values.push(params.avatarUrl);
  }

  if (newPasswordHash !== null) {
    updates.push(`password_hash = $${paramIndex++}`);
    values.push(newPasswordHash);
  }

  const query = `
    UPDATE users
    SET ${updates.join(", ")}
    WHERE id = $1
    RETURNING id, email, name, avatar_url, password_hash
  `;

  const { rows: updatedRows } = await pool.query<UserRow>(query, values);
  return toAuthUser(updatedRows[0]);
}

