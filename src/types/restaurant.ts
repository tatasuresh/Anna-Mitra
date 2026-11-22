// Auto-generated from the reviewed schema — canonical Restaurant shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface Restaurant {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  ownerUserId: string;
  latitude: number;
  longitude: number;
  status: string;
}
