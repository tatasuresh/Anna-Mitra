// Auto-generated from the reviewed schema — canonical PickupTask shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface PickupTask {
  id: string;
  createdAt: string;
  updatedAt: string;
  donationId: string;
  claimId: string;
  volunteerUserId?: string | null;
  portionCount: number;
  status: string;
  acceptedAt?: string | null;
  collectedAt?: string | null;
  handedOverAt?: string | null;
  failureReason?: string | null;
}
