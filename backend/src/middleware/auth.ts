import type { NextFunction, Request, Response } from "express";
import { verifySession } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/** Attaches req.userId if a valid Bearer token is present; never rejects. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (token) {
    try {
      req.userId = verifySession(token).sub;
    } catch {
      // invalid/expired token: just treat the request as anonymous
    }
  }

  next();
}
