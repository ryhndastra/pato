import {
  Car,
  Coffee,
  FilmSlate,
  ForkKnife,
  Gift,
  IdentificationCard,
  ShoppingBag,
  Tag,
} from "@phosphor-icons/react";

interface RoomDetailsCardProps {
  title: string;
  setTitle: (value: string) => void;
  hostName: string;
  setHostName: (value: string) => void;
}

const EVENT_PRESETS = [
  { label: "Makan Bareng", icon: ForkKnife },
  { label: "Nongkrong Cafe", icon: Coffee },
  { label: "Nonton Bioskop", icon: FilmSlate },
  { label: "Liburan Bareng", icon: Car },
  { label: "Kado Patungan", icon: Gift },
  { label: "Belanja Bersama", icon: ShoppingBag },
];

export function RoomDetailsCard({
  title,
  setTitle,
  hostName,
  setHostName,
}: RoomDetailsCardProps) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_12px_32px_rgba(37,99,235,0.06)] sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 aspect-square items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Tag size={22} weight="bold" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Detail Acara & Host
          </h2>
          <p className="text-xs text-slate-500">
            Tentukan nama acara dan nama kamu sebagai penanggung jawab
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Title Input */}
        <div>
          <label htmlFor="title" className="mb-1.5 block text-xs font-bold text-slate-700">
            Nama Acara / Resto
          </label>
          <input
            id="title"
            type="text"
            required
            placeholder="Contoh: Makan Siang di Sushi Tei Senopati"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] focus:outline-none"
          />

          {/* Quick Preset Buttons (Horizontal swipe on mobile, wrap on desktop) */}
          <div className="mt-3.5">
            <span className="mb-2 block text-xs font-semibold text-slate-500">
              Pilihan Cepat Acara
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 sm:flex-wrap no-scrollbar">
              {EVENT_PRESETS.map((preset) => {
                const PresetIcon = preset.icon;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setTitle(preset.label)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95"
                  >
                    <PresetIcon size={15} weight="bold" className="shrink-0 text-blue-600" />
                    <span className="whitespace-nowrap">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Host Name Input */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="host-name" className="text-xs font-bold text-slate-700">
              Nama Kamu (Host)
            </label>
            <span className="text-xs text-slate-400">Nama yang muncul di room</span>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <IdentificationCard size={18} weight="bold" />
            </div>
            <input
              id="host-name"
              type="text"
              required
              placeholder="Contoh: Fakhri"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pr-4 pl-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
