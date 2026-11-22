// Auto-generated from the reviewed schema — canonical PasswordResetToken shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface PasswordResetToken {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  tokenHash: string;
  requestedAt: string;
  expiresAt: string;
  usedAt?: string | null;
}
