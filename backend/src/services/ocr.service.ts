import { env } from "../config.js";

export interface OcrExtractedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface OcrScanResult {
  title: string;
  items: OcrExtractedItem[];
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  discountAmount: number;
  grandTotal: number;
}

let keyRotationIndex = 0;

const OCR_PROMPT = `
Kamu adalah asisten keuangan ahli pembaca struk restoran kasir di Indonesia untuk aplikasi split bill "PaTo".
Tugasmu adalah membaca gambar struk kasir yang dilampirkan dan mengekstrak rincian item, kuantitas, harga, pajak, dan service secara sangat akurat.

Aturan Penting:
1. Normalisasi nama menu/singkatan khas resto Indonesia ke nama yang jelas & rapi (contoh: 'Slmn Roll' -> 'Salmon Roll', 'Ocha Dngn' -> 'Ocha Dingin', 'Aym Grg' -> 'Ayam Goreng', 'Es T.Mns' -> 'Es Teh Manis').
2. Pisahkan baris Pajak Resto (PB1 / PPN 10-11%) dan Service Charge (5-10%) dari daftar item makanan/minuman! Jangan masukkan pajak/service ke dalam daftar menu items.
3. Kuantitas (quantity) harus bilangan bulat positif (minimal 1). Jika di struk tertulis "2x 15.000", quantity = 2, unitPrice = 15000.
4. Jika struk menampilkan diskon kasir / voucher promo, masukkan ke field discountAmount.
5. Jika ada nama restoran di kepala struk, isi field 'title' dengan nama resto tersebut (misal: "Sushi Tei Senopati", "Kopi Kenangan", "RM Padang Sederhana"). Jika tidak jelas, gunakan "Resto Makan Bareng".
6. Output WAJIB berupa JSON valid murni yang mematuhi skema berikut:
{
  "title": string,
  "items": [
    {
      "name": string,
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number
    }
  ],
  "subtotal": number,
  "taxAmount": number,
  "serviceAmount": number,
  "discountAmount": number,
  "grandTotal": number
}
`;

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
];

