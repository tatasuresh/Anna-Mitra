'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { uploadMyDonationPhoto, deleteMyDonationPhoto } from '@/lib/api';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface PhotoUploadProps {
  donationId: string;
  photoUrl?: string | null;
  onUploaded?: () => void;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected file'));
    reader.readAsDataURL(file);
  });
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function PhotoUpload({ donationId, photoUrl, onUploaded }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(photoUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Photo must be 5 MB or smaller.');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      await uploadMyDonationPhoto(donationId, file);
      setPreview(dataUrl);
      onUploaded?.();
    } catch (err) {
      setError(errorMessage(err, 'Photo upload failed. Please try again.'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    setIsUploading(true);
    try {
      await deleteMyDonationPhoto(donationId);
      setPreview(null);
      onUploaded?.();
    } catch (err) {
      setError(errorMessage(err, 'Could not remove the photo. Please try again.'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div data-nexen-component="nx_components_PhotoUpload" className="w-full max-w-md min-w-0 space-y-3">
      {preview ? (
        <img
          src={preview}
          alt="Donation photo preview"
          className="max-h-48 w-full rounded-[var(--radius)] border border-border object-cover"
         data-nexen-id="nx-d8984f9a-0"/>
      ) : (
        <div className="flex w-full items-center justify-center rounded-[var(--radius)] border border-dashed border-border bg-muted px-4 py-8 text-sm text-muted-foreground">
          No photo added
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
       data-nexen-id="nx-d8984f9a-1"/>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center justify-center rounded-[var(--radius)] border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm disabled:opacity-50"
         data-nexen-id="nx-d8984f9a-2">
          {preview ? 'Replace photo' : 'Add photo'}
        </button>

        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            className="inline-flex items-center justify-center rounded-[var(--radius)] border border-border px-3 py-2 text-sm font-semibold text-muted-foreground disabled:opacity-50"
           data-nexen-id="nx-d8984f9a-3">
            Remove photo
          </button>
        )}
      </div>

      {isUploading && (
        <p className="text-sm text-muted-foreground" role="status" data-nexen-id="nx-d8984f9a-4">
          Uploading photo…
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert" data-nexen-id="nx-d8984f9a-5">
          {error}
        </p>
      )}
    </div>
  );
}