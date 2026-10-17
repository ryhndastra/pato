import { useCallback, useEffect, useRef, useState } from "react";
import { Check, DownloadSimple, ShareNetwork, Sparkle, X } from "@phosphor-icons/react";
import type { RoomDetail } from "./types";
import { safeIDR } from "./money";

interface ReceiptExportModalProps {
  room: RoomDetail;
  onClose: () => void;
}

type ReceiptTheme = "THERMAL" | "CYBER" | "KRAFT" | "PASTEL";

const THEMES: { id: ReceiptTheme; label: string; desc: string }[] = [
  { id: "THERMAL", label: "Thermal Minimalist", desc: "Monokrom klasik kafe" },
  { id: "CYBER", label: "Midnight Cyber", desc: "Dark tech elektrik neon" },
  { id: "KRAFT", label: "Vintage Kraft", desc: "Kertas hangat retro" },
  { id: "PASTEL", label: "Clean Pastel", desc: "Modern fresh Gen-Z" },
];

function drawRow(
  ctx: CanvasRenderingContext2D,
  left: string,
  right: string,
  xLeft: number,
  xRight: number,
  y: number,
  color: string,
  fontSans: string,
  fontMono: string,
) {
  ctx.textAlign = "left";
  ctx.fillStyle = color;
  ctx.font = `13px ${fontSans}`;
  ctx.fillText(left, xLeft, y);

  ctx.textAlign = "right";
  ctx.fillStyle = color;
  ctx.font = `13px ${fontMono}`;
  ctx.fillText(right, xRight, y);
}

function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y1);
  ctx.stroke();
  ctx.restore();
}

