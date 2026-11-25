import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';

const TMP_DIR = path.resolve(process.cwd(), '.tmp_uploads');
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

export const ALLOWED_DOCUMENT_MIMES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'message/rfc822',
]);

export const ALLOWED_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function validateMagicBytes(buffer: Buffer, claimedMime: string): boolean {
  if (buffer.length < 4) return false;
  if (claimedMime === 'application/pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  if (claimedMime === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (claimedMime === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (claimedMime === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  if (claimedMime === 'text/plain' || claimedMime === 'message/rfc822') {
    // Reject binary null-byte payloads masquerading as text
    return !buffer.subarray(0, 512).includes(0x00);
  }
  return false;
}

export async function extractPdfTextSafely(buffer: Buffer): Promise<{
  ok: boolean;
  text: string;
  pageCount?: number;
  error?: string;
}> {
  if (!validateMagicBytes(buffer, 'application/pdf')) {
    return { ok: false, text: '', error: 'Invalid PDF file signature.' };
  }

  // Write to confined temp directory and clean up unconditionally
  const safeName = `${crypto.randomUUID()}.pdf`;
  const tempPath = path.resolve(TMP_DIR, safeName);
  if (!tempPath.startsWith(TMP_DIR + path.sep)) {
    return { ok: false, text: '', error: 'Invalid upload path.' };
  }

  let parser: PDFParse | null = null;
  try {
    fs.writeFileSync(tempPath, buffer);
    parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    const cleaned = (data.text || '').replace(/\s+\n/g, '\n').trim();
    if (!cleaned || cleaned.length < 20) {
      return {
        ok: false,
        text: cleaned,
        pageCount: data.total,
        error: 'No readable text layer found in PDF (it may be a scanned image PDF).',
      };
    }
    return { ok: true, text: cleaned.slice(0, 25000), pageCount: data.total };
  } catch (err) {
    return {
      ok: false,
      text: '',
      error: err instanceof Error ? err.message : 'PDF extraction failed.',
    };
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {});
    }
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}
