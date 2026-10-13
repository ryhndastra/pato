import {
  House,
  Plus,
  UserCircle,
  CaretDown,
  SignOut,
} from "@phosphor-icons/react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import wordmark from "../assets/pato-withtext.png";
import { useAuth } from "../auth/useAuth";

const NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
    isActive ? "text-blue-600 font-bold" : "text-ink-muted hover:text-ink"
  }`;

const DESKTOP_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
    isActive
      ? "bg-blue-50 text-blue-600 shadow-xs ring-1 ring-blue-100"
      : "text-ink-soft hover:bg-slate-100/80 hover:text-ink"
  }`;

export function AuthedShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-slate-50/60">
      {/* Desktop floating navbar */}
      <header className="sticky top-3 z-30 mx-auto hidden w-full max-w-[1200px] px-4 sm:px-6 lg:block lg:px-8">
        <div className="flex items-center justify-between rounded-full border border-slate-200/80 bg-white/90 px-6 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          {/* Brand logo */}
          <div className="flex items-center gap-3">
            <NavLink to="/dashboard" className="flex items-center gap-2.5">
              <img src={wordmark} alt="PaTo" className="h-6 w-auto object-contain" />
            </NavLink>
          </div>

          {/* Navigation links */}
          <nav className="flex items-center gap-1.5 rounded-full bg-slate-100/80 p-1 ring-1 ring-black/5">
            <NavLink to="/dashboard" end className={DESKTOP_LINK_CLASS}>
              <House size={16} weight="bold" />
              <span>Beranda</span>
            </NavLink>
            <NavLink to="/create" className={DESKTOP_LINK_CLASS}>
              <Plus size={16} weight="bold" />
              <span>Buat Room</span>
            </NavLink>
            <NavLink to="/profile" className={DESKTOP_LINK_CLASS}>
              <UserCircle size={16} weight="bold" />
              <span>Profil</span>
            </NavLink>
          </nav>

          {/* Actions and user menu */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/create")}
              className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              <Plus size={14} weight="bold" />
              <span>Buat Meja</span>
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 py-1 pl-1 pr-2.5 text-xs font-semibold text-ink transition-colors hover:bg-slate-100"
              >
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-blue-600 font-bold text-white">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() ?? "U"
                  )}
                </span>
                <span className="max-w-[100px] truncate text-xs font-bold text-ink">
                  {user?.name ?? "Host"}
                </span>
                <CaretDown size={12} weight="bold" className="text-ink-muted" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/profile");
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-ink hover:bg-slate-50"
                    >
                      <UserCircle size={16} weight="bold" className="text-ink-muted" />
                      <span>Pengaturan Profil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <SignOut size={16} weight="bold" />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col pb-[76px] lg:pb-12">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed right-0 bottom-0 left-0 z-20 flex items-center justify-around border-t border-hairline bg-white/95 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] backdrop-blur-lg lg:hidden">
        <NavLink to="/dashboard" end className={NAV_LINK_CLASS}>
          <House size={22} weight="regular" />
          <span>Beranda</span>
        </NavLink>

        <NavLink
          to="/create"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-ink-muted"
        >
          <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_4px_16px_rgba(37,99,235,0.4)] transition-transform active:scale-95">
            <Plus size={22} weight="bold" />
          </span>
          <span>Buat Room</span>
        </NavLink>

        <NavLink to="/profile" className={NAV_LINK_CLASS}>
          <UserCircle size={22} weight="regular" />
          <span>Profil</span>
        </NavLink>
      </nav>
    </div>
  );
}
