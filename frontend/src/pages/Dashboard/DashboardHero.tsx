import {
  CheckCircle,
  Plus,
  ShareNetwork,
  Ticket,
  WhatsappLogo,
} from "@phosphor-icons/react";

interface DashboardHeroProps {
  name: string;
  avatarUrl?: string | null;
  onCreateRoom: () => void;
  onToggleJoin: () => void;
  joinActive: boolean;
  onOpenNudge: () => void;
  onShare: () => void;
  shared: boolean;
  onProfile: () => void;
}

export function DashboardHero({
  name,
  avatarUrl,
  onCreateRoom,
  onToggleJoin,
  joinActive,
  onOpenNudge,
  onShare,
  shared,
  onProfile,
}: DashboardHeroProps) {
  const actions = [
    {
      key: "create",
      icon: Plus,
      label: "Buat Room",
      color: "bg-blue-100/80 text-blue-600",
      onClick: onCreateRoom,
    },
    {
      key: "join",
      icon: Ticket,
      label: "Gabung",
      color: joinActive ? "bg-blue-600 text-white" : "bg-purple-100/80 text-purple-600",
      active: joinActive,
      onClick: onToggleJoin,
    },
    {
      key: "nudge",
      icon: WhatsappLogo,
      label: "Nudge WA",
      color: "bg-emerald-100/80 text-emerald-600",
      onClick: onOpenNudge,
    },
    {
      key: "share",
      icon: shared ? CheckCircle : ShareNetwork,
      label: shared ? "Tersalin" : "Bagikan",
      color: shared ? "bg-emerald-100 text-emerald-600" : "bg-amber-100/80 text-amber-600",
      onClick: onShare,
    },
  ];

  return (
    <div className="relative w-full">
      {/* Curved gradient header */}
      <div className="relative overflow-hidden rounded-b-[44px] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 px-5 pt-12 pb-24 sm:rounded-b-[56px] sm:px-8 sm:pt-16 sm:pb-32 lg:rounded-b-[68px] lg:px-12 lg:pt-20 lg:pb-38">
        {/* Ambient glow orbs */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 mx-auto flex w-full max-w-[1120px] items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/80 sm:text-sm lg:text-base">Halo,</p>
            <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-white capitalize sm:text-3xl lg:text-4xl">
              {name}
            </h1>
          </div>

          {/* Profile avatar */}
          <button
            type="button"
            onClick={onProfile}
            aria-label="Buka profil akun"
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-[2.5px] border-white/80 bg-white/20 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </button>
        </div>
      </div>

      {/* Floating action card */}
      <div className="relative z-10 mx-auto -mt-12 w-full max-w-[1120px] px-4 sm:-mt-16 sm:px-6 lg:-mt-20 lg:px-8">
        <div className="rounded-3xl border border-slate-100 bg-white p-3 shadow-[0_16px_40px_rgba(37,99,235,0.09)] sm:p-5">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
            {actions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={action.onClick}
                  className="group flex flex-col items-center justify-start rounded-2xl py-2 px-1 text-center transition-all active:scale-[0.96] sm:py-3 sm:px-2 hover:bg-slate-50"
                >
                  {/* Action icon */}
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 sm:h-14 sm:w-14 sm:rounded-[20px] ${action.color}`}
                  >
                    <ActionIcon size={22} weight="bold" className="sm:scale-110" />
                  </span>

                  {/* Action label */}
                  <span className="mt-2 text-center text-[10.5px] font-bold tracking-tight text-ink sm:text-xs whitespace-nowrap">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
