'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReceiptForm from '@/components/ReceiptForm';
import {
  getAuthMe,
  getDonationById,
  getMyDonationClaims,
} from '@/lib/api';

type Claim = Awaited<ReturnType<typeof getMyDonationClaims>>[number];
type DonationDetail = Awaited<ReturnType<typeof getDonationById>>;

function formatPickupBy(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function NgoReceiptPage() {
  const router = useRouter();
  const [isRoleAllowed, setIsRoleAllowed] = useState<boolean | null>(null);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [detail, setDetail] = useState<DonationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNothingToConfirm, setHasNothingToConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let role: string;
      try {
        const me = await getAuthMe();
        role = me.role;
      } catch {
        router.replace('/login');
        return;
      }
      if (cancelled) return;
      if (role !== 'ngo') {
        setIsRoleAllowed(false);
        setIsLoading(false);
        return;
      }
      setIsRoleAllowed(true);

      try {
        const claims = await getMyDonationClaims();
        if (cancelled) return;
        const list = Array.isArray(claims) ? claims : [];
        const requestedId = new URLSearchParams(window.location.search).get('claimId');
        const awaiting = list.filter(
          (c) => c.status === 'confirmed' && (c.receivedAt === null || c.receivedAt === undefined),
        );
        const target =
          (requestedId ? awaiting.find((c) => c.id === requestedId) : undefined) ??
          awaiting[0] ??
          null;

        if (!target) {
          setHasNothingToConfirm(true);
          setIsLoading(false);
          return;
        }

        setClaim(target);
        const donationDetail = await getDonationById(target.donationId);
        if (cancelled) return;
        setDetail(donationDetail);
        setIsLoading(false);
      } catch {
        if (cancelled) return;
        setError('Claim details could not be loaded. Please try again.');
        setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div data-nexen-component="nx_app_ngo_receipt_page" className="ui-page">
      <div className="ui-page-header">
        <div className="min-w-0">
          <h1 data-nexen-id="nx-74995418-0">Confirm received quantity</h1>
          <p className="ui-meta" data-nexen-id="nx-74995418-1">The confirmed amount is what counts as rescued food.</p>
        </div>
      </div>

      {isRoleAllowed === false && (
        <div className="ui-card">
          <div className="ui-card-body">
            <p className="ui-meta" data-nexen-id="nx-74995418-2">This page is not available for your role.</p>
          </div>
        </div>
      )}

      {isRoleAllowed !== false && isLoading && (
        <div className="ui-card">
          <div className="ui-card-body">
            <p className="ui-meta" data-nexen-id="nx-74995418-3">Loading claim details…</p>
          </div>
        </div>
      )}

      {isRoleAllowed !== false && !isLoading && error && (
        <div className="ui-card">
          <div className="ui-card-body">
            <p className="ui-meta" data-nexen-id="nx-74995418-4">{error}</p>
          </div>
        </div>
      )}

      {isRoleAllowed !== false && !isLoading && !error && hasNothingToConfirm && (
        <div className="ui-card">
          <div className="ui-card-body">
            <p className="ui-meta" data-nexen-id="nx-74995418-5">There is nothing to confirm. No claimed donation is awaiting receipt.</p>
          </div>
        </div>
      )}

      {isRoleAllowed !== false && !isLoading && !error && claim && detail && (
        <>
          <section className="ui-section" data-nexen-id="nx-74995418-6">
            <h2 className="ui-section-title" data-nexen-id="nx-74995418-7">Claimed donation</h2>
            <div className="ui-card">
              <div className="ui-card-body">
                <dl className="ui-kv" data-nexen-id="nx-74995418-8">
                  <dt data-nexen-id="nx-74995418-9">Food</dt>
                  <dd data-nexen-id="nx-74995418-10">{detail.donation.description}</dd>
                  <dt data-nexen-id="nx-74995418-11">Donor restaurant</dt>
                  <dd data-nexen-id="nx-74995418-12">{detail.restaurant.name}</dd>
                  <dt data-nexen-id="nx-74995418-13">Pickup by</dt>
                  <dd data-nexen-id="nx-74995418-14">{formatPickupBy(detail.donation.pickupByAt)}</dd>
                  <dt data-nexen-id="nx-74995418-15">Portions claimed</dt>
                  <dd data-nexen-id="nx-74995418-16">{claim.portionsClaimed}</dd>
                </dl>
              </div>
            </div>
          </section>

          <section className="ui-section" data-nexen-id="nx-74995418-17">
            <h2 className="ui-section-title" data-nexen-id="nx-74995418-18">Received quantity</h2>
            <div className="ui-card">
              <div className="ui-card-body">
                <ReceiptForm
                  claimId={claim.id}
                  portionsClaimed={claim.portionsClaimed}
                  onConfirmed={() => setIsConfirmed(true)}
                />
              </div>
            </div>
          </section>

          {isConfirmed && (
            <section className="ui-section" data-nexen-id="nx-74995418-19">
              <div className="ui-card">
                <div className="ui-card-body">
                  <div className="ui-actions">
                    <Link
                      className="ui-btn ui-btn-secondary"
                      href={`/donations/${claim.donationId}`}
                     data-nexen-id="nx-74995418-20">
                      View donation
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}