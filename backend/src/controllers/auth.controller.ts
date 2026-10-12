import type { Request, Response } from "express";
import { z } from "zod";
import {
  EmailTakenError,
  GoogleTokenError,
  InvalidCredentialsError,
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  type AuthUser,
} from "../services/auth.service.js";
import { signSession } from "../utils/jwt.js";

function sendSession(res: Response, user: AuthUser, status = 200) {
  const token = signSession({ sub: user.id, email: user.email });
  res.status(status).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatarUrl,
    },
  });
}

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
});

export async function registerHandler(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
    return;
  }

  try {
    const user = await registerWithEmail(
      parsed.data.name,
      parsed.data.email,
      parsed.data.password,
    );
    sendSession(res, user, 201);
  } catch (error) {
    if (error instanceof EmailTakenError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function loginHandler(req: Request, res: Response) {
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

const googleSchema = z.object({
  id_token: z.string().min(1),
});

export async function googleHandler(req: Request, res: Response) {
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
