'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DonationVoiceInput from '@/components/DonationVoiceInput';
import ExtractedValuesForm from '@/components/ExtractedValuesForm';
import HandlingChecklist from '@/components/HandlingChecklist';
import PhotoUpload from '@/components/PhotoUpload';
import RepeatDonationStrip from '@/components/RepeatDonationStrip';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  createMyDonation,
  createMyDonationPublish,
  createMyDonationRepeat,
  getMyDonationById,
  getMyDonations,
  updateMyDonation,
  type DonationExtraction,
} from '@/lib/api';
import type { Donation } from '@/types/donation';

type Values = { foodDescription: string; portions: string; pickupBy: string };
type Errors = Partial<Record<keyof Values, string>>;

const EMPTY_VALUES: Values = { foodDescription: '', portions: '', pickupBy: '' };

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function validate(v: Values): Errors {
  const e: Errors = {};
  const text = v.foodDescription.trim();
  if (!text) e.foodDescription = 'Please describe the surplus food.';
  else if (text.length < 3) e.foodDescription = 'Describe the food so NGOs know what is being offered (at least 3 characters).';
  else if (text.length > 300) e.foodDescription = 'Keep the food description under 300 characters.';

  const n = Number(v.portions);
  if (!v.portions.trim()) e.portions = 'Please enter how many portions are available.';
  else if (!Number.isInteger(n) || n < 1) e.portions = 'Portions must be a whole number of at least 1.';

  if (!v.pickupBy) e.pickupBy = 'Please choose a pickup-by time.';
  else if (new Date(v.pickupBy).getTime() <= Date.now()) e.pickupBy = 'Pickup-by time must be in the future.';
  return e;
}

