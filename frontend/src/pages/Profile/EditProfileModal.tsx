import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Camera,
  CircleNotch,
  Key,
  LockSimple,
  PencilSimple,
  Trash,
  User,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "../../auth/useAuth";
import { compressImageFile } from "../../lib/imageCompression";
import { ApiError } from "../../lib/api";

import mascotHelper from "../../assets/pato_mascot_helper.jpg";
import mascotCelebrating from "../../assets/pato_mascot_celebrating.jpg";
import mascotWallet from "../../assets/pato_mascot_wallet.jpg";
import patoPlain from "../../assets/pato.png";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AVATAR_PRESETS = [
  { id: "mascot-wallet", label: "Pato Semangat", src: mascotWallet },
  { id: "mascot-helper", label: "Pato Pintar", src: mascotHelper },
  { id: "mascot-celebrating", label: "Pato Selebrasi", src: mascotCelebrating },
  { id: "pato-plain", label: "Logo Pato", src: patoPlain },
];

export function EditProfileModal({ isOpen, onClose, onSuccess }: EditProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password fields
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(user?.name ?? "");
      setAvatarUrl(user?.avatarUrl ?? null);
      setError(null);
      setShowPasswordChange(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, user]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving && !compressing) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, saving, compressing, onClose]);

  if (!isOpen) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setCompressing(true);
    try {
      // Compress to 320x320 max for light footprint avatar
      const compressed = await compressImageFile(file, 320, 320, 0.85);
      setAvatarUrl(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses gambar foto profil.");
    } finally {
      setCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving || compressing) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nama profil tidak boleh kosong.");
      return;
    }

    if (showPasswordChange) {
      if (user?.hasPassword && !currentPassword) {
        setError("Masukkan kata sandi lama kamu.");
        return;
      }
      if (!newPassword || newPassword.length < 8) {
        setError("Kata sandi baru minimal 8 karakter.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Konfirmasi kata sandi baru tidak cocok.");
        return;
      }
    }

    setError(null);
    setSaving(true);
    try {
      await updateProfile({
        name: trimmedName,
        avatarUrl,
        currentPassword: showPasswordChange ? currentPassword : undefined,
        newPassword: showPasswordChange ? newPassword : undefined,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Gagal menyimpan perubahan profil. Coba lagi.");
      }
    } finally {
      setSaving(false);
    }
  }

  const initial = (name.trim() || user?.name || "U").charAt(0).toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => {
          if (!saving && !compressing) onClose();
        }}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-[32px] sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl ring-1 ring-slate-900/10 animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <PencilSimple size={16} weight="bold" />
            </span>
            <h2 id="edit-profile-title" className="text-base font-black text-slate-900">
              Ubah Profil Akun
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving || compressing}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95 disabled:opacity-50"
            aria-label="Tutup"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <WarningCircle size={16} weight="fill" className="shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
          {/* 1. Avatar Uploader & Presets */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-3 border-blue-600 bg-gradient-to-br from-blue-600 to-indigo-700 text-2xl font-black text-white shadow-md">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className={`h-full w-full ${
                      AVATAR_PRESETS.some((p) => p.src === avatarUrl)
                        ? "object-contain bg-white p-1"
                        : "object-cover"
                    }`}
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>

              {/* Camera overlay button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing || saving}
                title="Ganti foto dari galeri"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md ring-2 ring-white hover:bg-blue-700 active:scale-90 transition-all disabled:opacity-50"
              >
                {compressing ? (
                  <CircleNotch size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} weight="bold" />
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Avatar buttons */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing || saving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
              >
                <Camera size={13} weight="bold" />
                <span>{avatarUrl ? "Ganti Foto" : "Unggah Foto"}</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  disabled={saving || compressing}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 active:scale-95 transition-all"
                >
                  <Trash size={13} weight="bold" />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            {/* Avatar Presets */}
            <div className="mt-3 flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">
                Atau pilih avatar karakter:
              </span>
              <div className="flex items-center gap-2.5">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAvatarUrl(preset.src)}
                    className={`h-9 w-9 overflow-hidden rounded-full border-2 transition-all active:scale-95 ${
                      avatarUrl === preset.src
                        ? "border-blue-600 ring-2 ring-blue-300 scale-105"
                        : "border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-400"
                    }`}
                    title={preset.label}
                  >
                    <img src={preset.src} alt={preset.label} className="h-full w-full object-contain bg-white p-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Nama Lengkap Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-name" className="text-xs font-bold text-slate-700">
              Nama Lengkap / Panggilan
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <User size={16} weight="bold" />
              </span>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Reyhand Astra"
                maxLength={100}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Nama ini akan tampil untuk teman-temanmu di meja patungan.
            </p>
          </div>

          {/* 3. Email (Read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Email Akun</label>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-100/70 px-3.5 py-2.5 text-xs text-slate-500">
              <span className="font-medium truncate">{user?.email}</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 shrink-0">
                <LockSimple size={12} weight="bold" />
                <span>Tetap</span>
              </span>
            </div>
          </div>

          {/* 4. Password Change Accordion */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
            <button
              type="button"
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="flex w-full items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-blue-600"
            >
              <span className="flex items-center gap-1.5">
                <Key size={14} weight="bold" className="text-slate-500" />
                <span>Ingin ubah kata sandi?</span>
              </span>
              <span className="text-blue-600 text-[11px] font-bold">
                {showPasswordChange ? "Tutup" : "Ubah"}
              </span>
            </button>

            {showPasswordChange && (
              <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-3">
                {user?.hasPassword && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Kata Sandi Lama</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-600">Kata Sandi Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    minLength={8}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    minLength={8}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-1 flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || compressing}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || compressing}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <CircleNotch size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

