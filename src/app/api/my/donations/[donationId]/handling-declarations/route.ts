import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STORAGE_METHODS = ['refrigerated', 'hot_held', 'ambient', 'frozen'] as const;
type StorageMethodValue = (typeof STORAGE_METHODS)[number];

const REFRIGERATED_METHODS: StorageMethodValue[] = ['refrigerated', 'frozen'];

function isStorageMethod(value: unknown): value is StorageMethodValue {
  return typeof value === 'string' && (STORAGE_METHODS as readonly string[]).includes(value);
}

/**
 * Returns the donation only when it belongs to a restaurant owned by the caller.
 * Anything else (missing, malformed id, another donor's restaurant) is treated as not found.
 */
async function findOwnedDonation(donationId: string, userId: string) {
  if (!UUID_RE.test(donationId)) return null;
  return prisma.donation.findFirst({
    where: { id: donationId, restaurant: { ownerUserId: userId } },
    select: { id: true, status: true },
  });
}

export async function GET(request: Request, { params: paramsPromise }: { params: Promise<{ donationId: string }> }) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const donationId = params.donationId;

  try {
    const donation = await findOwnedDonation(donationId, user.id);
    if (!donation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const handlingDeclarations = await prisma.handlingDeclaration.findMany({
      where: { donationId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ handlingDeclarations });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ donationId: string }> }) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const donationId = params.donationId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;

  // Validation: preparation time (minutes)
  const preparationTimeMinutes = input.preparationTimeMinutes;
  if (
    typeof preparationTimeMinutes !== 'number' ||
    !Number.isInteger(preparationTimeMinutes) ||
    preparationTimeMinutes <= 0
  ) {
    return NextResponse.json(
      { error: 'Enter how many minutes the food took to prepare, as a whole number above zero.' },
      { status: 400 },
    );
  }

  // Validation: prepared_at must be a valid date/time no later than now
  const preparedAtRaw = input.preparedAt;
  if (typeof preparedAtRaw !== 'string') {
    return NextResponse.json(
      { error: 'Preparation time can\'t be in the future. Enter when the food was prepared.' },
      { status: 400 },
    );
  }
  const preparedAt = new Date(preparedAtRaw);
  if (Number.isNaN(preparedAt.getTime())) {
    return NextResponse.json(
      { error: 'Preparation time must be a valid date and time.' },
      { status: 400 },
    );
  }
  if (preparedAt.getTime() > Date.now()) {
    return NextResponse.json(
      { error: "Preparation time can't be in the future. Enter when the food was prepared." },
      { status: 400 },
    );
  }

  // Validation: storage method must be one of the allowed options
  const storageMethod = input.storageMethod;
  if (!isStorageMethod(storageMethod)) {
    return NextResponse.json(
      { error: 'Select how the food was stored before pickup.' },
      { status: 400 },
    );
  }

  // Validation: allergens must be explicitly answered (list present or explicit 'none')
  const allergensRaw = input.allergens;
  if (!Array.isArray(allergensRaw) || allergensRaw.length === 0) {
    return NextResponse.json(
      { error: "Select the allergens present, or choose 'None declared', before submitting." },
      { status: 400 },
    );
  }
  const allergenList = allergensRaw.map((a) => (typeof a === 'string' ? a.trim() : ''));
  if (allergenList.some((a) => a.length === 0)) {
    return NextResponse.json(
      { error: "Select the allergens present, or choose 'None declared', before submitting." },
      { status: 400 },
    );
  }
  const declaresNone = allergenList.includes('none');
  if (declaresNone && allergenList.length > 1) {
    return NextResponse.json(
      { error: "Select the allergens present, or choose 'None declared', before submitting." },
      { status: 400 },
    );
  }
  const allergens = declaresNone ? 'none_declared' : allergenList.join(', ');

  // Validation: checklist must be confirmed
  if (input.checklistConfirmed !== true) {
    return NextResponse.json(
      { error: 'Confirm the checklist answers are accurate to continue.' },
      { status: 400 },
    );
  }

  try {
    const donation = await findOwnedDonation(donationId, user.id);
    if (!donation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (donation.status !== 'draft') {
      return NextResponse.json(
        { error: 'Handling declarations can only be added to a draft donation' },
        { status: 409 },
      );
    }

    const handlingDeclaration = await prisma.handlingDeclaration.create({
      data: {
        donationId,
        declaredByUserId: user.id,
        preparationTimeMinutes,
        preparedAt,
        storageMethod,
        requiresRefrigeration: REFRIGERATED_METHODS.includes(storageMethod),
        allergens,
        checklistConfirmed: true,
        declaredAt: new Date(),
        status: 'recorded',
      },
    });

    return NextResponse.json({ handlingDeclaration }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}