import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { DONATION_PHOTO_DIR } from '@/lib/uploads';

export const runtime = 'nodejs';

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

// <donation uuid>-<uuid>.<ext>; the strict pattern also rules out path traversal.
const FILE_PATTERN = /^[0-9a-f-]{36}-[0-9a-f-]{36}\.(jpg|png|webp|gif)$/i;

export async function GET(_request: Request, context: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await context.params;
  const match = FILE_PATTERN.exec(fileName);
  if (!match) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const bytes = await readFile(path.join(DONATION_PHOTO_DIR, fileName));
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': CONTENT_TYPES[match[1].toLowerCase()],
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
