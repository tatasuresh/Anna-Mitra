// Auto-generated from the reviewed schema — canonical StatusEvent shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface StatusEvent {
  id: string;
  createdAt: string;
  updatedAt: string;
  donationId: string;
  pickupTaskId?: string | null;
  actorUserId: string;
  fromStatus?: string | null;
  toStatus: string;
  reason?: string | null;
}
