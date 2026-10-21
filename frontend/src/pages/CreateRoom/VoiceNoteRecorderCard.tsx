import { useState, useRef } from "react";
import {
  CheckCircle,
  CircleNotch,
  Microphone,
  Stop,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { apiPost } from "../../lib/api";

interface VoiceResult {
  title?: string;
  items: Array<{ name: string; unitPrice: number; quantity: number }>;
  taxAmount?: number;
  serviceAmount?: number;
}

interface VoiceNoteRecorderCardProps {
  onExtracted: (result: VoiceResult) => void;
}

export function VoiceNoteRecorderCard({ onExtracted }: VoiceNoteRecorderCardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceSuccess, setVoiceSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function startRecording() {
    setError(null);
    setVoiceSuccess(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser kamu tidak mendukung perekaman audio langsung. Silakan gunakan opsi upload file audio atau ketik manual.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudioBlob(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("[Voice Record Error]", err);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengakses mikrofon. Izinkan akses mikrofon di browser kamu.",
      );
    }
  }

  function stopRecording() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  async function processAudioBlob(blob: Blob) {
    setIsProcessing(true);
    setError(null);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("Gagal membaca rekaman audio."));
        };
        reader.onerror = () => reject(new Error("Gagal membaca file audio."));
        reader.readAsDataURL(blob);
      });

      const extracted = await apiPost<VoiceResult>("/api/rooms/voice", {
        audio: base64Data,
      });

      if (!extracted || !Array.isArray(extracted.items) || extracted.items.length === 0) {
        throw new Error("AI tidak mendeteksi daftar makanan/minuman dari suara tersebut. Coba sebutkan menu dan harga lebih jelas.");
      }

      onExtracted(extracted);
      setVoiceSuccess(true);
    } catch (err) {
      console.error("[Voice AI Process Error]", err);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memproses rekaman suara. Coba ulangi rekaman atau input manual.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processAudioBlob(file);
    }
  }

  function formatTimer(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <section className="rounded-3xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/50 to-white p-5 shadow-xs sm:p-6">
      <div className="flex items-center justify-between border-b border-indigo-100/70 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-2xs">
            <Microphone size={18} weight="bold" />
          </span>
          <div>
            <h2 className="text-sm font-black text-slate-900 sm:text-base">
              Voice Note AI (Rekam Suara Menu)
            </h2>
            <p className="text-[11px] text-slate-500">
              Sebutkan pesanan secara santai, AI otomatis mendeteksi nama makanan & kuantitas
            </p>
          </div>
        </div>

        {voiceSuccess && (
          <button
            type="button"
            onClick={() => setVoiceSuccess(false)}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700"
          >
            <Trash size={13} weight="bold" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-100">
          {error}
        </div>
      )}

      {voiceSuccess && (
        <div className="mt-3.5 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 border border-emerald-200">
          <CheckCircle size={18} weight="fill" className="shrink-0 text-emerald-600" />
          <span>
            Berhasil mendengarkan pesanan! Daftar menu otomatis terisi di bawah. Kamu bisa sesuaikan harga jika diperlukan.
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-indigo-200 bg-white p-6 text-center">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <CircleNotch size={36} weight="bold" className="animate-spin text-indigo-600" />
            <div>
              <p className="text-xs font-black text-slate-900">
                Gemini AI sedang mendengarkan & mengekstrak menu...
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mendeteksi nama makanan, minuman, dan jumlah porsi
              </p>
            </div>
          </div>
        ) : isRecording ? (
          <div className="flex flex-col items-center justify-center gap-3 py-2">
            {/* Pulsating record indicator */}
            <div className="relative flex h-16 w-16 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <button
                type="button"
                onClick={stopRecording}
                className="relative flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg active:scale-95 transition-transform"
                title="Klik untuk selesai merekam"
              >
                <Stop size={28} weight="fill" />
              </button>
            </div>

            <div className="text-center">
              <span className="font-mono text-lg font-black text-rose-600">
                {formatTimer(recordingSeconds)}
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                Sedang mendengarkan... Klik tombol merah bila sudah selesai
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                Contoh: "Dua es teh manis sepuluh ribu, satu ayam bakar tiga puluh ribu"
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-1">
            <button
              type="button"
              onClick={startRecording}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
              title="Mulai Rekam Suara"
            >
              <Microphone size={28} weight="bold" />
            </button>

            <div>
              <p className="text-xs font-bold text-slate-900">
                Tekan Mikrofon & Sebutkan Pesanan Meja
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
                Bisa sambil santai membacakan struk atau pesanan teman tanpa harus mengetik satu-satu.
              </p>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={startRecording}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <Microphone size={14} weight="bold" />
                <span>Mulai Rekam</span>
              </button>

              <span className="text-slate-300 text-xs">•</span>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:underline"
              >
                <UploadSimple size={13} weight="bold" />
                <span>Upload Audio</span>
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>
    </section>
  );
}
