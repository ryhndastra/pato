import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";

// Map roomCode (uppercase) -> Set of active WebSocket connections
const roomClients = new Map<string, Set<WebSocket>>();

export function initWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (ws, req) => {
    try {
      const parsedUrl = new URL(req.url ?? "", "http://localhost");
      const roomCode = parsedUrl.searchParams.get("roomCode")?.toUpperCase();

      if (!roomCode) {
        ws.close(1008, "Missing roomCode query param");
        return;
      }

      if (!roomClients.has(roomCode)) {
        roomClients.set(roomCode, new Set());
      }
      const clients = roomClients.get(roomCode)!;
      clients.add(ws);

      let isAlive = true;
      ws.on("pong", () => {
        isAlive = true;
      });

      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
          }
        } catch {}
      });

      ws.on("close", () => {
        clients.delete(ws);
        if (clients.size === 0) {
          roomClients.delete(roomCode);
        }
      });

      ws.on("error", (err) => {
        console.error(`[WebSocket Error][Room ${roomCode}]`, err.message);
      });

      // Send initial connection acknowledgement
      ws.send(
        JSON.stringify({
          type: "CONNECTED",
          roomCode,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (err) {
      console.error("[WebSocket Connection Handler Error]", err);
      ws.close(1011, "Internal server error");
    }
  });

  // Heartbeat ping interval every 30 seconds
  const heartbeatInterval = setInterval(() => {
    for (const [code, clients] of roomClients.entries()) {
      for (const ws of clients) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          clients.delete(ws);
        }
      }
      if (clients.size === 0) {
        roomClients.delete(code);
      }
    }
  }, 30000);

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  return wss;
}

export function broadcastToRoom(roomCode: string, payload: Record<string, unknown>) {
  const upper = roomCode.toUpperCase();
  const clients = roomClients.get(upper);
  if (!clients || clients.size === 0) return;

  const data = JSON.stringify({
    ...payload,
    roomCode: upper,
    timestamp: new Date().toISOString(),
  });

  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(data);
      } catch (err) {
        console.error(`[WebSocket Broadcast Error][Room ${upper}]`, err);
      }
    }
  }
}
