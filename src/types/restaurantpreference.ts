// Auto-generated from the reviewed schema — canonical RestaurantPreference shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface RestaurantPreference {
  id: string;
  createdAt: string;
  updatedAt: string;
  restaurantId: string;
  defaultPortions?: number | null;
  defaultPickupWindowMinutes?: number | null;
  preferredPickupStart?: string | null;
  preferredPickupEnd?: string | null;
  pickupNotes?: string | null;
  updatedByUserId: string;
}
