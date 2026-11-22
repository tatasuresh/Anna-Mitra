'use client';

import { useEffect, useRef, useState } from 'react';

type ConfirmWindowTimerProps = {
  expiresAt: string;
  windowSeconds?: number;
  label?: string;
  onExpire?: () => void;
};

const DEFAULT_WINDOW_SECONDS = 300;

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ConfirmWindowTimer({
  expiresAt,
  windowSeconds = DEFAULT_WINDOW_SECONDS,
  label = 'Confirm before the reservation expires',
  onExpire,
}: ConfirmWindowTimerProps) {
  const parsedTarget = Date.parse(expiresAt);
  const targetMs = Number.isNaN(parsedTarget) ? 0 : parsedTarget;
  const totalMs = Math.max(1, windowSeconds) * 1000;

  // Null until mounted so server and client render the same placeholder.
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);
  const firedRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const tick = () => {
      setRemainingMs(Math.max(0, targetMs - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  useEffect(() => {
    if (remainingMs === 0 && !firedRef.current) {
      firedRef.current = true;
      onExpireRef.current?.();
    }
  }, [remainingMs]);

  const isMounted = remainingMs !== null;
  const expired = isMounted && remainingMs === 0;
  const remaining = remainingMs ?? 0;
  const percentLeft = Math.min(100, Math.max(0, (remaining / totalMs) * 100));
  const isUrgent = isMounted && !expired && remaining <= 60_000;

  const display = isMounted ? formatRemaining(remaining) : '--:--';

  return (
    <div data-nexen-component="nx_components_ConfirmWindowTimer" className="w-full min-w-0 rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-sm text-muted-foreground" data-nexen-id="nx-5ce0c898-0">{label}</p>
        {expired ? (
          <span className="inline-block w-fit rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive" data-nexen-id="nx-5ce0c898-1">
            Window closed
          </span>
        ) : (
          <span
            role="timer"
            aria-label={isMounted ? `${display} remaining` : 'Loading time remaining'}
            className={`font-mono text-2xl font-bold tabular-nums ${
              isUrgent ? 'text-destructive' : 'text-foreground'
            }`}
           data-nexen-id="nx-5ce0c898-2">
            {display}
          </span>
        )}
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentLeft)}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
            isUrgent ? 'bg-destructive' : 'bg-primary'
          }`}
          style={{ width: `${percentLeft}%` }}
        />
      </div>

      {expired && (
        <p className="mt-3 text-sm text-muted-foreground" data-nexen-id="nx-5ce0c898-3">
          The reservation has expired. The portions have returned to the donation.
        </p>
      )}
    </div>
  );
}