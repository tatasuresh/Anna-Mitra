'use client';

import { useEffect, useRef, useState } from 'react';
import { createMyDonationExtraction, type DonationExtraction } from '@/lib/api';

type Props = {
  onResult: (result: DonationExtraction, method: 'voice' | 'text') => void;
  disabled?: boolean;
};

// Minimal typing for the browser's speech recognition (Chrome, Edge and Safari; not Firefox).
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function recognitionClass(): (new () => Recognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, new () => Recognition>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function localNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DonationVoiceInput({ onResult, disabled = false }: Props) {
  const [text, setText] = useState('');
  const [viaVoice, setViaVoice] = useState(false);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(recognitionClass() !== null);
    return () => recognition.current?.stop();
  }, []);

  const toggleListening = () => {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Ctor = recognitionClass();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = 'en-IN';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (event) => {
      const heard = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? '')
        .join(' ')
        .trim();
      setText(heard);
      setViaVoice(true);
    };
    rec.onerror = () => {
      setMessage('Could not hear you. Allow the microphone, or type the description instead.');
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognition.current = rec;
    setMessage(null);
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const submit = async () => {
    const input = text.trim();
    if (!input) return;
    recognition.current?.stop();
    setBusy(true);
    setMessage(null);
    const method = viaVoice ? 'voice' : 'text';
    try {
      const result = await createMyDonationExtraction({
        input_text: input,
        input_method: method,
        now_local: localNow(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
      onResult(result, method);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not read the description. Enter the values by hand.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ui-card">
      <div className="ui-card-body ui-stack">
        <label className="ui-field">
          <span>Describe it in your own words</span>
          <textarea
            className="ui-textarea"
            rows={3}
            maxLength={1000}
            value={text}
            disabled={disabled || busy}
            placeholder="For example: 30 portions of vegetable pulao and raita, pick up by 9 pm tonight"
            onChange={(e) => {
              setText(e.target.value);
              setViaVoice(false);
            }}
          />
          <span className="ui-help">
            {supported
              ? 'Speak or type, then choose Fill the form. You can edit every value afterwards.'
              : 'Type it, then choose Fill the form. You can edit every value afterwards.'}
          </span>
        </label>
        <div className="ui-actions">
          {supported && (
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={toggleListening}
              disabled={disabled || busy}
              aria-pressed={listening}
            >
              {listening ? 'Stop listening' : 'Speak'}
            </button>
          )}
          <button
            type="button"
            className="ui-btn ui-btn-primary"
            onClick={submit}
            disabled={disabled || busy || !text.trim()}
          >
            {busy ? 'Reading…' : 'Fill the form'}
          </button>
        </div>
        {listening && (
          <div role="status" className="ui-alert ui-alert-info">
            Listening… say what you have, how many portions and when it must be collected.
          </div>
        )}
        {message && (
          <div role="alert" className="ui-alert ui-alert-danger">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