export async function parseReceiptWithGemini(imageBase64OrDataUrl: string): Promise<OcrScanResult> {
  const keys = env.geminiApiKeys;
  if (!keys || keys.length === 0) {
    throw new Error("GEMINI_API_KEYS belum diatur di environment variable backend!");
  }

  // Parse mime type dan raw base64 data
  let mimeType = "image/jpeg";
  let rawBase64 = imageBase64OrDataUrl;

  if (imageBase64OrDataUrl.startsWith("data:")) {
    const match = imageBase64OrDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      rawBase64 = match[2];
    }
  }

  let lastError: Error | null = null;
  const totalKeys = keys.length;

  // Mencoba keys dengan rotasi round-robin dan failover otomatis
  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const currentKey = keys[keyRotationIndex % totalKeys];
    keyRotationIndex = (keyRotationIndex + 1) % totalKeys;

    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: OCR_PROMPT },
                  {
                    inlineData: {
                      mimeType: mimeType || "image/jpeg",
                      data: rawBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`[OCR Gemini] Model ${model} dengan key ${currentKey.slice(0, 10)}... mengembalikan status ${response.status}:`, errBody);
          // Jika 503 / 429, lanjut ke model/key berikutnya
          if (response.status === 429 || response.status === 503 || response.status === 404) {
            continue;
          }
          throw new Error(`Gagal menghubungi Gemini API: ${response.statusText}`);
        }

        const data = (await response.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string }>;
            };
          }>;
        };
        const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidate) {
          throw new Error("Tidak dapat mendeteksi teks dari foto struk.");
        }

        // Parse JSON dari response Gemini
        const parsed = JSON.parse(candidate);
        
        // Normalisasi dan validasi data numerik
        const items: OcrExtractedItem[] = Array.isArray(parsed.items)
          ? parsed.items.map((it: Record<string, unknown>) => {
              const qty = Math.max(1, Math.round(Number(it.quantity) || 1));
              const unitPrice = Math.max(0, Math.round(Number(it.unitPrice) || Number(it.price) || 0));
              const name = String(it.name || "Item Menu").trim();
              return {
                name,
                quantity: qty,
                unitPrice,
                totalPrice: unitPrice * qty,
              };
            }).filter((it: OcrExtractedItem) => it.name.length > 0 && it.unitPrice > 0)
          : [];

        const calculatedSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const subtotal = Math.max(0, Math.round(Number(parsed.subtotal) || calculatedSubtotal));
        const taxAmount = Math.max(0, Math.round(Number(parsed.taxAmount) || 0));
        const serviceAmount = Math.max(0, Math.round(Number(parsed.serviceAmount) || 0));
        const discountAmount = Math.max(0, Math.round(Number(parsed.discountAmount) || 0));
        const grandTotal = Math.max(
          0,
          Math.round(Number(parsed.grandTotal) || (subtotal + taxAmount + serviceAmount - discountAmount)),
        );

        return {
          title: String(parsed.title || "Resto Makan Bareng").trim(),
          items,
          subtotal,
          taxAmount,
          serviceAmount,
          discountAmount,
          grandTotal,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[OCR Gemini Attempt Fail] ${lastError.message}`);
      }
    }
  }

  throw lastError || new Error("Gagal membaca struk kasir, silakan coba lagi atau input manual.");
}

const VOICE_NOTE_PROMPT = `
Kamu adalah asisten keuangan ahli di Indonesia untuk aplikasi split bill "PaTo".
Tugasmu adalah mendengarkan rekaman audio pengguna yang sedang memesan atau membacakan menu makanan/minuman santai di restoran/kafe.
Ekstrak daftar item, kuantitas (quantity), dan harga satuan (unitPrice) jika disebutkan.
Jika harga tidak disebutkan dalam rekaman suara, isi unitPrice dengan 0 agar pengguna bisa melengkapinya nanti di form.

Aturan Penting:
1. Normalisasi nama menu ke ejaan yang wajar & jelas (contoh: 'es teh tawar dua' -> name: 'Es Teh Tawar', quantity: 2).
2. Jika pengguna menyebutkan harga (contoh: "ayam geprek level dua dua porsi satunya dua puluh lima ribu"), masukkan quantity = 2, unitPrice = 25000.
3. Kuantitas minimal 1.
4. Pisahkan pajak (PB1/PPN) atau diskon jika disebutkan pengguna.
5. Buat perkiraan nama restoran/judul acara jika terdengar (misal: "Makan Bareng"), atau default "Pesanan Suara".
6. Output WAJIB berupa JSON valid murni yang mematuhi skema berikut:
{
  "title": string,
  "items": [
    {
      "name": string,
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number
    }
  ],
  "subtotal": number,
  "taxAmount": number,
  "serviceAmount": number,
  "discountAmount": number,
  "grandTotal": number
}
`;

export async function parseVoiceNoteWithGemini(audioBase64OrDataUrl: string): Promise<OcrScanResult> {
  const keys = env.geminiApiKeys;
  if (!keys || keys.length === 0) {
    throw new Error("GEMINI_API_KEYS belum diatur di environment variable backend!");
  }

  let mimeType = "audio/webm";
  let rawBase64 = audioBase64OrDataUrl;

  if (audioBase64OrDataUrl.startsWith("data:")) {
    const match = audioBase64OrDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      rawBase64 = match[2];
    }
  }

  let lastError: Error | null = null;
  const totalKeys = keys.length;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const currentKey = keys[keyRotationIndex % totalKeys];
    keyRotationIndex = (keyRotationIndex + 1) % totalKeys;

    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: VOICE_NOTE_PROMPT },
                  {
                    inlineData: {
                      mimeType: mimeType || "audio/webm",
                      data: rawBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`[Voice Gemini] Model ${model} dengan key ${currentKey.slice(0, 10)}... mengembalikan status ${response.status}:`, errBody);
          if (response.status === 429 || response.status === 503 || response.status === 404) {
            continue;
          }
          throw new Error(`Gagal menghubungi Gemini API: ${response.statusText}`);
        }

        const data = (await response.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string }>;
            };
          }>;
        };
        const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidate) {
          throw new Error("Tidak dapat mengenali suara pesanan.");
        }

        const parsed = JSON.parse(candidate);
        const items: OcrExtractedItem[] = Array.isArray(parsed.items)
          ? parsed.items.map((it: Record<string, unknown>) => {
              const qty = Math.max(1, Math.round(Number(it.quantity) || 1));
              const unitPrice = Math.max(0, Math.round(Number(it.unitPrice) || Number(it.price) || 0));
              const name = String(it.name || "Item Menu").trim();
              return {
                name,
                quantity: qty,
                unitPrice,
                totalPrice: unitPrice * qty,
              };
            }).filter((it: OcrExtractedItem) => it.name.length > 0)
          : [];

        const calculatedSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const subtotal = Math.max(0, Math.round(Number(parsed.subtotal) || calculatedSubtotal));
        const taxAmount = Math.max(0, Math.round(Number(parsed.taxAmount) || 0));
        const serviceAmount = Math.max(0, Math.round(Number(parsed.serviceAmount) || 0));
        const discountAmount = Math.max(0, Math.round(Number(parsed.discountAmount) || 0));
        const grandTotal = Math.max(
          0,
          Math.round(Number(parsed.grandTotal) || (subtotal + taxAmount + serviceAmount - discountAmount)),
        );

        return {
          title: String(parsed.title || "Pesanan Suara").trim(),
          items,
          subtotal,
          taxAmount,
          serviceAmount,
          discountAmount,
          grandTotal,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[Voice Gemini Attempt Fail] ${lastError.message}`);
      }
    }
  }

  throw lastError || new Error("Gagal mengenali suara rekaman pesanan, silakan coba lagi.");
}

