'use client';

import type { ChangeEvent } from 'react';

export type ExtractedValues = {
  description: string;
  portions: string;
  pickupBy: string;
};

export type ExtractedValuesField = keyof ExtractedValues;

type ExtractedValuesFormProps = {
  values?: Partial<ExtractedValues>;
  onChange: (field: ExtractedValuesField, value: string) => void;
  errors?: Partial<Record<ExtractedValuesField, string>>;
  aiUnavailable?: boolean;
};

const inputClass =
  'w-full min-w-0 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive';

const helpClass = 'text-xs text-muted-foreground';
const errorClass = 'text-xs text-destructive';

export default function ExtractedValuesForm({
  values,
  onChange,
  errors,
  aiUnavailable = false,
}: ExtractedValuesFormProps) {
  const current: ExtractedValues = {
    description: values?.description ?? '',
    portions: values?.portions ?? '',
    pickupBy: values?.pickupBy ?? '',
  };
  const errs = errors ?? {};

  const handle =
    (field: ExtractedValuesField) => (e: ChangeEvent<HTMLInputElement>) =>
      onChange(field, e.target.value);

  return (
    <div data-nexen-component="nx_components_ExtractedValuesForm" className="flex w-full min-w-0 flex-col gap-4">
      <div
        role="note"
        className="rounded-[var(--radius)] border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
      >
        Voice and AI extraction fill these fields from your description. If they
        are unavailable, enter each value by hand. Every value can be edited
        before publishing.
      </div>

      {aiUnavailable && (
        <div
          role="alert"
          className="rounded-[var(--radius)] border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-foreground"
        >
          AI extraction is unavailable. Enter the food description, number of
          portions and pickup-by time by hand.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-1.5 sm:col-span-2" data-nexen-id="nx-3a168d9f-0">
          <span className="text-sm font-medium text-foreground" data-nexen-id="nx-3a168d9f-1">
            Food description
          </span>
          <input
            type="text"
            name="description"
            className={inputClass}
            placeholder="For example: Vegetable pulao"
            value={current.description}
            onChange={handle('description')}
            aria-invalid={Boolean(errs.description)}
            aria-describedby={errs.description ? 'extracted-description-error' : undefined}
           data-nexen-id="nx-3a168d9f-2"/>
          {errs.description && (
            <span id="extracted-description-error" className={errorClass} data-nexen-id="nx-3a168d9f-3">
              {errs.description}
            </span>
          )}
        </label>

        <label className="flex min-w-0 flex-col gap-1.5" data-nexen-id="nx-3a168d9f-4">
          <span className="text-sm font-medium text-foreground" data-nexen-id="nx-3a168d9f-5">
            Number of portions
          </span>
          <input
            type="number"
            name="portions"
            min={1}
            step={1}
            inputMode="numeric"
            className={inputClass}
            placeholder="For example: 30"
            value={current.portions}
            onChange={handle('portions')}
            aria-invalid={Boolean(errs.portions)}
            aria-describedby={errs.portions ? 'extracted-portions-error' : 'extracted-portions-help'}
           data-nexen-id="nx-3a168d9f-6"/>
          {errs.portions ? (
            <span id="extracted-portions-error" className={errorClass} data-nexen-id="nx-3a168d9f-7">
              {errs.portions}
            </span>
          ) : (
            <span id="extracted-portions-help" className={helpClass} data-nexen-id="nx-3a168d9f-8">
              Whole number, greater than zero
            </span>
          )}
        </label>

        <label className="flex min-w-0 flex-col gap-1.5" data-nexen-id="nx-3a168d9f-9">
          <span className="text-sm font-medium text-foreground" data-nexen-id="nx-3a168d9f-10">Pickup by</span>
          <input
            type="datetime-local"
            name="pickupBy"
            className={inputClass}
            value={current.pickupBy}
            onChange={handle('pickupBy')}
            aria-invalid={Boolean(errs.pickupBy)}
            aria-describedby={errs.pickupBy ? 'extracted-pickup-error' : undefined}
           data-nexen-id="nx-3a168d9f-11"/>
          {errs.pickupBy && (
            <span id="extracted-pickup-error" className={errorClass} data-nexen-id="nx-3a168d9f-12">
              {errs.pickupBy}
            </span>
          )}
        </label>
      </div>
    </div>
  );
}