export default function QuickPostPage() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Errors>({});
  const [draftId, setDraftId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [checklistDone, setChecklistDone] = useState(false);
  const [previous, setPrevious] = useState<Donation | null>(null);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  // How the values were produced, recorded on the donation when it is first saved.
  const [aiStatus, setAiStatus] = useState<'idle' | 'filled' | 'unclear' | 'unavailable'>('idle');
  const [inputMethod, setInputMethod] = useState<'manual' | 'text' | 'voice'>('manual');
  const [aiExtracted, setAiExtracted] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'donor') return;
    getMyDonations()
      .then((list) => {
        const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setPrevious(sorted[0] ?? null);
      })
      .catch(() => setPrevious(null));
  }, [user]);

  if (isLoading) return <p className="ui-meta" data-nexen-id="nx-674d1bca-0">Loading…</p>;
  if (!user) return null;
  if (user.role !== 'donor') {
    return <p className="ui-meta" data-nexen-id="nx-674d1bca-1">Quick Post is not available for your role.</p>;
  }

  const handleChange = (field: string, value: string) => {
    const key = (field === 'description' ? 'foodDescription' : field) as keyof Values;
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleExtraction = (result: DonationExtraction, method: 'voice' | 'text') => {
    if (!result.ai_extracted) {
      setAiStatus(result.available ? 'unclear' : 'unavailable');
      return;
    }
    setValues((prev) => ({
      foodDescription: result.description ?? prev.foodDescription,
      portions: result.portions_total ? String(result.portions_total) : prev.portions,
      pickupBy: result.pickup_by_local ?? prev.pickupBy,
    }));
    setErrors({});
    setInputMethod(method);
    setAiExtracted(true);
    setAiStatus('filled');
  };

  const applyDonation = (d: Donation) => {
    setDraftId(d.id);
    setValues({
      foodDescription: d.description ?? '',
      portions: String(d.portionsTotal ?? ''),
      pickupBy: d.pickupByAt ? toLocalInput(d.pickupByAt) : '',
    });
    setPhotoUrl(d.photoUrl ?? null);
    setChecklistDone(false);
    setInputMethod('manual');
    setAiExtracted(false);
    setAiStatus('idle');
  };

  const handleRepeat = async (donationId: string) => {
    setIsRepeating(true);
    setServerError(null);
    try {
      const d = await createMyDonationRepeat(donationId, {});
      applyDonation(d);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not repeat the donation.');
    } finally {
      setIsRepeating(false);
    }
  };

  const persist = async (): Promise<string | null> => {
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return null;
    const payload = {
      description: values.foodDescription.trim(),
      portionsTotal: Number(values.portions),
      pickupByAt: new Date(values.pickupBy).toISOString(),
    };
    try {
      if (draftId) {
        await updateMyDonation(draftId, payload);
        return draftId;
      }
      const d = await createMyDonation({ ...payload, inputMethod, aiExtracted });
      setDraftId(d.id);
      return d.id;
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not save the donation.');
      return null;
    }
  };

  const handlePublish = async () => {
    setServerError(null);
    const id = await persist();
    if (!id) return;
    if (!checklistDone) {
      setServerError('Complete the handling checklist before publishing.');
      return;
    }
    setIsPublishing(true);
    try {
      const published = await createMyDonationPublish(id, {});
      router.push(`/donations/${published.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not publish the donation.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePhotoUploaded = async () => {
    if (!draftId) return;
    try {
      const d = await getMyDonationById(draftId);
      setPhotoUrl(d.photoUrl ?? null);
    } catch {
      setServerError('The photo was uploaded but could not be shown. Refresh to see it.');
    }
  };

  const canPublish = Boolean(draftId) && checklistDone && !isPublishing;

  return (
    <div data-nexen-component="nx_app_quick_post_page" className="ui-page">
      <div className="ui-page-header">
        <div>
          <h1 data-nexen-id="nx-674d1bca-2">Quick Post</h1>
          <p className="ui-meta" data-nexen-id="nx-674d1bca-3">Your surplus food can be posted in under 60 seconds.</p>
        </div>
        <div className="ui-actions">
          <Link className="ui-btn ui-btn-ghost" href="/donor-dashboard" data-nexen-id="nx-674d1bca-4">Cancel</Link>
        </div>
      </div>

      {serverError && <div className="ui-alert ui-alert-danger">{serverError}</div>}

      {previous && (
        <section className="ui-section" data-nexen-id="nx-674d1bca-5">
          <RepeatDonationStrip
            previousDonation={previous}
            onRepeat={handleRepeat}
            isRepeating={isRepeating}
          />
        </section>
      )}

      <section className="ui-section" data-nexen-id="nx-674d1bca-6">
        <h2 className="ui-section-title" data-nexen-id="nx-674d1bca-7">Review donation values</h2>
        <div className="ui-stack">
          <DonationVoiceInput onResult={handleExtraction} disabled={isPublishing} />
          {aiStatus === 'filled' && (
            <div role="status" className="ui-alert ui-alert-success">
              Filled from your description. Check each value below, fix anything that is wrong, then save.
            </div>
          )}
          {aiStatus === 'unclear' && (
            <div role="status" className="ui-alert ui-alert-warning">
              We could not find the food, portions or pickup time in that description. Try again with more detail, or
              enter the values by hand.
            </div>
          )}
          <ExtractedValuesForm
            values={values}
            onChange={handleChange}
            errors={errors}
            aiUnavailable={aiStatus === 'unavailable'}
          />
          <div className="ui-actions">
            <button className="ui-btn ui-btn-secondary" type="button" onClick={persist} disabled={isPublishing} data-nexen-id="nx-674d1bca-8">
              Save values
            </button>
          </div>
        </div>
      </section>

      <section className="ui-section" data-nexen-id="nx-674d1bca-9">
        <h2 className="ui-section-title" data-nexen-id="nx-674d1bca-10">Handling checklist</h2>
        <p className="ui-meta" data-nexen-id="nx-674d1bca-11">
          Answer every section for this donation. Nothing is carried over from earlier posts or restaurant preferences.
        </p>
        {!draftId && <p className="ui-help" data-nexen-id="nx-674d1bca-12">Save the values above to unlock the checklist.</p>}
        <HandlingChecklist
          donationId={draftId ?? ''}
          disabled={!draftId}
          onSaved={() => setChecklistDone(true)}
        />
      </section>

      <section className="ui-section" data-nexen-id="nx-674d1bca-13">
        <h2 className="ui-section-title" data-nexen-id="nx-674d1bca-14">Photo and publish</h2>
        <div className="ui-grid ui-grid-2">
          <div className="ui-card">
            <div className="ui-card-header"><h3 data-nexen-id="nx-674d1bca-15">Photo (optional)</h3></div>
            <div className="ui-card-body">
              {draftId ? (
                <PhotoUpload donationId={draftId} photoUrl={photoUrl} onUploaded={handlePhotoUploaded} />
              ) : (
                <div className="ui-media">No photo added</div>
              )}
            </div>
          </div>
          <div className="ui-card ui-card-body">
            <p data-nexen-id="nx-674d1bca-16">Publishing is blocked until the food description, portions, pickup-by time and every checklist section are complete.</p>
            <div className="ui-actions">
              <button
                className={`ui-btn ui-btn-primary${canPublish ? '' : ' is-disabled'}`}
                type="button"
                disabled={!canPublish}
                onClick={handlePublish}
               data-nexen-id="nx-674d1bca-17">
                {isPublishing ? 'Publishing…' : 'Publish donation'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}