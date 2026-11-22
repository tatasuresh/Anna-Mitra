// Auto-generated from the reviewed schema — canonical ImpactReport shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface ImpactReport {
  id: string;
  createdAt: string;
  updatedAt: string;
  periodStart: string;
  periodEnd: string;
  confirmedPortions: number;
  kgPerPortionAssumption: number;
  estimatedWasteAvoidedKg: number;
  illustrativeCost: number;
  currency: string;
  generatedAt: string;
}
