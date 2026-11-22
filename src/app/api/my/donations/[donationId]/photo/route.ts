
import { NextResponse } from 'next/server';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { DONATION_PHOTO_DIR, DONATION_PHOTO_URL_PREFIX, isStoredPhotoUrl } from '@/lib/uploads';

export const runtime = 'nodejs';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


type RouteContext = { params: Promise<{ donationId: string }> };

async function handlePhotoUpload(request: Request, context: RouteContext) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const { donationId } = await context.params;
  if (!UUID_PATTERN.test(donationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const donation = await prisma.donation.findFirst({
      where: {
        id: donationId,
        restaurant: { ownerUserId: user.id },
      },
    });

    if (!donation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (donation.status !== 'draft') {
      return NextResponse.json(
        { error: 'Photos can only be attached to a draft donation' },
        { status: 409 },
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Expected a multipart/form-data body with a file field' },
        { status: 400 },
      );
    }

    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const extension = IMAGE_EXTENSIONS[file.type];
    if (!extension) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WEBP or GIF images are accepted' },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'The file is empty' }, { status: 400 });
    }

    if (file.size > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { error: 'The photo must be 5 MB or smaller' },
        { status: 413 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    await mkdir(DONATION_PHOTO_DIR, { recursive: true });

    const fileName = `${donation.id}-${randomUUID()}.${extension}`;
    await writeFile(path.join(DONATION_PHOTO_DIR, fileName), bytes);

    const photoUrl = `${DONATION_PHOTO_URL_PREFIX}${fileName}`;

    const updated = await prisma.donation.update({
      where: { id: donation.id },
      data: { photoUrl },
    });

    return NextResponse.json({ donation: updated });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handlePhotoRemoval(request: Request, context: RouteContext) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const { donationId } = await context.params;
  if (!UUID_PATTERN.test(donationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const donation = await prisma.donation.findFirst({
      where: {
        id: donationId,
        restaurant: { ownerUserId: user.id },
      },
    });

    if (!donation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (donation.status !== 'draft') {
      return NextResponse.json(
        { error: 'Photos can only be removed from a draft donation' },
        { status: 409 },
      );
    }

    const previousUrl = donation.photoUrl;

    const updated = await prisma.donation.update({
      where: { id: donation.id },
      data: { photoUrl: null },
    });

    if (isStoredPhotoUrl(previousUrl)) {
      const fileName = path.basename(previousUrl);
      try {
        await unlink(path.join(DONATION_PHOTO_DIR, fileName));      } catch (e) {
        const code = (e as NodeJS.ErrnoException).code;
        if (code !== 'ENOENT') {
          console.error('Failed to delete donation photo file', e);
        }
      }
    }

    return NextResponse.json({ donation: updated });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  return handlePhotoUpload(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return handlePhotoUpload(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handlePhotoRemoval(request, context);
}