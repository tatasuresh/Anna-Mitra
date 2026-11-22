'use client';

import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AvailabilityToggle from '@/components/AvailabilityToggle';
import PickupTaskList from '@/components/PickupTaskList';
import { useAuth } from '@/lib/auth';
import {
  ApiError,
  createPickupTaskAccept,
  getMyPickupTasks,
  getMyVolunteerAvailability,
  getPickupTaskOpen,
  updateMyVolunteerAvailability,
} from '@/lib/api';

type PickupTaskRow = NonNullable<ComponentProps<typeof PickupTaskList>['tasks']>[number];
type MyPickupTask = Awaited<ReturnType<typeof getMyPickupTasks>>[number];

const SAVE_ERROR = 'Availability, capacity or the pickup could not be saved. Please try again.';
const NEED_CAPACITY = 'Enter how many portions you can carry before going available.';

export default function VolunteerTasksPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const isVolunteer = user?.role === 'volunteer';

  const [isAvailable, setIsAvailable] = useState(false);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [capacityInput, setCapacityInput] = useState('');
  const [openTasks, setOpenTasks] = useState<PickupTaskRow[]>([]);
  const [myTasks, setMyTasks] = useState<MyPickupTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [avail, open, mine] = await Promise.all([
        getMyVolunteerAvailability(),
        getPickupTaskOpen(),
        getMyPickupTasks(),
      ]);
      setIsAvailable(avail.is_available);
      setCapacity(avail.carrying_capacity ?? null);
      setCapacityInput(avail.carrying_capacity != null ? String(avail.carrying_capacity) : '');
      setOpenTasks(open as PickupTaskRow[]);
      setMyTasks(mine);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Your tasks could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (isVolunteer) void loadAll();
  }, [isVolunteer, loadAll]);

  const persist = async (changes: { is_available?: boolean; carrying_capacity?: number }) => {
    setFormError(null);
    try {
      await updateMyVolunteerAvailability({
        is_available: changes.is_available ?? isAvailable,
        carrying_capacity: changes.carrying_capacity ?? capacity ?? undefined,
      });
      await loadAll();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : SAVE_ERROR);
    }
  };

  const saveAvailability = async (next: boolean) => {
    if (next && capacity === null) {
      setFormError(NEED_CAPACITY);
      return;
    }
    await persist({ is_available: next });
  };

  const saveCapacity = async () => {
    const raw = capacityInput.trim();
    if (raw === '') return setFormError(NEED_CAPACITY);
    if (!/^\d+$/.test(raw)) return setFormError('Enter the number of portions as digits only, for example 12.');
    const value = Number(raw);
    if (value < 1 || value > 100) return setFormError('Carrying capacity must be a whole number between 1 and 100 portions.');
    await persist({ carrying_capacity: value });
  };

  const acceptPickup = async (pickupTaskId: string) => {
    setFormError(null);
    try {
      await createPickupTaskAccept(pickupTaskId, {});
      router.push('/active-delivery');
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : SAVE_ERROR);
    }
  };

  if (loading || !user) {
    return <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-[var(--muted)]">Loading…</div>;
  }
  if (!isVolunteer) {
    return <div className="mx-auto max-w-5xl px-4 py-8 text-sm">This page is not available for your role.</div>;
  }

  return (
    <div data-nexen-component="nx_app_volunteer_tasks_page" className="ui-page mx-auto w-full max-w-5xl min-w-0 px-4 py-8">
      <div className="ui-page-header">
        <div>
          <h1 className="text-2xl font-bold" data-nexen-id="nx-fc731ad2-0">Volunteer tasks</h1>
          <p className="ui-meta" data-nexen-id="nx-fc731ad2-1">Accept pickups when you are available.</p>
        </div>
      </div>

      {error && (
        <div className="ui-card mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--danger)]" data-nexen-id="nx-fc731ad2-2">{error}</p>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={() => void loadAll()} data-nexen-id="nx-fc731ad2-3">
            Try again
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-busy="true">
          <div className="h-32 animate-pulse rounded-[var(--radius)] bg-[var(--muted)]" />
          <div className="h-32 animate-pulse rounded-[var(--radius)] bg-[var(--muted)]" />
        </div>
      ) : (
        <section className="ui-section mt-6 grid min-w-0 gap-4 sm:grid-cols-2" data-nexen-id="nx-fc731ad2-4">
          <div className="ui-card min-w-0">
            <AvailabilityToggle
              isAvailable={isAvailable}
              onSave={saveAvailability}
              disabled={isLoading}
            />
            <p className="ui-meta mt-2" data-nexen-id="nx-fc731ad2-5">Currently: {isAvailable ? 'Available' : 'Not available'}</p>
          </div>

          <div className="ui-card min-w-0">
            <div className="ui-card-header">
              <h3 className="font-semibold" data-nexen-id="nx-fc731ad2-6">Carrying capacity</h3>
              <span className="ui-badge ui-badge-info" data-nexen-id="nx-fc731ad2-7">
                {capacity != null ? `${capacity} portions` : 'Not set'}
              </span>
            </div>
            <form
              className="ui-form"
              onSubmit={(e) => {
                e.preventDefault();
                void saveCapacity();
              }}
             data-nexen-id="nx-fc731ad2-8">
              <label className="ui-field" data-nexen-id="nx-fc731ad2-9">
                <span data-nexen-id="nx-fc731ad2-10">Carrying capacity (portions)</span>
                <input
                  className="ui-input w-full max-w-xs"
                  type="text"
                  inputMode="numeric"
                  value={capacityInput}
                  onChange={(e) => setCapacityInput(e.target.value)}
                 data-nexen-id="nx-fc731ad2-11"/>
              </label>
              <span className="ui-help" data-nexen-id="nx-fc731ad2-12">Unit: portions per trip.</span>
              <div className="ui-actions">
                <button className="ui-btn ui-btn-primary" type="submit" data-nexen-id="nx-fc731ad2-13">Save capacity</button>
              </div>
            </form>
          </div>
        </section>
      )}

      {formError && <p role="alert" className="mt-4 text-sm text-[var(--danger)]" data-nexen-id="nx-fc731ad2-14">{formError}</p>}

      <section className="ui-section mt-8 min-w-0" data-nexen-id="nx-fc731ad2-15">
        <h2 className="ui-section-title" data-nexen-id="nx-fc731ad2-16">Available pickups</h2>
        {!isAvailable && !isLoading && (
          <p className="ui-meta mb-3" data-nexen-id="nx-fc731ad2-17">Turn on availability to accept pickups.</p>
        )}
        {openTasks.length === 0 && !isLoading ? (
          <p className="ui-meta" data-nexen-id="nx-fc731ad2-18">No pickups need a transporter right now.</p>
        ) : (
          <PickupTaskList tasks={openTasks} onAccepted={(id) => void acceptPickup(id)} />
        )}
      </section>

      <section className="ui-section mt-8 min-w-0" data-nexen-id="nx-fc731ad2-19">
        <h2 className="ui-section-title" data-nexen-id="nx-fc731ad2-20">Accepted pickups</h2>
        {myTasks.length === 0 && !isLoading ? (
          <p className="ui-meta" data-nexen-id="nx-fc731ad2-21">You have not accepted any pickups yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myTasks.map((task) => (
              <div key={task.id} className="ui-card min-w-0">
                <div className="ui-card-header">
                  <h3 className="font-semibold" data-nexen-id="nx-fc731ad2-22">Pickup {task.id.slice(0, 8)}</h3>
                  <span className="ui-badge ui-badge-info" data-nexen-id="nx-fc731ad2-23">{task.status}</span>
                </div>
                <dl className="ui-kv" data-nexen-id="nx-fc731ad2-24">
                  <dt data-nexen-id="nx-fc731ad2-25">Portions</dt>
                  <dd data-nexen-id="nx-fc731ad2-26">{task.portionCount}</dd>
                  <dt data-nexen-id="nx-fc731ad2-27">Status</dt>
                  <dd data-nexen-id="nx-fc731ad2-28">{task.status}</dd>
                </dl>
                <div className="ui-card-footer">
                  <Link className="ui-btn ui-btn-secondary ui-btn-sm" href="/active-delivery" data-nexen-id="nx-fc731ad2-29">Open</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}