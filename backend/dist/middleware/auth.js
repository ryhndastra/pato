import { verifySession } from "../utils/jwt.js";
/** Attaches req.userId if a valid Bearer token is present; never rejects. */
export function optionalAuth(req, _res, next) {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) {
        try {
            req.userId = verifySession(token).sub;
        }
        catch {
            // invalid/expired token: just treat the request as anonymous
        }
    }
    next();
}
/** Rejects with 401 unless a valid Bearer token was present. */
export function requireAuth(req, res, next) {
    if (!req.userId) {
        res.status(401).json({ error: "Kamu harus login dulu." });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map