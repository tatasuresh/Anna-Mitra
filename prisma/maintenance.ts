// Housekeeping that runs each time the container starts, before the seed.
//  1. Removes the donations the Playwright flow test creates (description starts with "E2E ").
//     Claims, pickup tasks, handling declarations and status events go with them (ON DELETE CASCADE).
//  2. Repairs pickup tasks whose fields contradict their status, e.g. an "open" task that already
//     has a collected time, or a failure reason on a task that did not fail. Real tasks never
//     look like that, so this only ever touches inconsistent sample data.
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const pruned = await db.donation.deleteMany({ where: { description: { startsWith: 'E2E ' } } });
  console.log(`[maintenance] removed ${pruned.count} test donation(s)`);

  const fixes = await db.$transaction([
    db.pickupTask.updateMany({ where: { status: { not: 'failed' }, failureReason: { not: null } }, data: { failureReason: null } }),
    db.pickupTask.updateMany({ where: { status: 'open', OR: [{ acceptedAt: { not: null } }, { collectedAt: { not: null } }, { handedOverAt: { not: null } }] }, data: { acceptedAt: null, collectedAt: null, handedOverAt: null } }),
    db.pickupTask.updateMany({ where: { status: 'accepted', OR: [{ collectedAt: { not: null } }, { handedOverAt: { not: null } }] }, data: { collectedAt: null, handedOverAt: null } }),
    db.pickupTask.updateMany({ where: { status: 'collected', handedOverAt: { not: null } }, data: { handedOverAt: null } }),
    db.pickupTask.updateMany({ where: { status: 'failed', handedOverAt: { not: null } }, data: { handedOverAt: null } }),
  ]);
  console.log(`[maintenance] repaired ${fixes.reduce((n, r) => n + r.count, 0)} inconsistent pickup task field(s)`);
}

main()
  .catch((e) => console.log('[maintenance] skipped: ' + (e instanceof Error ? e.message.split('\n')[0] : String(e))))
  .finally(() => db.$disconnect());
