import { env } from "./config.js";
import { app } from "./app.js";
import { purgeOldRoomMedia } from "./services/rooms.service.js";
if (!process.env.VERCEL) {
    app.listen(env.port, () => {
        console.log(`PaTo backend jalan di http://localhost:${env.port}`);
        // F10 Ephemeral Storage Purge Worker: jalan di background tiap 12 jam & saat startup
        purgeOldRoomMedia().catch((err) => console.error("[Storage Purge Worker] Startup run failed:", err));
        const PURGE_INTERVAL_MS = 12 * 60 * 60 * 1000;
        setInterval(() => {
            purgeOldRoomMedia().catch((err) => console.error("[Storage Purge Worker] Periodic run failed:", err));
        }, PURGE_INTERVAL_MS);
    });
}
export default app;
//# sourceMappingURL=index.js.map