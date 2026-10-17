import { z } from "zod";
import { EmailTakenError, GoogleTokenError, InvalidCredentialsError, getUserById, loginWithEmail, loginWithGoogle, registerWithEmail, updateUserProfile, } from "../services/auth.service.js";
import { signSession } from "../utils/jwt.js";
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
            default_round_mode: user.defaultRoundMode,
        },
    });
}
const registerSchema = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(100),
});
export async function registerHandler(req, res) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
        return;
    }
    try {
        const user = await registerWithEmail(parsed.data.name, parsed.data.email, parsed.data.password);
        sendSession(res, user, 201);
    }
    catch (error) {
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
export async function loginHandler(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
        return;
    }
    try {
        const user = await loginWithEmail(parsed.data.email, parsed.data.password);
        sendSession(res, user);
    }
    catch (error) {
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
export async function googleHandler(req, res) {
    const parsed = googleSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Data gak valid.", details: parsed.error.flatten() });
        return;
    }
    try {
        const user = await loginWithGoogle(parsed.data.id_token);
        sendSession(res, user);
    }
    catch (error) {
        if (error instanceof GoogleTokenError) {
            res.status(401).json({ error: error.message });
            return;
        }
        throw error;
    }
}
export async function meHandler(req, res) {
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
            default_round_mode: user.defaultRoundMode,
        },
    });
}
const updateProfileSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    avatar_url: z.string().nullable().optional(),
    current_password: z.string().min(1).optional(),
    new_password: z.string().min(8).max(100).optional(),
    default_bank_name: z.string().nullable().optional(),
    default_bank_account_no: z.string().nullable().optional(),
    default_bank_account_name: z.string().nullable().optional(),
    default_round_mode: z.enum(["none", "hundred", "thousand"]).optional(),
});
export async function updateProfileHandler(req, res) {
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
            defaultRoundMode: parsed.data.default_round_mode,
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
                default_round_mode: updated.defaultRoundMode,
            },
        });
    }
    catch (error) {
        if (error instanceof InvalidCredentialsError) {
            res.status(400).json({ error: error.message });
            return;
        }
        throw error;
    }
}
//# sourceMappingURL=auth.controller.js.map