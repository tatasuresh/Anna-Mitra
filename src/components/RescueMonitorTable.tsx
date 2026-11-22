
'use client';

import { useState } from 'react';
import { createAdminPickupTaskResolve } from '@/lib/api';
import type { PickupTask } from '@/types/pickuptask';

interface RescueMonitorTableProps {
  tasks?: PickupTask[] | null;
  onResolved?: () => void;
}

export default function RescueMonitorTable({ tasks, onResolved }: RescueMonitorTableProps) {
  const rows = Array.isArray(tasks) ? tasks : [];
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function setReason(taskId: string, value: string) {
    setReasons((prev) => ({ ...prev, [taskId]: value }));
  }

  async function resolve(task: PickupTask, resolution: 'reassign' | 'close') {
    const reason = (reasons[task.id] ?? '').trim();
    if (!reason) {
      setErrorMsg('Enter a reason before resolving this assignment.');
      return;
    }
    setBusyId(task.id);
    setErrorMsg(null);
    try {
      await createAdminPickupTaskResolve(task.id, { resolution, reason });
      setReasons((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
      onResolved?.();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Could not resolve this assignment.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="w-full min-w-0 rounded-[var(--radius)] border border-border bg-card shadow-sm">
      {errorMsg && (
        <p role="alert" className="px-4 pt-3 text-sm text-destructive" data-nexen-id="nx-bcca002b-0">
          {errorMsg}
        </p>
      )}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm" data-nexen-id="nx-bcca002b-1">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground" data-nexen-id="nx-bcca002b-2">
            <tr data-nexen-id="nx-bcca002b-3">
              <th className="px-4 py-3 font-semibold" data-nexen-id="nx-bcca002b-4">Task</th>
              <th className="px-4 py-3 font-semibold" data-nexen-id="nx-bcca002b-5">Donation</th>
              <th className="px-4 py-3 font-semibold" data-nexen-id="nx-bcca002b-6">Claim</th>
              <th className="px-4 py-3 font-semibold" data-nexen-id="nx-bcca002b-7">Portions</th>
              <th className="px-4 py-3 font-semibold" data-nexen-id="nx-bcca002b-8">Status</th>
              <th className="px-4 py-3 font-semibold" data-nexen-id="nx-bcca002b-9">Failure reason</th>
              <th className="px-4 py-3 font-semibold" data-nexen-id="nx-bcca002b-10">Resolve</th>
            </tr>
          </thead>
          <tbody data-nexen-id="nx-bcca002b-11">
            {rows.length === 0 && (
              <tr data-nexen-id="nx-bcca002b-12">
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground" data-nexen-id="nx-bcca002b-13">
                  No active rescues or failed assignments.
                </td>
              </tr>
            )}
            {rows.map((task) => {
              const isFailed = task.status === 'failed';
              const busy = busyId === task.id;
              return (
                <tr data-nexen-component="nx_components_RescueMonitorTable" key={task.id} className="border-b border-border last:border-b-0 align-top" data-nexen-id="nx-bcca002b-14">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground" data-nexen-id="nx-bcca002b-15">{task.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground" data-nexen-id="nx-bcca002b-16">{task.donationId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground" data-nexen-id="nx-bcca002b-17">{task.claimId}</td>
                  <td className="px-4 py-3" data-nexen-id="nx-bcca002b-18">{task.portionCount}</td>
                  <td className="px-4 py-3" data-nexen-id="nx-bcca002b-19">
                    <span
                      className={
                        isFailed
                          ? 'inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive'
                          : 'inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary'
                      }
                     data-nexen-id="nx-bcca002b-20">
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" data-nexen-id="nx-bcca002b-21">{task.failureReason ?? '—'}</td>
                  <td className="px-4 py-3" data-nexen-id="nx-bcca002b-22">
                    {isFailed ? (
                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <input
                          type="text"
                          aria-label={`Reason for task ${task.id}`}
                          placeholder="Reason"
                          value={reasons[task.id] ?? ''}
                          onChange={(e) => setReason(task.id, e.target.value)}
                          disabled={busy}
                          className="w-full min-w-0 rounded-[var(--radius)] border border-border bg-background px-2 py-1.5 text-sm sm:w-40"
                         data-nexen-id="nx-bcca002b-23"/>
                        <button
                          type="button"
                          onClick={() => resolve(task, 'reassign')}
                          disabled={busy}
                          className="rounded-[var(--radius)] bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                         data-nexen-id="nx-bcca002b-24">
                          Reassign
                        </button>
                        <button
                          type="button"
                          onClick={() => resolve(task, 'close')}
                          disabled={busy}
                          className="rounded-[var(--radius)] border border-border px-3 py-1.5 text-xs font-semibold text-foreground disabled:opacity-50"
                         data-nexen-id="nx-bcca002b-25">
                          Close
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground" data-nexen-id="nx-bcca002b-26">No action needed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}