// Auto-generated from the reviewed schema — canonical HandlingDeclaration shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface HandlingDeclaration {
  id: string;
  createdAt: string;
  updatedAt: string;
  donationId: string;
  declaredByUserId: string;
  preparationTimeMinutes: number;
  storageMethod: string;
  requiresRefrigeration: boolean;
  allergens?: string | null;
  checklistConfirmed: boolean;
  declaredAt: string;
}
