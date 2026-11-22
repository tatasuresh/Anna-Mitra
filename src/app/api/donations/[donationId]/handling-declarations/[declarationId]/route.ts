import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

type Params = { params: Promise<{ donationId: string; declarationId: string }> };

const EDITABLE_FIELDS = [
  'preparationTimeMinutes',
  'preparedAt',
  'requiresRefrigeration',
  'allergens',
  'checklistConfirmed',
] as const;

async function resolveDonorDraft(userId: string, donationId: string) {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!me || me.role !== 'donor') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  // own_only: a donation outside the donor's restaurant is reported as not found
  const donation = await prisma.donation.findFirst({
    where: { id: donationId, restaurant: { ownerUserId: userId } },
    select: { id: true, status: true },
  });
  if (!donation) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  }

  if (donation.status !== 'draft') {
    return {
      error: NextResponse.json(
        { error: 'Handling declarations can only be changed before the donation is published' },
        { status: 409 },
      ),
    };
  }

  const declaration = await prisma.handlingDeclaration.findFirst({
    where: { id: undefined, donationId },
    select: { id: true },
  });
  return { donation, declaration };
}

export async function PATCH(request: Request, { params: paramsPromise }: Params) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const data: Prisma.HandlingDeclarationUncheckedUpdateInput = {};

  for (const key of Object.keys(input)) {
    if (!(EDITABLE_FIELDS as readonly string[]).includes(key)) {
      return NextResponse.json({ error: `Field not editable: ${key}` }, { status: 400 });
    }
  }

  if (input.preparationTimeMinutes !== undefined) {
    const minutes = input.preparationTimeMinutes;
    if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes <= 0) {
      return NextResponse.json(
        { error: 'Preparation time must be a positive whole number of minutes' },
        { status: 400 },
      );
    }
    data.preparationTimeMinutes = minutes;
  }

  if (input.preparedAt !== undefined) {
    if (typeof input.preparedAt !== 'string') {
      return NextResponse.json(
        { error: "Preparation time can't be in the future. Enter when the food was prepared." },
        { status: 400 },
      );
    }
    const preparedAt = new Date(input.preparedAt);
    if (Number.isNaN(preparedAt.getTime()) || preparedAt.getTime() > Date.now()) {
      return NextResponse.json(
        { error: "Preparation time can't be in the future. Enter when the food was prepared." },
        { status: 400 },
      );
    }
    data.preparedAt = preparedAt;
  }

  if (input.requiresRefrigeration !== undefined) {
    if (typeof input.requiresRefrigeration !== 'boolean') {
      return NextResponse.json({ error: 'requiresRefrigeration must be true or false' }, { status: 400 });
    }
    data.requiresRefrigeration = input.requiresRefrigeration;
  }

  if (input.allergens !== undefined) {
    if (typeof input.allergens !== 'string' || input.allergens.trim() === '') {
      return NextResponse.json(
        { error: "Select the allergens present, or choose 'None declared', before submitting." },
        { status: 400 },
      );
    }
    data.allergens = input.allergens.trim();
  }

  if (input.checklistConfirmed !== undefined) {
    if (input.checklistConfirmed !== true) {
      return NextResponse.json(
        { error: 'Confirm the checklist answers are accurate to continue.' },
        { status: 400 },
      );
    }
    data.checklistConfirmed = true;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
  }

  try {
    const ctx = await resolveDonorDraft(user.id, params.donationId);
    if ('error' in ctx) return ctx.error;

    const existing = await prisma.handlingDeclaration.findFirst({
      where: { id: params.declarationId, donationId: params.donationId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const handlingDeclaration = await prisma.handlingDeclaration.update({
      where: { id: existing.id },
      data,
    });

    return NextResponse.json({ handlingDeclaration });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params: paramsPromise }: Params) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  try {
    const ctx = await resolveDonorDraft(user.id, params.donationId);
    if ('error' in ctx) return ctx.error;

    const existing = await prisma.handlingDeclaration.findFirst({
      where: { id: params.declarationId, donationId: params.donationId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.handlingDeclaration.delete({ where: { id: existing.id } });

    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}