export function ReceiptExportModal({ room, onClose }: ReceiptExportModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<ReceiptTheme>("THERMAL");
  const [downloading, setDownloading] = useState(false);
  const [shared, setShared] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawReceiptCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 640;
    const items = room.items ?? [];
    const members = room.members ?? [];

    const baseHeight = 520;
    const itemsHeight = items.length * 32;
    const membersHeight = members.length * 36;
    const height = baseHeight + itemsHeight + membersHeight;

    const dpr = 2;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    let bg = "#F8FAFC";
    let paperBg = "#FFFFFF";
    let textColor = "#0F172A";
    let textMuted = "#64748B";
    let borderColor = "#E2E8F0";
    let accentColor = "#2563EB";
    let fontMono = "'Space Mono', monospace";
    let fontSans = "'Plus Jakarta Sans', sans-serif";

    if (selectedTheme === "CYBER") {
      bg = "#0B1120";
      paperBg = "#0F172A";
      textColor = "#F8FAFC";
      textMuted = "#94A3B8";
      borderColor = "#1E293B";
      accentColor = "#38BDF8";
    } else if (selectedTheme === "KRAFT") {
      bg = "#EADBC8";
      paperBg = "#F8F1E7";
      textColor = "#422818";
      textMuted = "#8C6D53";
      borderColor = "#DDCBBB";
      accentColor = "#9C4A2F";
      fontMono = "'Courier New', Courier, monospace";
    } else if (selectedTheme === "PASTEL") {
      bg = "#F1F5F9";
      paperBg = "#FFFFFF";
      textColor = "#1E1B4B";
      textMuted = "#6B7280";
      borderColor = "#E0E7FF";
      accentColor = "#6366F1";
    }

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const margin = 24;
    const cardWidth = width - margin * 2;
    const cardHeight = height - margin * 2;

    ctx.save();
    ctx.fillStyle = paperBg;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(margin, margin, cardWidth, cardHeight, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    let y = margin + 36;

    ctx.fillStyle = accentColor;
    ctx.font = `bold 13px ${fontMono}`;
    ctx.textAlign = "center";
    ctx.letterSpacing = "2px";
    ctx.fillText("PATO DIGITAL RECEIPT", width / 2, y);

    y += 24;
    ctx.fillStyle = textColor;
    ctx.font = `bold 22px ${fontSans}`;
    ctx.letterSpacing = "-0.5px";
    ctx.fillText(room.title, width / 2, y);

    y += 20;
    ctx.fillStyle = textMuted;
    ctx.font = `12px ${fontMono}`;
    const dateStr = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    ctx.fillText(`KODE: ${room.room_code} · ${dateStr}`, width / 2, y);

    y += 24;
    drawDashedLine(ctx, margin + 20, y, width - margin - 20, borderColor);

    y += 24;
    ctx.textAlign = "left";
    ctx.fillStyle = textMuted;
    ctx.font = `bold 11px ${fontMono}`;
    ctx.fillText("MENU PESANAN", margin + 24, y);
    ctx.textAlign = "right";
    ctx.fillText("HARGA", width - margin - 24, y);

    y += 18;
    for (const item of items) {
      const qty = item.quantity;
      const total = item.unit_price * qty;

      ctx.textAlign = "left";
      ctx.fillStyle = textColor;
      ctx.font = `13px ${fontSans}`;
      const name = item.name.length > 28 ? `${item.name.substring(0, 26)}...` : item.name;
      ctx.fillText(`${name} x${qty}`, margin + 24, y);

      ctx.textAlign = "right";
      ctx.fillStyle = textColor;
      ctx.font = `bold 13px ${fontMono}`;
      ctx.fillText(safeIDR(total), width - margin - 24, y);

      y += 26;
    }

    y += 8;
    drawDashedLine(ctx, margin + 20, y, width - margin - 20, borderColor);

    y += 22;
    drawRow(ctx, "Subtotal", safeIDR(room.subtotal), margin + 24, width - margin - 24, y, textMuted, fontSans, fontMono);

    const hasTax = (room.tax_amount ?? 0) > 0;
    const hasService = (room.service_amount ?? 0) > 0;
    const hasDiscount = (room.discount_amount ?? 0) > 0;

    if (hasTax) {
      y += 20;
      drawRow(ctx, "Pajak (PB1)", safeIDR(room.tax_amount), margin + 24, width - margin - 24, y, textMuted, fontSans, fontMono);
    }
    if (hasService) {
      y += 20;
      drawRow(ctx, "Service Charge", safeIDR(room.service_amount), margin + 24, width - margin - 24, y, textMuted, fontSans, fontMono);
    }
    if (hasDiscount) {
      y += 20;
      drawRow(ctx, "Diskon", `-${safeIDR(room.discount_amount)}`, margin + 24, width - margin - 24, y, accentColor, fontSans, fontMono);
    }

    y += 24;
    ctx.fillStyle = textColor;
    ctx.font = `bold 15px ${fontSans}`;
    ctx.textAlign = "left";
    ctx.fillText("TOTAL TAGIHAN", margin + 24, y);

    ctx.font = `bold 18px ${fontMono}`;
    ctx.textAlign = "right";
    ctx.fillText(safeIDR(room.grand_total), width - margin - 24, y);

    y += 28;
    drawDashedLine(ctx, margin + 20, y, width - margin - 20, borderColor);

    y += 24;
    ctx.textAlign = "left";
    ctx.fillStyle = textMuted;
    ctx.font = `bold 11px ${fontMono}`;
    ctx.fillText("PEMBAGIAN ADIL (PER MEMBER)", margin + 24, y);

    y += 18;
    for (const member of members) {
      ctx.textAlign = "left";
      ctx.fillStyle = textColor;
      ctx.font = `13px ${fontSans}`;
      const hostTag = member.is_host ? " (Host)" : "";
      ctx.fillText(`${member.display_name}${hostTag}`, margin + 24, y);

      ctx.textAlign = "right";
      ctx.fillStyle = accentColor;
      ctx.font = `bold 13px ${fontMono}`;
      ctx.fillText(safeIDR(member.share_amount), width - margin - 24, y);

      y += 28;
    }

    y += 16;
    drawDashedLine(ctx, margin + 20, y, width - margin - 20, borderColor);

    y += 28;
    ctx.textAlign = "center";
    ctx.fillStyle = textMuted;
    ctx.font = `11px ${fontSans}`;
    ctx.fillText("Dihitung adil tanpa drama via PaTo", width / 2, y);

    y += 18;
    ctx.font = `bold 10px ${fontMono}`;
    ctx.fillStyle = accentColor;
    ctx.fillText("pato.id · Patungan Otomatis", width / 2, y);
  }, [selectedTheme, room]);

  useEffect(() => {
    drawReceiptCanvas();
  }, [drawReceiptCanvas]);

  async function handleDownloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `pato-receipt-${room.room_code.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  async function handleShareReceipt() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `pato-${room.room_code}.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Struk Tagihan ${room.title}`,
            text: `Rincian patungan meja ${room.title} via PaTo.`,
          });
          setShared(true);
          setTimeout(() => setShared(false), 2500);
        } else {
          handleDownloadPng();
        }
      });
    } catch {
      handleDownloadPng();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-backdrop-fade"
      role="dialog"
      aria-modal="true"
      aria-label="Struk Digital Estetik"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-shell shadow-2xl animate-dialog-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-tint text-brand">
              <Sparkle size={18} weight="bold" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink">Struk Digital Estetik</h3>
              <p className="text-[11px] text-ink-muted">Siap dibagikan ke Instagram Story atau WhatsApp</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-haze hover:text-ink"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            {THEMES.map((theme) => {
              const active = selectedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`flex flex-col rounded-xl border px-3 py-2 text-left transition-all ${
                    active
                      ? "border-brand bg-tint text-brand shadow-sm"
                      : "border-hairline bg-white text-ink hover:bg-haze"
                  }`}
                >
                  <span className="text-xs font-bold">{theme.label}</span>
                  <span className="text-[10px] text-ink-muted">{theme.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center overflow-auto rounded-xl border border-hairline bg-slate-900/5 p-4">
            <canvas ref={canvasRef} className="max-h-[50vh] w-auto max-w-full rounded-lg shadow-md" />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={downloading}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <DownloadSimple size={16} weight="bold" />
              {downloading ? "Mengunduh..." : "Unduh Gambar (PNG)"}
            </button>

            <button
              type="button"
              onClick={handleShareReceipt}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-hairline bg-white px-4 text-xs font-bold text-ink transition-all hover:bg-haze active:scale-[0.98]"
            >
              {shared ? <Check size={16} weight="bold" className="text-success" /> : <ShareNetwork size={16} weight="bold" />}
              <span>{shared ? "Tersimpan" : "Bagikan"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
