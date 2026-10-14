import "dotenv/config";
export const env = {
    port: Number(process.env.PORT ?? 4000),
    corsOrigin: process.env.CORS_ORIGIN ?? "*",
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
    jwtSecret: process.env.JWT_SECRET ||
        (process.env.NODE_ENV === "production"
            ? "pato_session_fallback_secret_prod_secure_2026"
            : "dev_pato_secret_key_12345"),
    googleClientId: process.env.GOOGLE_CLIENT_ID ||
        process.env.VITE_GOOGLE_CLIENT_ID ||
        "719565988722-k5ggk4uck65skvn506bhilpi4gv90uc2.apps.googleusercontent.com",
    geminiApiKeys: (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
};
if (!process.env.JWT_SECRET) {
    console.warn("⚠️ PERINGATAN: JWT_SECRET belum di-set di environment variables!");
}
//# sourceMappingURL=config.js.map