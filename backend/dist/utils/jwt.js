import jwt from "jsonwebtoken";
import { env } from "../config.js";
const EXPIRES_IN = "30d";
export function signSession(payload) {
    return jwt.sign(payload, env.jwtSecret, { expiresIn: EXPIRES_IN });
}
export function verifySession(token) {
    return jwt.verify(token, env.jwtSecret);
}
//# sourceMappingURL=jwt.js.map