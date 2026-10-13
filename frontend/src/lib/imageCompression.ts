/**
 * Client-side image compression for receipt and QRIS uploads.
 * Resizes large phone camera photos while preserving sharp QR code contrast.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar (JPG, PNG, atau WEBP)");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Gagal membaca file gambar"));

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Format gambar tidak didukung"));

      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback to original data URL if 2D context fails
          resolve(event.target?.result as string);
          return;
        }

        // Fill white background in case of transparent PNGs
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const webpUrl = canvas.toDataURL("image/webp", quality);
          if (webpUrl.startsWith("data:image/webp")) {
            resolve(webpUrl);
            return;
          }
        } catch {
          // WebP not supported, fallback to JPEG
        }

        const jpegUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(jpegUrl);
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

