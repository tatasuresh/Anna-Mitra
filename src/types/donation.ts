// Auto-generated from the reviewed schema — canonical Donation shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface Donation {
  id: string;
  createdAt: string;
  updatedAt: string;
  restaurantId: string;
  postedByUserId: string;
  repeatedFromDonationId?: string | null;
  description: string;
  portionsTotal: number;
  portionsRemaining: number;
  pickupLocation: string;
  pickupByAt: string;
  inputMethod: string;
  aiExtracted: boolean;
  photoUrl?: string | null;
  status: string;
  publishedAt?: string | null;
}
