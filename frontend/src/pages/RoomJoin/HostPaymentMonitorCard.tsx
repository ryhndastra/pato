import { useState } from "react";
import {
  CaretDown,
  CaretUp,
  Check,
  CheckCircle,
  Clock,
  Eye,
  LockKeyOpen,
  WarningCircle,
  WhatsappLogo,
  X,
  XCircle,
} from "@phosphor-icons/react";
import { safeIDR } from "./money";
import type { RoomDetail, RoomMember } from "./types";

interface HostPaymentMonitorCardProps {
  room: RoomDetail;
  onVerifyPayment: (memberId: string) => Promise<void>;
  onRejectPayment: (memberId: string, reason: string) => Promise<void>;
  onUnlockRoom: () => Promise<void>;
  onCloseRoom: () => Promise<void>;
  unlocking: boolean;
  closing: boolean;
  unlockError?: string | null;
  closeError?: string | null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function HostPaymentMonitorCard({
  room,
  onVerifyPayment,
  onRejectPayment,
  onUnlockRoom,
  onCloseRoom,
  unlocking,
  closing,
  unlockError,
  closeError,
}: HostPaymentMonitorCardProps) {
  const members = room.members ?? [];
  const host = members.find((m) => m.is_host);
  const friends = members.filter((m) => !m.is_host);

  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [rejectingMember, setRejectingMember] = useState<RoomMember | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showHostFoodBreakdown, setShowHostFoodBreakdown] = useState(false);

  const hostShare = host?.share_amount ?? 0;
  const friendsTarget = Math.max(0, room.grand_total - hostShare);

  const verifiedFromFriends = friends
    .filter((m) => m.payment_status === "VERIFIED")
    .reduce((sum, m) => sum + m.share_amount, 0);

  const verifiedFriendsCount = friends.filter((m) => m.payment_status === "VERIFIED").length;
  const progressPercent =
    friendsTarget > 0
      ? Math.min(100, Math.round((verifiedFromFriends / friendsTarget) * 100))
      : 100;

  const pendingVerificationCount = friends.filter((m) => m.payment_status === "PENDING").length;

  const subtotal = room.subtotal > 0 ? room.subtotal : 1;
  const hostRatio = (host?.subtotal_share ?? 0) / subtotal;
  const hostTax = Math.round((room.tax_amount ?? 0) * hostRatio);
  const hostService = Math.round((room.service_amount ?? 0) * hostRatio);
  const hostDiscount = Math.round((room.discount_amount ?? 0) * hostRatio);

