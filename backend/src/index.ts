import http from "node:http";
import { env } from "./config.js";
import { app } from "./app.js";
import { purgeOldRoomMedia } from "./services/rooms.service.js";
import { initWebSocketServer } from "./websocket.js";

const server = http.createServer(app);

// Inisialisasi WebSocket server untuk sinkronisasi live real-time di meja patungan
initWebSocketServer(server);

if (!process.env.VERCEL) {
  server.listen(env.port, () => {
    console.log(`PaTo backend (HTTP + WebSocket) jalan di http://localhost:${env.port}`);

    // F10 Ephemeral Storage Purge Worker: jalan di background tiap 12 jam & saat startup
    purgeOldRoomMedia().catch((err) =>
      console.error("[Storage Purge Worker] Startup run failed:", err),
    );

    const PURGE_INTERVAL_MS = 12 * 60 * 60 * 1000;
    setInterval(() => {
      purgeOldRoomMedia().catch((err) =>
        console.error("[Storage Purge Worker] Periodic run failed:", err),
      );
    }, PURGE_INTERVAL_MS);
  });
}

export default app;
