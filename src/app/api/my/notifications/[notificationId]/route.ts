import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';

// The schema has no stored notification table, so there is no alert row that
// belongs to this user to delete. Alerts are derived from donation state, so a
// dismiss request for any id answers 404 rather than pretending it was removed.
export async function DELETE(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ notificationId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const notificationId = params.notificationId;
  if (!notificationId) {
    return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}