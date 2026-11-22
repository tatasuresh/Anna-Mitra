import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const STORAGE_METHODS = ['refrigerated', 'hot_held', 'ambient', 'frozen'] as const;
type StorageMethod = (typeof STORAGE_METHODS)[number];
const NONE_DECLARED = 'none_declared';

type RouteContext = {
  params: Promise<{ donationId: string; handlingDeclarationId: string }>;
};

type Body = Record<string, unknown>;

type ParsedUpdate = {
  preparationTimeMinutes?: number;
  preparedAt?: Date;
  requiresRefrigeration?: boolean;
  allergens?: string;
  checklistConfirmed?: boolean;
};

function readField(body: Body, camel: string, snake: string): unknown {
  return body[camel] !== undefined ? body[camel] : body[snake];
}

function isPlainObject(value: unknown): value is Body {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseUpdate(body: Body): { data: ParsedUpdate } | { error: string } {
  const data: ParsedUpdate = {};

  const minutesRaw = readField(body, 'preparationTimeMinutes', 'preparation_time_minutes');
  if (minutesRaw !== undefined) {
    if (typeof minutesRaw !== 'number' || !Number.isInteger(minutesRaw) || minutesRaw < 0) {
      return { error: 'Enter how many minutes the food took to prepare.' };
    }
    data.preparationTimeMinutes = minutesRaw;
  }

  const preparedRaw = readField(body, 'preparedAt', 'prepared_at');
  if (preparedRaw !== undefined) {
    if (typeof preparedRaw !== 'string') {
      return { error: 'Enter a valid preparation date and time.' };
    }
    const prepared = new Date(preparedRaw);
    if (Number.isNaN(prepared.getTime())) {
      return { error: 'Enter a valid preparation date and time.' };
    }
    if (prepared.getTime() > Date.now()) {
      return { error: "Preparation time can't be in the future. Enter when the food was prepared." };
    }
    data.preparedAt = prepared;
  }

  const storageRaw = readField(body, 'storageMethod', 'storage_method');
  if (storageRaw !== undefined) {
    if (typeof storageRaw !== 'string' || !(STORAGE_METHODS as readonly string[]).includes(storageRaw)) {
      return { error: 'Select how the food was stored before pickup.' };
    }
    const storage = storageRaw as StorageMethod;
    data.requiresRefrigeration = storage === 'refrigerated' || storage === 'frozen';
  }

  const refrigerationRaw = readField(body, 'requiresRefrigeration', 'requires_refrigeration');
  if (refrigerationRaw !== undefined) {
    if (typeof refrigerationRaw !== 'boolean') {
      return { error: 'Select how the food was stored before pickup.' };
    }
    data.requiresRefrigeration = refrigerationRaw;
  }

  const allergensRaw = readField(body, 'allergens', 'allergens');
  if (allergensRaw !== undefined) {
    const allergenMessage = "Select the allergens present, or choose 'None declared', before submitting.";
    if (!Array.isArray(allergensRaw)) {
      return { error: allergenMessage };
    }
    const list = allergensRaw
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    if (list.length === 0) {
      return { error: allergenMessage };
    }
    if (list.includes(NONE_DECLARED) && list.length > 1) {
      return { error: allergenMessage };
    }
    data.allergens = JSON.stringify(list);
  }

  const confirmedRaw = readField(body, 'checklistConfirmed', 'checklist_confirmed');
  if (confirmedRaw !== undefined) {
    if (typeof confirmedRaw !== 'boolean') {
      return { error: 'Confirm the checklist answers are accurate to continue.' };
    }
    data.checklistConfirmed = confirmedRaw;
  }

  if (Object.keys(data).length === 0) {
    return { error: 'No changes provided.' };
  }

  return { data };
}

async function findOwnedDraftDeclaration(
  donationId: string,
  declarationId: string,
  userId: string,
) {
  const donation = await prisma.donation.findFirst({
    where: { id: donationId, restaurant: { ownerUserId: userId } },
    select: { id: true, status: true },
  });
  if (!donation) {
    return { errorResponse: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  }
  if (donation.status !== 'draft') {
    return {
      errorResponse: NextResponse.json(
        { error: 'Donation is already published and its checklist is locked' },
        { status: 409 },
      ),
    };
  }
  const declaration = await prisma.handlingDeclaration.findFirst({
    where: { id: declarationId, donationId: donation.id },
  });
  if (!declaration) {
    return { errorResponse: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  }
  return { declaration };
}

export async function PATCH(request: NextRequest, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!isPlainObject(body)) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseUpdate(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const found = await findOwnedDraftDeclaration(
      params.donationId,
      params.handlingDeclarationId,
      user.id,
    );
    if ('errorResponse' in found) return found.errorResponse;

    const handlingDeclaration = await prisma.handlingDeclaration.update({
      where: { id: found.declaration.id },
      data: parsed.data as Prisma.HandlingDeclarationUpdateInput,
    });

    return NextResponse.json({ handlingDeclaration });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const found = await findOwnedDraftDeclaration(
      params.donationId,
      params.handlingDeclarationId,
      user.id,
    );
    if ('errorResponse' in found) return found.errorResponse;

    await prisma.handlingDeclaration.delete({
      where: { id: found.declaration.id },
    });

    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}