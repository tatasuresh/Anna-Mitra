'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { createMyDonationHandlingDeclaration } from '@/lib/api';

type StorageMethod = 'refrigerated' | 'hot_held' | 'ambient' | 'frozen';

export interface HandlingChecklistProps {
  donationId?: string;
  disabled?: boolean;
  onSaved?: () => void;
}

const PREP_OPTIONS = [
  { label: 'Within the last hour', minutes: 60 },
  { label: '1 to 2 hours ago', minutes: 120 },
  { label: '2 to 4 hours ago', minutes: 240 },
  { label: 'More than 4 hours ago', minutes: 300 },
];

const STORAGE_OPTIONS: { value: StorageMethod; label: string }[] = [
  { value: 'hot_held', label: 'Held hot above 63 °C' },
  { value: 'refrigerated', label: 'Chilled within 2 hours if unused' },
  { value: 'ambient', label: 'Ambient, dry storage' },
  { value: 'frozen', label: 'Frozen' },
];

const ALLERGENS = ['Dairy', 'Gluten', 'Nuts', 'Eggs', 'Soy', 'Fish or shellfish', 'Sesame'];

const CARD = 'min-w-0 rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm';
const SELECT = 'w-full min-w-0 rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm';
const ERR = 'mt-2 text-sm text-destructive';
const ROW = 'flex items-center gap-2 text-sm';

export default function HandlingChecklist({ donationId, disabled = false, onSaved }: HandlingChecklistProps) {
  const [prep, setPrep] = useState<number | null>(null);
  const [storage, setStorage] = useState<StorageMethod | null>(null);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [noneDeclared, setNoneDeclared] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  function toggleAllergen(name: string) {
    setNoneDeclared(false);
    setAllergens((prev) => (prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]));
  }

  function toggleNone(checked: boolean) {
    setNoneDeclared(checked);
    if (checked) setAllergens([]);
  }

  function validate(): Record<string, string> {
    const found: Record<string, string> = {};
    if (prep === null) found.prep = 'Preparation time can\'t be in the future. Enter when the food was prepared.';
    if (!storage) found.storage = 'Select how the food was stored before pickup.';
    if (allergens.length === 0 && !noneDeclared) {
      found.allergens = "Select the allergens present, or choose 'None declared', before submitting.";
    }
    if (!confirmed) found.confirmed = 'Confirm the checklist answers are accurate to continue.';
    return found;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setMessage('');
    if (Object.keys(found).length > 0 || prep === null || !storage) {
      setStatus('error');
      return;
    }
    if (!donationId) {
      setStatus('error');
      setMessage('Save the donation as a draft before completing the checklist.');
      return;
    }
    setStatus('saving');
    try {
      await createMyDonationHandlingDeclaration(donationId, {
        preparationTimeMinutes: prep,
        storageMethod: storage,
        requiresRefrigeration: storage === 'refrigerated',
        allergens: noneDeclared ? 'none' : allergens.join(', '),
        checklistConfirmed: true,
      });
      setStatus('saved');
      setMessage('Checklist saved for this donation.');
      onSaved?.();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Could not save the checklist. Try again.');
    }
  }

  return (
    <form data-nexen-component="nx_components_HandlingChecklist" onSubmit={handleSubmit} noValidate className="min-w-0 space-y-4" data-nexen-id="nx-9f1c82d7-0">
      {disabled && (
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-9f1c82d7-1">
          This checklist is locked because the donation has already been claimed.
        </p>
      )}
      <fieldset disabled={disabled} className="grid min-w-0 gap-4 sm:grid-cols-3" data-nexen-id="nx-9f1c82d7-2">
        <section className={CARD} data-nexen-id="nx-9f1c82d7-3">
          <h3 className="font-semibold" data-nexen-id="nx-9f1c82d7-4">Preparation time</h3>
          <label className="mt-3 flex flex-col gap-1 text-sm" data-nexen-id="nx-9f1c82d7-5">
            <span data-nexen-id="nx-9f1c82d7-6">When was the food cooked?</span>
            <select
              className={SELECT}
              value={prep ?? ''}
              onChange={(e) => setPrep(e.target.value === '' ? null : Number(e.target.value))}
             data-nexen-id="nx-9f1c82d7-7">
              <option value="">Choose an answer</option>
              {PREP_OPTIONS.map((o) => (
                <option key={o.minutes} value={o.minutes}>{o.label}</option>
              ))}
            </select>
          </label>
          {errors.prep && <p className={ERR} data-nexen-id="nx-9f1c82d7-8">{errors.prep}</p>}
        </section>

        <section className={CARD} data-nexen-id="nx-9f1c82d7-9">
          <h3 className="font-semibold" data-nexen-id="nx-9f1c82d7-10">Storage and handling</h3>
          <div className="mt-3 flex flex-col gap-2">
            {STORAGE_OPTIONS.map((o) => (
              <label key={o.value} className={ROW} data-nexen-id="nx-9f1c82d7-11">
                <input
                  type="radio"
                  name="storage-method"
                  value={o.value}
                  checked={storage === o.value}
                  onChange={() => setStorage(o.value)}
                 data-nexen-id="nx-9f1c82d7-12"/>
                <span data-nexen-id="nx-9f1c82d7-13">{o.label}</span>
              </label>
            ))}
          </div>
          {errors.storage && <p className={ERR} data-nexen-id="nx-9f1c82d7-14">{errors.storage}</p>}
        </section>

        <section className={CARD} data-nexen-id="nx-9f1c82d7-15">
          <h3 className="font-semibold" data-nexen-id="nx-9f1c82d7-16">Allergens</h3>
          <div className="mt-3 flex flex-col gap-2">
            {ALLERGENS.map((name) => (
              <label key={name} className={ROW} data-nexen-id="nx-9f1c82d7-17">
                <input type="checkbox" checked={allergens.includes(name)} onChange={() => toggleAllergen(name)}  data-nexen-id="nx-9f1c82d7-18"/>
                <span data-nexen-id="nx-9f1c82d7-19">Contains {name.toLowerCase()}</span>
              </label>
            ))}
            <label className={ROW} data-nexen-id="nx-9f1c82d7-20">
              <input type="checkbox" checked={noneDeclared} onChange={(e) => toggleNone(e.target.checked)}  data-nexen-id="nx-9f1c82d7-21"/>
              <span data-nexen-id="nx-9f1c82d7-22">None declared</span>
            </label>
          </div>
          {errors.allergens && <p className={ERR} data-nexen-id="nx-9f1c82d7-23">{errors.allergens}</p>}
        </section>
      </fieldset>

      <div className="min-w-0 space-y-2">
        <label className={ROW} data-nexen-id="nx-9f1c82d7-24">
          <input
            type="checkbox"
            disabled={disabled}
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
           data-nexen-id="nx-9f1c82d7-25"/>
          <span data-nexen-id="nx-9f1c82d7-26">I confirm these checklist answers are accurate for this donation.</span>
        </label>
        {errors.confirmed && <p className={ERR} data-nexen-id="nx-9f1c82d7-27">{errors.confirmed}</p>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          role="alert"
          className={`min-w-0 text-sm ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
         data-nexen-id="nx-9f1c82d7-28">
          {message}
        </p>
        <button
          type="submit"
          disabled={disabled || status === 'saving'}
          className="w-full rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 sm:w-auto"
         data-nexen-id="nx-9f1c82d7-29">
          {status === 'saving' ? 'Saving…' : 'Save checklist'}
        </button>
      </div>
    </form>
  );
}