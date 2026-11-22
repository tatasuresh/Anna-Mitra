import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STORAGE_METHODS = ['refrigerated', 'hot_held', 'ambient', 'frozen'] as const;
type StorageMethodValue = (typeof STORAGE_METHODS)[number];
const REFRIGERATED_METHODS = new Set<string>(['refrigerated', 'frozen']);
const READ_ROLES = ['donor', 'ngo', 'volunteer', 'admin'];
const NONE_DECLARED = 'none_declared';

function isStorageMethod(value: unknown): value is StorageMethodValue {
  return typeof value === 'string' && (STORAGE_METHODS as readonly string[]).includes(value);
}

type RouteContext = { params: Promise<{ donationId: string }> };

async function loadDonation(donationId: string) {
  if (!UUID_RE.test(donationId)) return null;
  return prisma.donation.findUnique({
    where: { id: donationId },
    include: {
      restaurant: { select: { ownerUserId: true } },
      claims: { select: { claimedByUserId: true } },
      pickupTasks: { select: { volunteerUserId: true } },
    },
  });
}

export async function GET(request: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role == null || !READ_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const donation = await loadDonation(params.donationId);
    if (!donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    const involved =
      user.role === 'admin' ||
      (user.role === 'donor' && donation.restaurant.ownerUserId === user.id) ||
      (user.role === 'ngo' && donation.claims.some((c) => c.claimedByUserId === user.id)) ||
      (user.role === 'volunteer' && donation.pickupTasks.some((p) => p.volunteerUserId === user.id));

    if (!involved) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    const handlingDeclarations = await prisma.handlingDeclaration.findMany({
      where: { donationId: donation.id },
      orderBy: { declaredAt: 'asc' },
    });

    return NextResponse.json({ handlingDeclarations });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params: paramsPromise }: RouteContext) {
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

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const input = body as Record<string, unknown>;

  // Field validation
  const preparationTimeMinutes = input.preparationTimeMinutes;
  if (
    typeof preparationTimeMinutes !== 'number' ||
    !Number.isInteger(preparationTimeMinutes) ||
    preparationTimeMinutes <= 0
  ) {
    return NextResponse.json(
      { error: 'Enter how many minutes the food took to prepare.' },
      { status: 400 },
    );
  }

  const preparedAtRaw = input.preparedAt;
  if (typeof preparedAtRaw !== 'string' || Number.isNaN(Date.parse(preparedAtRaw))) {
    return NextResponse.json(
      { error: 'Enter when the food was prepared.' },
      { status: 400 },
    );
  }
  const preparedAt = new Date(preparedAtRaw);
  if (preparedAt.getTime() > Date.now()) {
    return NextResponse.json(
      { error: "Preparation time can't be in the future. Enter when the food was prepared." },
      { status: 400 },
    );
  }

  const storageMethod = input.storageMethod;
  if (!isStorageMethod(storageMethod)) {
    return NextResponse.json(
      { error: 'Select how the food was stored before pickup.' },
      { status: 400 },
    );
  }

  const allergensRaw = input.allergens;
  const allergensMessage = "Select the allergens present, or choose 'None declared', before submitting.";
  if (!Array.isArray(allergensRaw)) {
    return NextResponse.json({ error: allergensMessage }, { status: 400 });
  }
  const allergens = allergensRaw
    .filter((a): a is string => typeof a === 'string')
    .map((a) => a.trim())
    .filter((a) => a.length > 0);
  if (
    allergens.length === 0 ||
    (allergens.includes(NONE_DECLARED) && allergens.length > 1)
  ) {
    return NextResponse.json({ error: allergensMessage }, { status: 400 });
  }

  if (input.checklistConfirmed !== true) {
    return NextResponse.json(
      { error: 'Confirm the checklist answers are accurate to continue.' },
      { status: 400 },
    );
  }

  try {
    const donation = await loadDonation(params.donationId);
    if (!donation || donation.restaurant.ownerUserId !== user.id) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    if (donation.status !== 'draft') {
      return NextResponse.json(
        { error: 'Handling declarations can only be added while the donation is a draft' },
        { status: 409 },
      );
    }

    const handlingDeclaration = await prisma.handlingDeclaration.create({
      data: {
        donationId: donation.id,
        declaredByUserId: user.id,
        preparationTimeMinutes,
        preparedAt,
        storageMethod,
        requiresRefrigeration: REFRIGERATED_METHODS.has(storageMethod),
        allergens: JSON.stringify(allergens),
        checklistConfirmed: true,
        declaredAt: new Date(),
        status: 'complete',
      },
    });

    return NextResponse.json({ handlingDeclaration }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}