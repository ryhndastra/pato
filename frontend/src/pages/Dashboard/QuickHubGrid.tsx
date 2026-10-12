import {
  ForkKnife,
  Coffee,
  Cake,
  Compass,
  Calculator,
  WhatsappLogo,
  HandHeart,
  Ticket,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router";

interface QuickHubGridProps {
  onOpenNudge: () => void;
  onToggleJoin: () => void;
}

export function QuickHubGrid({
  onOpenNudge,
  onToggleJoin,
}: QuickHubGridProps) {
  const navigate = useNavigate();

  const items = [
    // Event presets
    {
      key: "lunch",
      label: "Makan Siang",
      icon: ForkKnife,
      color: "text-blue-600",
      bg: "bg-blue-50/80",
      onClick: () => navigate("/create?event=Makan+Siang+Kantor"),
    },
    {
      key: "cafe",
      label: "Kafe & Kopi",
      icon: Coffee,
      color: "text-amber-700",
      bg: "bg-amber-50/80",
      onClick: () => navigate("/create?event=Ngopi+Bareng+di+Kafe"),
    },
    {
      key: "birthday",
      label: "Traktir Ultah",
      icon: Cake,
      color: "text-purple-600",
      bg: "bg-purple-50/80",
      onClick: () => navigate("/create?event=Traktir+Ultah"),
    },
    {
      key: "trip",
      label: "Liburan",
      icon: Compass,
      color: "text-emerald-700",
      bg: "bg-emerald-50/80",
      onClick: () => navigate("/create?event=Patungan+Liburan"),
    },
    // Tools and actions
    {
      key: "nudge",
      label: "Auto Nudge",
      icon: WhatsappLogo,
      color: "text-emerald-600",
      bg: "bg-emerald-50/80",
      onClick: onOpenNudge,
    },
    {
      key: "calc",
      label: "Kalkulator",
      icon: Calculator,
      color: "text-indigo-600",
      bg: "bg-indigo-50/80",
      onClick: () => navigate("/create"),
    },
    {
      key: "social",
      label: "Donasi 20%",
      icon: HandHeart,
      color: "text-rose-600",
      bg: "bg-rose-50/80",
      onClick: () => window.open("https://pato.app/donasi", "_blank", "noopener,noreferrer"),
    },
    {
      key: "code",
      label: "Gabung Kode",
      icon: Ticket,
      color: "text-slate-700",
      bg: "bg-slate-100/90",
      onClick: onToggleJoin,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3.5">
      {items.map((item) => {
        const ItemIcon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="group flex flex-col items-center justify-start rounded-2xl border border-slate-100 bg-white p-2.5 text-center shadow-xs transition-all hover:border-blue-200 hover:shadow-sm active:scale-[0.96] sm:p-4"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 sm:h-12 sm:w-12 sm:rounded-2xl ${item.bg} ${item.color}`}
            >
              <ItemIcon size={22} weight="bold" />
            </span>
            <span className="mt-1.5 text-[10.5px] font-bold tracking-tight text-ink sm:text-xs whitespace-nowrap truncate max-w-full">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
