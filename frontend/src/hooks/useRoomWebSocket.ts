import { useEffect, useRef, useState } from "react";

interface UseRoomWebSocketOptions {
  roomCode?: string;
  onRoomUpdated?: () => void;
  onChatMessage?: (chat: unknown) => void;
}

export function useRoomWebSocket({
  roomCode,
  onRoomUpdated,
  onChatMessage,
}: UseRoomWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const hasConnectedOnceRef = useRef(false);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const onRoomUpdatedRef = useRef(onRoomUpdated);
  onRoomUpdatedRef.current = onRoomUpdated;

  const onChatMessageRef = useRef(onChatMessage);
  onChatMessageRef.current = onChatMessage;

  useEffect(() => {
    if (!roomCode) return;
    const targetRoomCode = roomCode;
    let ws: WebSocket | null = null;
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;

      const isHttps = window.location.protocol === "https:";
      const protocol = isHttps ? "wss:" : "ws:";
      const host = window.location.host;

      let wsUrl = `${protocol}//${host}/api/ws?roomCode=${encodeURIComponent(targetRoomCode)}`;
      // Support direct connection in local dev if port is 5173
      if (import.meta.env.DEV && window.location.port === "5173") {
        wsUrl = `ws://localhost:4000/api/ws?roomCode=${encodeURIComponent(targetRoomCode)}`;
      }

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isUnmounted) {
            ws?.close();
            return;
          }
          if (hasConnectedOnceRef.current) {
            setJustReconnected(true);
            setTimeout(() => setJustReconnected(false), 2500);
          }
          hasConnectedOnceRef.current = true;
          setIsConnected(true);
          setIsReconnecting(false);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "ROOM_UPDATED") {
              onRoomUpdatedRef.current?.();
            } else if (msg.type === "CHAT_MESSAGE") {
              onChatMessageRef.current?.(msg.data);
              onRoomUpdatedRef.current?.();
            }
          } catch (err) {
            console.error("[WebSocket message parse error]", err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (hasConnectedOnceRef.current) {
            setIsReconnecting(true);
          }
          if (!isUnmounted) {
            reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (err) {
        console.error("[WebSocket initialization error]", err);
        if (hasConnectedOnceRef.current) {
          setIsReconnecting(true);
        }
        if (!isUnmounted) {
          reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
        }
      }
    }

    connect();

    function handleOnline() {
      if (!isConnected) {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        connect();
      }
    }

    window.addEventListener("online", handleOnline);

    return () => {
      isUnmounted = true;
      window.removeEventListener("online", handleOnline);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      ws?.close();
    };
  }, [roomCode]);

  return { isConnected, isReconnecting, justReconnected };
}
