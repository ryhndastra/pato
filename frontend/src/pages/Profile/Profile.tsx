import { SignOut } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/useAuth";

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-6 px-5 py-6 lg:px-0 lg:py-10">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-hairline px-6 py-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-tint text-2xl font-bold text-brand">
          {user?.name.charAt(0).toUpperCase() ?? "?"}
        </span>
        <div>
          <p className="text-[17px] font-bold text-ink">{user?.name}</p>
          <p className="text-sm text-ink-soft">{user?.email}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-shell text-[15px] font-bold text-danger active:bg-danger-bg"
      >
        <SignOut size={20} weight="regular" />
        Keluar
      </button>
    </div>
  );
}
