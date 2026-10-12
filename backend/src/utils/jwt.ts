import jwt from "jsonwebtoken";
import { env } from "../config.js";

export interface SessionPayload {
  sub: string; // user id
  email: string;
}

const EXPIRES_IN = "30d";

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: EXPIRES_IN });
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, env.jwtSecret) as SessionPayload;
}
