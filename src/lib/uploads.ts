import path from 'path';

// Where uploaded files live on disk. On Railway, mount a volume here and set UPLOAD_DIR to the
// mount path (for example /data/uploads) so photos survive redeploys.
export const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), 'public', 'uploads');

export const DONATION_PHOTO_DIR = path.join(UPLOAD_ROOT, 'donations');

// Photos are served by an API route rather than from public/, because Next does not serve
// files added to public/ after the server has started.
export const DONATION_PHOTO_URL_PREFIX = '/api/uploads/donations/';

// Older rows may still point at the previous public/ location.
export const LEGACY_PHOTO_URL_PREFIX = '/uploads/donations/';

export function isStoredPhotoUrl(url: string | null | undefined): url is string {
  return !!url && (url.startsWith(DONATION_PHOTO_URL_PREFIX) || url.startsWith(LEGACY_PHOTO_URL_PREFIX));
}
