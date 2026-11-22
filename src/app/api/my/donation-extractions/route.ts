import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { extractDonation, rateLimit, LOCAL_DATETIME, MAX_INPUT_CHARS } from '@/lib/aiExtraction';

export const dynamic = 'force-dynamic';

// Draft values for Quick Post from a spoken or typed description. The donor reviews and edits
// them. When the AI is not configured, fails, or finds nothing, the answer says so and the
// donor fills the form by hand (HTTP 200, ai_extracted false).
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Only donors can use Quick Post' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('not an object');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = typeof body.input_text === 'string' ? body.input_text.trim() : '';
  if (!text) {
    return NextResponse.json({ error: 'Describe the food first.' }, { status: 400 });
  }
  if (text.length > MAX_INPUT_CHARS) {
    return NextResponse.json({ error: `Keep the description under ${MAX_INPUT_CHARS} characters.` }, { status: 400 });
  }
  if (body.input_method !== 'voice' && body.input_method !== 'text') {
    return NextResponse.json({ error: 'input_method must be "voice" or "text"' }, { status: 400 });
  }
  const nowLocal = typeof body.now_local === 'string' ? body.now_local : '';
  if (!LOCAL_DATETIME.test(nowLocal)) {
    return NextResponse.json({ error: 'now_local must be the local time as YYYY-MM-DDTHH:mm' }, { status: 400 });
  }
  const timezone =
    typeof body.timezone === 'string' && /^[A-Za-z0-9_+\-/]{1,64}$/.test(body.timezone) ? body.timezone : 'UTC';

  const wait = rateLimit(user.id);
  if (wait > 0) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a moment or enter the values by hand.' },
      { status: 429, headers: { 'Retry-After': String(wait) } },
    );
  }

  const result = await extractDonation(text, nowLocal, timezone);
  switch (result.status) {
    case 'ok':
      return NextResponse.json({
        available: true,
        ai_extracted: true,
        description: result.extraction.description,
        portions_total: result.extraction.portionsTotal,
        pickup_by_local: result.extraction.pickupByLocal,
      });
    case 'unclear':
      return NextResponse.json({ available: true, ai_extracted: false, reason: 'unclear' });
    case 'not_configured':
      return NextResponse.json({ available: false, ai_extracted: false, reason: 'not_configured' });
    default:
      return NextResponse.json({ available: false, ai_extracted: false, reason: 'failed' });
  }
}
