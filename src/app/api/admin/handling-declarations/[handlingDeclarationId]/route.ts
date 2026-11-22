import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const STORAGE_METHODS = ['refrigerated', 'hot_held', 'ambient', 'frozen'] as const;
type StorageMethod = (typeof STORAGE_METHODS)[number];

type ValidationResult =
  | { ok: true; data: Prisma.HandlingDeclarationUpdateInput }
  | { ok: false; error: string };

function isStorageMethod(value: unknown): value is StorageMethod {
  return typeof value === 'string' && (STORAGE_METHODS as readonly string[]).includes(value);
}

function validateBody(body: Record<string, unknown>): ValidationResult {
  const data: Prisma.HandlingDeclarationUpdateInput = {};
  let touched = false;

  if (body.preparationTimeMinutes !== undefined) {
    const minutes = body.preparationTimeMinutes;
    if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 0) {
      return { ok: false, error: 'Preparation time must be a whole number of minutes.' };
    }
    data.preparationTimeMinutes = minutes;
    touched = true;
  }

  if (body.preparedAt !== undefined) {
    if (typeof body.preparedAt !== 'string') {
      return { ok: false, error: "Preparation time can't be in the future. Enter when the food was prepared." };
    }
    const prepared = new Date(body.preparedAt);
    if (Number.isNaN(prepared.getTime()) || prepared.getTime() > Date.now()) {
      return {
        ok: false,
        error: "Preparation time can't be in the future. Enter when the food was prepared.",
      };
    }
    data.preparedAt = prepared;
    touched = true;
  }

  if (body.storageMethod !== undefined) {
    if (!isStorageMethod(body.storageMethod)) {
      return { ok: false, error: 'Select how the food was stored before pickup.' };
    }
    data.requiresRefrigeration =
      body.storageMethod === 'refrigerated' || body.storageMethod === 'frozen';
    touched = true;
  }

  if (body.allergens !== undefined) {
    if (typeof body.allergens !== 'string' || body.allergens.trim() === '') {
      return {
        ok: false,
        error: "Select the allergens present, or choose 'None declared', before submitting.",
      };
    }
    data.allergens = body.allergens.trim();
    touched = true;
  }

  if (body.checklistConfirmed !== undefined) {
    if (typeof body.checklistConfirmed !== 'boolean') {
      return { ok: false, error: 'Confirm the checklist answers are accurate to continue.' };
    }
    data.checklistConfirmed = body.checklistConfirmed;
    touched = true;
  }

  if (!touched) {
    return { ok: false, error: 'No changes were provided.' };
  }

  return { ok: true, data };
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ handlingDeclarationId: string }>;
  },
) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { handlingDeclarationId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
  }

  const validation = validateBody(body as Record<string, unknown>);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const data = validation.data;

  try {
    const existing = await prisma.handlingDeclaration.findUnique({
      where: { id: handlingDeclarationId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Keep checklistConfirmed and declaredAt consistent: when the checklist
    // becomes confirmed by this correction, stamp the declaration time.
    if (data.checklistConfirmed === true && !existing.checklistConfirmed) {
      data.declaredAt = new Date();
    }

    const handlingDeclaration = await prisma.handlingDeclaration.update({
      where: { id: handlingDeclarationId },
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