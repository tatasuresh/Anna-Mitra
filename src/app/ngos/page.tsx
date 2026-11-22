'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createAdminNgo,
  createAdminNgoApprove,
  createAdminNgoSuspend,
  getAdminNgoById,
  getAdminNgos,
  getAuthMe,
  updateAdminNgo,
} from '@/lib/api';
import type { User } from '@/types/user';
import type { Ngo } from '@/types/ngo';

type FormState = {
  name: string;
  latitude: string;
  longitude: string;
  serviceRadiusKm: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = { name: '', latitude: '', longitude: '', serviceRadiusKm: '' };
const STATUS_OPTIONS = ['', 'pending_approval', 'approved', 'suspended'];

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Enter the NGO name.';
  const lat = Number(form.latitude);
  if (form.latitude.trim() === '' || Number.isNaN(lat) || lat < -90 || lat > 90) {
    errors.latitude = 'Enter a latitude between -90 and 90.';
  }
  const lng = Number(form.longitude);
  if (form.longitude.trim() === '' || Number.isNaN(lng) || lng < -180 || lng > 180) {
    errors.longitude = 'Enter a longitude between -180 and 180.';
  }
  const radius = Number(form.serviceRadiusKm);
  if (form.serviceRadiusKm.trim() === '' || Number.isNaN(radius) || radius <= 0) {
    errors.serviceRadiusKm = 'Enter a service radius greater than zero, in km.';
  }
  return errors;
}

