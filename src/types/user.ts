// Auto-generated from the reviewed schema — canonical User shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isDemo: boolean;
  restaurantId?: string | null;
  ngoId?: string | null;
  isAvailable: boolean;
  carryingCapacity?: number | null;
  decidedAt?: string | null;
  decidedByUserId?: string | null;
  lastSignedOutAt?: string | null;
}
