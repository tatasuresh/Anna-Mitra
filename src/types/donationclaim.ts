// Auto-generated from the reviewed schema — canonical DonationClaim shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface DonationClaim {
  id: string;
  createdAt: string;
  updatedAt: string;
  donationId: string;
  ngoId: string;
  claimedByUserId: string;
  portionsClaimed: number;
  status: string;
  reservedUntil: string;
  portionsReceived?: number | null;
  receivedAt?: string | null;
}
