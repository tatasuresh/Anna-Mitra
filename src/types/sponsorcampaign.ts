// Auto-generated from the reviewed schema — canonical SponsorCampaign shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface SponsorCampaign {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  sponsorUserId: string;
  recognitionText?: string | null;
  startsOn: string;
  endsOn: string;
  status: string;
}