export default function NgosPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [ngos, setNgos] = useState<Ngo[] | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAuthMe()
      .then((user) => setMe(user))
      .catch(() => router.replace('/login'))
      .finally(() => setAuthChecked(true));
  }, [router]);

  const loadNgos = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      const list = await getAdminNgos(statusFilter ? { status: statusFilter } : {});
      setNgos(Array.isArray(list) ? list : []);
    } catch (e) {
      setListError(errorMessage(e, 'NGOs could not be loaded.'));
      setNgos(null);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (me?.role === 'admin') void loadNgos();
  }, [me, loadNgos]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormError(null);
  };

  const startEdit = async (ngo: Ngo) => {
    setNotice(null);
    setFormError(null);
    try {
      const fresh = await getAdminNgoById(ngo.id);
      setEditingId(fresh.id);
      setForm({
        name: fresh.name,
        latitude: String(fresh.latitude),
        longitude: String(fresh.longitude),
        serviceRadiusKm: String(fresh.serviceRadiusKm),
      });
      setFormErrors({});
    } catch (e) {
      setFormError(errorMessage(e, 'That NGO could not be loaded.'));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      serviceRadiusKm: Number(form.serviceRadiusKm),
    };

    setBusy(true);
    setFormError(null);
    try {
      if (editingId) {
        await updateAdminNgo(editingId, payload);
        setNotice('NGO updated.');
      } else {
        await createAdminNgo(payload);
        setNotice('NGO created and awaiting approval.');
      }
      resetForm();
      await loadNgos();
    } catch (e) {
      setFormError(errorMessage(e, 'The NGO could not be saved.'));
    } finally {
      setBusy(false);
    }
  };

  const runStatusAction = async (ngo: Ngo, action: 'approve' | 'suspend') => {
    setBusy(true);
    setNotice(null);
    setListError(null);
    try {
      if (action === 'approve') {
        await createAdminNgoApprove(ngo.id, {});
        setNotice(`${ngo.name} approved.`);
      } else {
        await createAdminNgoSuspend(ngo.id, {});
        setNotice(`${ngo.name} suspended.`);
      }
      await loadNgos();
    } catch (e) {
      setListError(errorMessage(e, `Could not ${action} this NGO.`));
    } finally {
      setBusy(false);
    }
  };

  if (!authChecked) {
    return <main className="p-4 text-sm text-[var(--muted-foreground,inherit)]" data-nexen-id="nx-fed923b4-0">Loading…</main>;
  }

  if (!me) return null;

  if (me.role !== 'admin') {
    return (
      <main className="mx-auto w-full max-w-xl p-4 sm:p-6" data-nexen-id="nx-fed923b4-1">
        <div className="rounded-[var(--radius)] border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold" data-nexen-id="nx-fed923b4-2">NGO management is not available for your role.</h1>
          <Link href="/" className="mt-4 inline-block text-sm underline" data-nexen-id="nx-fed923b4-3">Go to your home page</Link>
        </div>
      </main>
    );
  }

  const safeNgos = Array.isArray(ngos) ? ngos : [];
  const inputClass = 'mt-1 w-full min-w-0 rounded-[var(--radius)] border bg-background px-3 py-2 text-sm';

  return (
    <main data-nexen-component="nx_app_ngos_page" className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6" data-nexen-id="nx-fed923b4-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-nexen-id="nx-fed923b4-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold" data-nexen-id="nx-fed923b4-6">NGOs</h1>
          <p className="text-sm text-muted-foreground" data-nexen-id="nx-fed923b4-7">Approve, suspend and edit partner organisations.</p>
        </div>
        <label className="flex items-center gap-2 text-sm" data-nexen-id="nx-fed923b4-8">
          <span data-nexen-id="nx-fed923b4-9">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[var(--radius)] border bg-card px-3 py-2"
           data-nexen-id="nx-fed923b4-10">
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt || 'all'} value={opt}>{opt ? opt.replace('_', ' ') : 'All'}</option>
            ))}
          </select>
        </label>
      </header>

      {notice && <p className="rounded-[var(--radius)] border bg-card p-3 text-sm text-[var(--success,inherit)]" data-nexen-id="nx-fed923b4-11">{notice}</p>}
      {listError && <p className="rounded-[var(--radius)] border bg-card p-3 text-sm text-[var(--danger,inherit)]" data-nexen-id="nx-fed923b4-12">{listError}</p>}

      <section className="rounded-[var(--radius)] border bg-card shadow-sm" data-nexen-id="nx-fed923b4-13">
        {isLoading ? (
          <p className="p-4 text-sm" data-nexen-id="nx-fed923b4-14">Loading NGOs…</p>
        ) : safeNgos.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground" data-nexen-id="nx-fed923b4-15">No NGOs to show.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm" data-nexen-id="nx-fed923b4-16">
              <thead className="border-b text-muted-foreground" data-nexen-id="nx-fed923b4-17">
                <tr data-nexen-id="nx-fed923b4-18">
                  <th className="p-3 font-medium" data-nexen-id="nx-fed923b4-19">Name</th>
                  <th className="p-3 font-medium" data-nexen-id="nx-fed923b4-20">Latitude</th>
                  <th className="p-3 font-medium" data-nexen-id="nx-fed923b4-21">Longitude</th>
                  <th className="p-3 font-medium" data-nexen-id="nx-fed923b4-22">Radius (km)</th>
                  <th className="p-3 font-medium" data-nexen-id="nx-fed923b4-23">Status</th>
                  <th className="p-3 font-medium" data-nexen-id="nx-fed923b4-24">Actions</th>
                </tr>
              </thead>
              <tbody data-nexen-id="nx-fed923b4-25">
                {safeNgos.map((ngo) => (
                  <tr key={ngo.id} className="border-b last:border-0" data-nexen-id="nx-fed923b4-26">
                    <td className="p-3 font-medium" data-nexen-id="nx-fed923b4-27">{ngo.name}</td>
                    <td className="p-3" data-nexen-id="nx-fed923b4-28">{Number(ngo.latitude).toFixed(5)}</td>
                    <td className="p-3" data-nexen-id="nx-fed923b4-29">{Number(ngo.longitude).toFixed(5)}</td>
                    <td className="p-3" data-nexen-id="nx-fed923b4-30">{Number(ngo.serviceRadiusKm).toFixed(1)}</td>
                    <td className="p-3" data-nexen-id="nx-fed923b4-31">
                      <span className="rounded-[999px] border px-2 py-0.5 text-xs" data-nexen-id="nx-fed923b4-32">{ngo.status.replace('_', ' ')}</span>
                    </td>
                    <td className="p-3" data-nexen-id="nx-fed923b4-33">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void startEdit(ngo)}
                          disabled={busy}
                          className="rounded-[var(--radius)] border px-3 py-1 text-xs"
                         data-nexen-id="nx-fed923b4-34">
                          Edit
                        </button>
                        {ngo.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => void runStatusAction(ngo, 'approve')}
                            disabled={busy}
                            className="rounded-[var(--radius)] bg-primary px-3 py-1 text-xs text-primary-foreground"
                           data-nexen-id="nx-fed923b4-35">
                            Approve
                          </button>
                        )}
                        {ngo.status !== 'suspended' && (
                          <button
                            type="button"
                            onClick={() => void runStatusAction(ngo, 'suspend')}
                            disabled={busy}
                            className="rounded-[var(--radius)] border px-3 py-1 text-xs"
                           data-nexen-id="nx-fed923b4-36">
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius)] border bg-card p-4 shadow-sm sm:p-6" data-nexen-id="nx-fed923b4-37">
        <h2 className="text-lg font-semibold" data-nexen-id="nx-fed923b4-38">{editingId ? 'Edit NGO' : 'Add NGO'}</h2>
        <form onSubmit={handleSubmit} noValidate className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" data-nexen-id="nx-fed923b4-39">
          <label className="block min-w-0 sm:col-span-2" data-nexen-id="nx-fed923b4-40">
            <span className="text-sm" data-nexen-id="nx-fed923b4-41">Name</span>
            <input className={inputClass} value={form.name} onChange={(e) => updateField('name', e.target.value)}  data-nexen-id="nx-fed923b4-42"/>
            {formErrors.name && <span className="text-xs text-[var(--danger,inherit)]" data-nexen-id="nx-fed923b4-43">{formErrors.name}</span>}
          </label>
          <label className="block min-w-0" data-nexen-id="nx-fed923b4-44">
            <span className="text-sm" data-nexen-id="nx-fed923b4-45">Latitude</span>
            <input inputMode="decimal" className={inputClass} value={form.latitude} onChange={(e) => updateField('latitude', e.target.value)}  data-nexen-id="nx-fed923b4-46"/>
            {formErrors.latitude && <span className="text-xs text-[var(--danger,inherit)]" data-nexen-id="nx-fed923b4-47">{formErrors.latitude}</span>}
          </label>
          <label className="block min-w-0" data-nexen-id="nx-fed923b4-48">
            <span className="text-sm" data-nexen-id="nx-fed923b4-49">Longitude</span>
            <input inputMode="decimal" className={inputClass} value={form.longitude} onChange={(e) => updateField('longitude', e.target.value)}  data-nexen-id="nx-fed923b4-50"/>
            {formErrors.longitude && <span className="text-xs text-[var(--danger,inherit)]" data-nexen-id="nx-fed923b4-51">{formErrors.longitude}</span>}
          </label>
          <label className="block min-w-0" data-nexen-id="nx-fed923b4-52">
            <span className="text-sm" data-nexen-id="nx-fed923b4-53">Service radius (km)</span>
            <input inputMode="decimal" className={inputClass} value={form.serviceRadiusKm} onChange={(e) => updateField('serviceRadiusKm', e.target.value)}  data-nexen-id="nx-fed923b4-54"/>
            {formErrors.serviceRadiusKm && <span className="text-xs text-[var(--danger,inherit)]" data-nexen-id="nx-fed923b4-55">{formErrors.serviceRadiusKm}</span>}
          </label>
          {formError && <p className="text-sm text-[var(--danger,inherit)] sm:col-span-2" data-nexen-id="nx-fed923b4-56">{formError}</p>}
          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
            <button
              type="submit"
              disabled={busy}
              className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
             data-nexen-id="nx-fed923b4-57">
              {editingId ? 'Save changes' : 'Create NGO'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-[var(--radius)] border px-4 py-2 text-sm" data-nexen-id="nx-fed923b4-58">
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}