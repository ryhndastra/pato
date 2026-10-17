import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ChatCircleDots,
  Info,
  PaperPlaneRight,
  X,
} from "@phosphor-icons/react";
import { apiGet, apiPost } from "../../lib/api";
import { getGuestToken } from "./guestToken";
import { useRoomWebSocket } from "../../hooks/useRoomWebSocket";
import { soundFX } from "../../lib/soundFx";
import type { RoomEvent } from "./types";

interface ChatDrawerProps {
  roomCode: string;
  isJoined: boolean;
  isOpen: boolean;
  onClose: () => void;
  onNewActivity?: (ev: RoomEvent) => void;
  onResetUnread?: () => void;
}

export function ChatDrawer({
  roomCode,
  isJoined,
  isOpen,
  onClose,
  onNewActivity,
  onResetUnread,
}: ChatDrawerProps) {
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const fetchEvents = useCallback(() => {
    if (!roomCode) return;
    apiGet<RoomEvent[]>(`/api/rooms/${encodeURIComponent(roomCode)}/events`)
      .then((res) => {
        setEvents((prev) => {
          const map = new Map<string, RoomEvent>();
          for (const ev of prev) map.set(ev.id, ev);
          for (const ev of res) map.set(ev.id, ev);
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
        });
      })
      .catch(() => {});
  }, [roomCode]);

  const seenEventIdsRef = useRef<Set<string>>(new Set());

  useRoomWebSocket({
    roomCode,
    onRoomUpdated: () => {
      // Room state changed (e.g. claim, unclaim, lock, close), fetch logs immediately!
      fetchEvents();
    },
    onChatMessage: (newChat) => {
      if (newChat && typeof newChat === "object" && "id" in newChat) {
        const ev = newChat as RoomEvent;
        if (!ev.id || seenEventIdsRef.current.has(ev.id)) return;
        seenEventIdsRef.current.add(ev.id);

        if (ev.event_type === "CHAT_MESSAGE" && ev.sender_type !== "SYSTEM") {
          soundFX.playMessage();
        }
        setEvents((prev) => {
          if (prev.some((e) => e.id === ev.id)) return prev;
          return [...prev, ev];
        });
        onNewActivity?.(ev);
      }
    },
  });

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // When drawer is opened, reset unread counter immediately
  useEffect(() => {
    if (isOpen) {
      onResetUnread?.();
    }
  }, [isOpen, onResetUnread]);

  const uniqueEvents = useMemo(() => {
    const seen = new Set<string>();
    return events.filter((ev) => {
      if (!ev.id || seen.has(ev.id)) return false;
      seen.add(ev.id);
      return true;
    });
  }, [events]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [uniqueEvents, isOpen]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const clean = message.trim();
    if (!clean || sending || !isJoined) return;

    setSending(true);
    try {
      const newEvent = await apiPost<RoomEvent>(
        `/api/rooms/${encodeURIComponent(roomCode)}/chat`,
        {
          guest_token: getGuestToken(roomCode),
          message: clean,
        },
      );
      // Strictly deduplicate by ID so sender never sees duplicate message
      setEvents((prev) => {
        if (prev.some((e) => e.id === newEvent.id)) return prev;
        return [...prev, newEvent];
      });
      setMessage("");
    } catch {
      // Ignore transient errors
    } finally {
      setSending(false);
    }
  }

  function formatTime(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-end sm:justify-end sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-backdrop-fade"
        onClick={onClose}
      />

      {/* Drawer Container: Bottom sheet on mobile, floating card on desktop */}
      <div className="relative z-10 flex h-[520px] max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[32px] border border-slate-200/80 bg-white shadow-2xl sm:w-[380px] sm:rounded-3xl animate-modal-spring">
        {/* Mobile drag handle */}
        <div className="flex items-center justify-center pt-2.5 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ChatCircleDots size={18} weight="bold" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-tight">Obrolan Meja</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{uniqueEvents.length} aktivitas terdata</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup obrolan"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-90 transition-all"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Messages Stream */}
        <div
          ref={scrollRef}
          className="flex flex-1 flex-col gap-2 overflow-y-auto p-4 text-xs text-slate-700"
        >
          {uniqueEvents.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center text-slate-400">
              <ChatCircleDots size={36} weight="regular" className="mb-2 text-slate-300" />
              <p className="text-xs font-bold text-slate-700">Belum ada obrolan</p>
              <p className="mt-0.5 max-w-[24ch] text-[11px] text-slate-400">
                Ketik pesan untuk bertanya atau berkoordinasi dengan teman semeja.
              </p>
            </div>
          ) : (
            uniqueEvents.map((ev) => {
              const isSystem = ev.sender_type === "SYSTEM";

              if (isSystem) {
                return (
                  <div
                    key={ev.id}
                    className="flex items-start gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600 border border-slate-100"
                  >
                    <Info size={14} weight="bold" className="mt-0.5 shrink-0 text-blue-500" />
                    <span className="flex-1 font-medium">{ev.message}</span>
                    <span className="shrink-0 font-mono text-[9px] text-slate-400">
                      {formatTime(ev.created_at)}
                    </span>
                  </div>
                );
              }

              return (
                <div key={ev.id} className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-1.5 px-1">
                    <span className="font-bold text-slate-900 text-[11px]">{ev.display_name}</span>
                    <span className="font-mono text-[9px] text-slate-400">
                      {formatTime(ev.created_at)}
                    </span>
                  </div>
                  <div className="w-fit max-w-[85%] rounded-2xl rounded-tl-xs bg-blue-50/80 px-3.5 py-2 text-xs font-medium text-slate-900 border border-blue-100/70 shadow-2xs">
                    {ev.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Send Form with safe-area padding */}
        {isJoined ? (
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-slate-100 bg-white px-3.5 pt-3 pb-[calc(max(env(safe-area-inset-bottom,0px),0px)+0.75rem)]"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis pesan ke teman..."
              maxLength={300}
              className="flex-1 rounded-full border border-slate-200/90 bg-slate-50/70 px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-600 focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!message.trim() || sending}
              aria-label="Kirim pesan"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs transition-all hover:bg-blue-700 active:scale-90 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
            >
              <PaperPlaneRight size={15} weight="bold" />
            </button>
          </form>
        ) : (
          <div className="border-t border-slate-100 bg-slate-50/70 p-3 text-center text-[11px] font-medium text-slate-400">
            Gabung ke meja untuk ikut mengobrol
          </div>
        )}
      </div>
    </div>
  );
}

