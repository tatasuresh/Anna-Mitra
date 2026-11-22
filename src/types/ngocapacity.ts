// Auto-generated from the reviewed schema — canonical NgoCapacity shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface NgoCapacity {
  id: string;
  createdAt: string;
  updatedAt: string;
  ngoId: string;
  currentNeedPortions: number;
  capacityPortions: number;
  maxPortionsPerClaim: number;
  hasColdStorage: boolean;
  isAvailable: boolean;
}
