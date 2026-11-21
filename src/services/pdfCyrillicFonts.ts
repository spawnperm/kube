import type { jsPDF } from 'jspdf';

let cachedRegularB64: string | null = null;
let cachedBoldB64: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function loadFontBase64(fileName: string): Promise<string> {
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      const res = await fetch(`/fonts/${fileName}`);
      if (res.ok) {
        const ab = await res.arrayBuffer();
        return arrayBufferToBase64(ab);
      }
    } catch {
      // Relative fetch fails under Node/jsdom; fall back to local public/fonts
    }
  }

  try {
    const fsMod = 'node:fs/promises';
    const pathMod = 'node:path';
    const fs = await import(/* @vite-ignore */ fsMod);
    const path = await import(/* @vite-ignore */ pathMod);
    const fontPath = path.resolve(process.cwd(), 'public', 'fonts', fileName);
    const buf = await fs.readFile(fontPath);
    return buf.toString('base64');
  } catch (err) {
    throw new Error(
      `Не удалось загрузить шрифт /fonts/${fileName}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function registerCyrillicPdfFonts(doc: jsPDF): Promise<string> {
  if (!cachedRegularB64) {
    cachedRegularB64 = await loadFontBase64('DejaVuSans.ttf');
  }
  if (!cachedBoldB64) {
    cachedBoldB64 = await loadFontBase64('DejaVuSans-Bold.ttf');
  }

  doc.addFileToVFS('DejaVuSans.ttf', cachedRegularB64);
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', cachedBoldB64);
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');
  doc.setFont('DejaVuSans', 'normal');
  return 'DejaVuSans';
}