  async function handleVerify(memberId: string) {
    setProcessingId(memberId);
    setActionError(null);
    try {
      await onVerifyPayment(memberId);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Gagal memverifikasi pembayaran.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleConfirmReject() {
    if (!rejectingMember) return;
    setProcessingId(rejectingMember.id);
    setActionError(null);
    try {
      await onRejectPayment(
        rejectingMember.id,
        rejectReason.trim() || "Nominal atau bukti transfer tidak sesuai.",
      );
      setRejectingMember(null);
      setRejectReason("");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Gagal menolak pembayaran.");
    } finally {
      setProcessingId(null);
    }
  }

  function handleWhatsAppNudge(member: RoomMember) {
    const text = `Halo ${member.display_name}, tagihan patungan kamu di meja "${room.title}" adalah ${safeIDR(member.share_amount)}. Silakan transfer ke rekening host: ${room.bank_name ?? "Bank"} ${room.bank_account_no ?? ""} a.n. ${room.bank_account_name ?? "Host"}. Cek detail meja: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. NATIVE FINTECH HERO: RINGKASAN TALANGAN KASIR */}
      <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Ditalangi Host ke Kasir
            </span>
            <p className="font-mono text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
              {safeIDR(room.grand_total)}
            </p>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle size={14} weight="fill" className="text-emerald-600" />
            Talangan Beres
          </span>
        </div>

        {/* 2-Column Split: Porsi Makan Host vs Target Ditagih ke Teman */}
        <div className="grid grid-cols-2 gap-3 pt-3">
          <div className="flex flex-col rounded-xl bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Porsi Makan Kamu
            </span>
            <span className="font-mono text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
              {safeIDR(hostShare)}
            </span>
            <span className="text-[11px] text-slate-400">
              {host?.claimed_item_ids?.length ?? 0} porsi diklaim
            </span>
          </div>

          <div className="flex flex-col rounded-xl bg-blue-50/60 p-3 border border-blue-100/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
              Target dari Teman
            </span>
            <span className="font-mono text-sm sm:text-base font-extrabold text-blue-900 mt-0.5">
              {safeIDR(friendsTarget)}
            </span>
            <span className="text-[11px] text-blue-700/80">
              {friends.length} orang teman
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-500">
              Terkumpul: <strong className="font-bold text-slate-900">{safeIDR(verifiedFromFriends)}</strong>
            </span>
            <span className="font-mono font-bold text-emerald-600">
              {progressPercent}% Lunas ({verifiedFriendsCount}/{friends.length})
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* 2. NATIVE INSET GROUPED LIST: DAFTAR TEMAN & STATUS PEMBAYARAN */}
      <section className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-2xs">
        <div className="flex items-center justify-between bg-slate-50/80 px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Daftar Teman Meja ({friends.length})
            </span>
            {pendingVerificationCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                {pendingVerificationCount} butuh cek
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400">
            {verifiedFriendsCount}/{friends.length} Lunas
          </span>
        </div>

        {actionError && (
          <div className="bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 border-b border-rose-100">
            {actionError}
          </div>
        )}

        {friends.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Belum ada teman yang bergabung ke meja ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {friends.map((friend) => {
              const isProcessing = processingId === friend.id;
              const status = friend.payment_status ?? "UNPAID";
              const initials = getInitials(friend.display_name);

              return (
                <div
                  key={friend.id}
                  className="flex flex-col gap-2.5 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-slate-50/60"
                >
                  {/* Left: Avatar & Friend Info */}
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-xs text-blue-700">
                      {initials}
                    </span>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900">
                          {friend.display_name}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-semibold text-slate-500">
                          {friend.claimed_item_ids?.length ?? 0} porsi
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {safeIDR(friend.share_amount)}
                        </span>
                        <span className="text-slate-300">·</span>

                        {status === "VERIFIED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle size={13} weight="fill" />
                            Lunas
                          </span>
                        )}
                        {status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                            <Clock size={13} weight="bold" />
                            Menunggu Konfirmasi
                          </span>
                        )}
                        {status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                            <WarningCircle size={13} weight="bold" />
                            Ditolak
                          </span>
                        )}
                        {status === "UNPAID" && (
                          <span className="text-[11px] font-medium text-slate-400">
                            Belum Bayar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {friend.proof_image_url && (
                      <button
                        type="button"
                        onClick={() => setSelectedProofUrl(friend.proof_image_url!)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95"
                      >
                        <Eye size={13} weight="bold" />
                        <span>Lihat Bukti</span>
                      </button>
                    )}

                    {status !== "VERIFIED" && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleVerify(friend.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                      >
                        <Check size={13} weight="bold" />
                        <span>{isProcessing ? "Menyimpan..." : "Verifikasi"}</span>
                      </button>
                    )}

                    {status === "PENDING" && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => setRejectingMember(friend)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 active:scale-95 disabled:opacity-50"
                      >
                        <XCircle size={13} weight="bold" />
                        <span>Tolak</span>
                      </button>
                    )}

                    {status !== "VERIFIED" && (
                      <button
                        type="button"
                        onClick={() => handleWhatsAppNudge(friend)}
                        title="Ingatkan tagihan via WhatsApp"
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95"
                      >
                        <WhatsappLogo size={14} weight="fill" className="text-emerald-600" />
                        <span>Tagih WA</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. NATIVE EXPANDABLE DISCLOSURE: RINCIAN PORSI MAKAN HOST */}
      {host && (
        <section className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setShowHostFoodBreakdown(!showHostFoodBreakdown)}
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
          >
            <div>
              <span className="text-xs font-bold text-slate-800">
                Rincian Porsi Makanan Kamu ({host.claimed_item_ids?.length ?? 0} porsi)
              </span>
              <p className="text-[11px] text-slate-400">
                Porsi konsumsi pribadi Host di restoran
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900">
                {safeIDR(hostShare)}
              </span>
              {showHostFoodBreakdown ? (
                <CaretUp size={14} weight="bold" className="text-slate-400" />
              ) : (
                <CaretDown size={14} weight="bold" className="text-slate-400" />
              )}
            </div>
          </button>

          {showHostFoodBreakdown && (
            <div className="border-t border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-600 flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span>Subtotal menu makanan host</span>
                <span className="font-mono font-semibold text-slate-900">
                  {safeIDR(host.subtotal_share)}
                </span>
              </div>
              {(room.tax_amount ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span>Porsi pajak restoran (PB1)</span>
                  <span className="font-mono font-semibold text-slate-900">{safeIDR(hostTax)}</span>
                </div>
              )}
              {(room.service_amount ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span>Porsi service charge</span>
                  <span className="font-mono font-semibold text-slate-900">{safeIDR(hostService)}</span>
                </div>
              )}
              {(room.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-blue-600 font-semibold">
                  <span>Potongan diskon</span>
                  <span className="font-mono">-{safeIDR(hostDiscount)}</span>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 4. HOST ROOM ACTIONS */}
      {room.status === "LOCKED" && (
        <div className="flex flex-col gap-2 pt-1">
          {unlockError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
              <WarningCircle size={16} weight="bold" className="shrink-0 text-rose-500" />
              <span>{unlockError}</span>
            </div>
          )}

          {closeError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
              <WarningCircle size={16} weight="bold" className="shrink-0 text-rose-500" />
              <span>{closeError}</span>
            </div>
          )}

          <button
            type="button"
            disabled={closing}
            onClick={onCloseRoom}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-xs font-bold text-white shadow-xs hover:bg-black active:scale-98 transition-all disabled:opacity-50"
          >
            <CheckCircle size={16} weight="fill" />
            <span>{closing ? "Menutup Meja..." : "Tutup Meja (Selesai Patungan)"}</span>
          </button>

          <button
            type="button"
            disabled={unlocking}
            onClick={onUnlockRoom}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all disabled:opacity-50"
          >
            <LockKeyOpen size={15} weight="bold" />
            <span>{unlocking ? "Membuka..." : "Buka Kembali Tagihan (Edit Menu)"}</span>
          </button>
        </div>
      )}

      {/* Modal View Proof */}
      {selectedProofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedProofUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-sm w-full overflow-hidden rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Foto Bukti Transfer</span>
              <button
                type="button"
                onClick={() => setSelectedProofUrl(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <img
              src={selectedProofUrl}
              alt="Bukti Transfer"
              className="max-h-[75vh] w-auto mx-auto rounded-xl object-contain border border-slate-100"
            />
          </div>
        </div>
      )}

      {/* Modal Reject Proof */}
      {rejectingMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setRejectingMember(null)}
        >
          <div
            className="relative flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">
                Tolak Bukti: {rejectingMember.display_name}
              </span>
              <button
                type="button"
                onClick={() => setRejectingMember(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Alasan Penolakan</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Nominal kurang atau bukti buram"
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectingMember(null)}
                className="flex h-9 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex h-9 flex-1 items-center justify-center rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
              >
                Tolak Bukti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
