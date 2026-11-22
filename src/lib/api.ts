'use client';

// Auto-generated typed API client — the app's single fetch surface.
// Request bodies are typed against the database schema, so calling an
// endpoint with the wrong field names is a compile error. Do not hand-
// edit — regenerate from the API atlas + schema instead.

import { getToken } from '@/lib/authToken';

// Mock mode: the IDE preview boots before any database exists, so the
// single fetch surface answers locally instead of calling routes that
// would fail on a missing DATABASE_URL. Mirrors the demo session in
// @/lib/authContext so both auth surfaces agree.
// The `process.env.NEXT_PUBLIC_MOCK_MODE` form is deliberate: Next inlines
// that EXACT text at build time. `process.env?.X` or a computed key is not
// matched by the inliner, so it would compile to a lookup that is always
// undefined in the browser bundle — the same way a dynamic
// `process.env['NEXT_PUBLIC_' + name]` once left the preview inspector
// permanently inert. Do not add optional chaining here.
const __NEXEN_IS_MOCK__ =
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_MOCK_MODE === 'true') ||
  (typeof process !== 'undefined' && process.env.MOCK_MODE === 'true') ||
  ((globalThis as unknown as { __NEXEN_MOCK__?: boolean }).__NEXEN_MOCK__ === true);

const __NEXEN_DEMO_USER__ = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'demo@example.com',
  name: 'Demo User',
  role: 'admin',
};

const __NEXEN_MOCK_ROWS__: Record<string, any[]> = {
  "users": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "name": "Demo User",
      "email": "demo@example.com",
      "role": "admin",
      "status": "approved",
      "isDemo": true,
      "restaurantId": "r1",
      "ngoId": "n1",
      "isAvailable": true,
      "carryingCapacity": 3,
      "decidedAt": "2026-01-15T10:00:00Z",
      "decidedByUserId": "00000000-0000-4000-8000-000000000001",
      "lastSignedOutAt": "2026-01-15T10:00:00Z",
      "organisationName": "sample_organisationname_1",
      "passwordChangedAt": "2026-01-15T10:00:00Z",
      "sessionToken": "sample_sessiontoken_1",
      "tokenVersion": 3
    },
    {
      "id": "u1",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "name": "Meera Raghunathan",
      "email": "meera.r@saffronbuffet.in",
      "role": "member",
      "status": "approved",
      "isDemo": false,
      "restaurantId": "r2",
      "ngoId": "n2",
      "isAvailable": false,
      "carryingCapacity": 10,
      "decidedAt": "2026-02-15T10:00:00Z",
      "decidedByUserId": "u1",
      "lastSignedOutAt": "2026-02-15T10:00:00Z",
      "organisationName": "sample_organisationname_2",
      "passwordChangedAt": "2026-02-15T10:00:00Z",
      "sessionToken": "sample_sessiontoken_2",
      "tokenVersion": 10
    },
    {
      "id": "u2",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "name": "Rahul D'Souza",
      "email": "rahul@coraltablechennai.in",
      "role": "viewer",
      "status": "pending",
      "isDemo": true,
      "restaurantId": "restaurant_003",
      "ngoId": "ngo_003",
      "isAvailable": true,
      "carryingCapacity": 17,
      "decidedAt": "2026-03-15T10:00:00Z",
      "decidedByUserId": "u2",
      "lastSignedOutAt": "2026-03-15T10:00:00Z",
      "organisationName": "sample_organisationname_3",
      "passwordChangedAt": "2026-03-15T10:00:00Z",
      "sessionToken": "sample_sessiontoken_3",
      "tokenVersion": 17
    },
    {
      "id": "u3",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "name": "Lakshmi Iyer",
      "email": "lakshmi@velacheryhungerrelief.org",
      "role": "admin",
      "status": "approved",
      "isDemo": false,
      "restaurantId": "r1",
      "ngoId": "n1",
      "isAvailable": false,
      "carryingCapacity": 24,
      "decidedAt": "2026-04-15T10:00:00Z",
      "decidedByUserId": "u3",
      "lastSignedOutAt": "2026-04-15T10:00:00Z",
      "organisationName": "sample_organisationname_4",
      "passwordChangedAt": "2026-04-15T10:00:00Z",
      "sessionToken": "sample_sessiontoken_4",
      "tokenVersion": 24
    },
    {
      "id": "u4",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z",
      "name": "Arun Selvam",
      "email": "arun@pallikaranaishelter.org",
      "role": "member",
      "status": "approved",
      "isDemo": true,
      "restaurantId": "r2",
      "ngoId": "n2",
      "isAvailable": true,
      "carryingCapacity": 31,
      "decidedAt": "2026-05-15T10:00:00Z",
      "decidedByUserId": "u4",
      "lastSignedOutAt": "2026-05-15T10:00:00Z",
      "organisationName": "sample_organisationname_5",
      "passwordChangedAt": "2026-05-15T10:00:00Z",
      "sessionToken": "sample_sessiontoken_5",
      "tokenVersion": 31
    },
    {
      "id": "u5",
      "createdAt": "2026-06-15T10:00:00Z",
      "updatedAt": "2026-06-15T10:00:00Z",
      "name": "Karthik Sundar",
      "email": "karthik.sundar@mail.in",
      "role": "viewer",
      "status": "approved",
      "isDemo": false,
      "restaurantId": "restaurant_003",
      "ngoId": "ngo_003",
      "isAvailable": false,
      "carryingCapacity": 38,
      "decidedAt": "2026-06-15T10:00:00Z",
      "decidedByUserId": "u5",
      "lastSignedOutAt": "2026-06-15T10:00:00Z",
      "organisationName": "sample_organisationname_6",
      "passwordChangedAt": "2026-06-15T10:00:00Z",
      "sessionToken": "sample_sessiontoken_6",
      "tokenVersion": 38
    }
  ],
  "password_reset_tokens": [
    {
      "id": "password_reset_token_001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "userId": "00000000-0000-4000-8000-000000000001",
      "requestedAt": "2026-11-20T18:05:00",
      "expiresAt": "2026-11-20T19:05:00",
      "usedAt": "2026-11-20T18:12:00"
    },
    {
      "id": "password_reset_token_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "userId": "u1",
      "requestedAt": "2026-11-21T09:30:00",
      "expiresAt": "2026-11-21T10:30:00",
      "usedAt": "2026-02-15T10:00:00Z"
    },
    {
      "id": "password_reset_token_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "userId": "u2",
      "requestedAt": "2026-11-21T14:22:00",
      "expiresAt": "2026-11-21T15:22:00",
      "usedAt": "2026-03-15T10:00:00Z"
    },
    {
      "id": "password_reset_token_004",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "userId": "u3",
      "requestedAt": "2026-11-22T07:48:00",
      "expiresAt": "2026-11-22T08:48:00",
      "usedAt": "2026-11-22T07:55:00"
    },
    {
      "id": "password_reset_token_005",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z",
      "userId": "u4",
      "requestedAt": "2026-11-22T11:10:00",
      "expiresAt": "2026-11-22T12:10:00",
      "usedAt": "2026-05-15T10:00:00Z"
    }
  ],
  "restaurants": [
    {
      "id": "r1",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "name": "Saffron Buffet",
      "ownerUserId": "00000000-0000-4000-8000-000000000001",
      "latitude": "sample_latitude_1",
      "longitude": "sample_longitude_1",
      "status": "active"
    },
    {
      "id": "r2",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "name": "Coral Table Kitchen",
      "ownerUserId": "u1",
      "latitude": "sample_latitude_2",
      "longitude": "sample_longitude_2",
      "status": "pending"
    },
    {
      "id": "restaurant_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "name": "Saffron Buffet",
      "ownerUserId": "u2",
      "latitude": "sample_latitude_3",
      "longitude": "sample_longitude_3",
      "status": "archived"
    }
  ],
  "restaurant_preferences": [
    {
      "id": "p1",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "restaurantId": "r1",
      "defaultPortions": 3,
      "preferredPickupStart": "sample_preferredpickupstart_1",
      "preferredPickupEnd": "sample_preferredpickupend_1",
      "pickupNotes": "sample_pickupnotes_1",
      "defaultPickupWindow": "sample_defaultpickupwindow_1",
      "defaultPickupWindowMinutes": 3,
      "preferredFoodTypes": {},
      "updatedByUserId": "00000000-0000-4000-8000-000000000001"
    },
    {
      "id": "restaurant_preference_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "restaurantId": "r2",
      "defaultPortions": 10,
      "preferredPickupStart": "sample_preferredpickupstart_2",
      "preferredPickupEnd": "sample_preferredpickupend_2",
      "pickupNotes": "sample_pickupnotes_2",
      "defaultPickupWindow": "sample_defaultpickupwindow_2",
      "defaultPickupWindowMinutes": 10,
      "preferredFoodTypes": {},
      "updatedByUserId": "u1"
    },
    {
      "id": "restaurant_preference_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "restaurantId": "restaurant_003",
      "defaultPortions": 17,
      "preferredPickupStart": "sample_preferredpickupstart_3",
      "preferredPickupEnd": "sample_preferredpickupend_3",
      "pickupNotes": "sample_pickupnotes_3",
      "defaultPickupWindow": "sample_defaultpickupwindow_3",
      "defaultPickupWindowMinutes": 17,
      "preferredFoodTypes": {},
      "updatedByUserId": "u2"
    }
  ],
  "ngos": [
    {
      "id": "n1",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "name": "Velachery Hunger Relief Trust",
      "latitude": "sample_latitude_1",
      "longitude": "sample_longitude_1",
      "serviceRadiusKm": "sample_serviceradiuskm_1",
      "status": "active"
    },
    {
      "id": "n2",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "name": "Pallikaranai Shelter Kitchen",
      "latitude": "sample_latitude_2",
      "longitude": "sample_longitude_2",
      "serviceRadiusKm": "sample_serviceradiuskm_2",
      "status": "pending"
    },
    {
      "id": "ngo_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "name": "Velachery Hunger Relief Trust",
      "latitude": "sample_latitude_3",
      "longitude": "sample_longitude_3",
      "serviceRadiusKm": "sample_serviceradiuskm_3",
      "status": "archived"
    }
  ],
  "ngo_capacities": [
    {
      "id": "ngo_capacity_001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "ngoId": "n1",
      "currentNeedPortions": 60,
      "capacityPortions": 80,
      "maxPortionsPerClaim": 40,
      "hasColdStorage": true,
      "isAvailable": true
    },
    {
      "id": "ngo_capacity_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "ngoId": "n2",
      "currentNeedPortions": 40,
      "capacityPortions": 50,
      "maxPortionsPerClaim": 25,
      "hasColdStorage": false,
      "isAvailable": false
    },
    {
      "id": "ngo_capacity_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "ngoId": "ngo_003",
      "currentNeedPortions": 35,
      "capacityPortions": 60,
      "maxPortionsPerClaim": 30,
      "hasColdStorage": true,
      "isAvailable": true
    },
    {
      "id": "ngo_capacity_004",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "ngoId": "n1",
      "currentNeedPortions": 20,
      "capacityPortions": 30,
      "maxPortionsPerClaim": 15,
      "hasColdStorage": false,
      "isAvailable": true
    },
    {
      "id": "ngo_capacity_005",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z",
      "ngoId": "n2",
      "currentNeedPortions": 55,
      "capacityPortions": 70,
      "maxPortionsPerClaim": 35,
      "hasColdStorage": true,
      "isAvailable": false
    }
  ],
  "donations": [
    {
      "id": "d1",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "restaurantId": "r1",
      "postedByUserId": "00000000-0000-4000-8000-000000000001",
      "repeatedFromDonationId": "d1",
      "sponsorCampaignId": "sponsor_campaign_001",
      "description": "Sample description for record 1",
      "portionsTotal": 3,
      "portionsRemaining": 3,
      "confirmedPortions": 3,
      "pickupLocation": "sample_pickuplocation_1",
      "pickupByAt": "2026-01-15T10:00:00Z",
      "inputMethod": "sample_inputmethod_1",
      "aiExtracted": true,
      "photoUrl": "https://i.pravatar.cc/150?img=1",
      "status": "claimed",
      "publishedAt": "2026-01-15T10:00:00Z"
    },
    {
      "id": "d2",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "restaurantId": "r1",
      "postedByUserId": "u1",
      "repeatedFromDonationId": "d2",
      "sponsorCampaignId": "sponsor_campaign_002",
      "description": "Sample description for record 2",
      "portionsTotal": 10,
      "portionsRemaining": 10,
      "confirmedPortions": 10,
      "pickupLocation": "sample_pickuplocation_2",
      "pickupByAt": "2026-02-15T10:00:00Z",
      "inputMethod": "sample_inputmethod_2",
      "aiExtracted": false,
      "photoUrl": "https://i.pravatar.cc/150?img=2",
      "status": "published",
      "publishedAt": "2026-02-15T10:00:00Z"
    },
    {
      "id": "d3",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "restaurantId": "r1",
      "postedByUserId": "u2",
      "repeatedFromDonationId": "d3",
      "sponsorCampaignId": "sponsor_campaign_003",
      "description": "Sample description for record 3",
      "portionsTotal": 17,
      "portionsRemaining": 17,
      "confirmedPortions": 17,
      "pickupLocation": "sample_pickuplocation_3",
      "pickupByAt": "2026-03-15T10:00:00Z",
      "inputMethod": "sample_inputmethod_3",
      "aiExtracted": true,
      "photoUrl": "https://i.pravatar.cc/150?img=3",
      "status": "confirmed",
      "publishedAt": "2026-03-15T10:00:00Z"
    },
    {
      "id": "d4",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "restaurantId": "r1",
      "postedByUserId": "u3",
      "repeatedFromDonationId": "d4",
      "sponsorCampaignId": "sponsor_campaign_004",
      "description": "Sample description for record 4",
      "portionsTotal": 24,
      "portionsRemaining": 24,
      "confirmedPortions": 24,
      "pickupLocation": "sample_pickuplocation_4",
      "pickupByAt": "2026-04-15T10:00:00Z",
      "inputMethod": "sample_inputmethod_4",
      "aiExtracted": false,
      "photoUrl": "https://i.pravatar.cc/150?img=4",
      "status": "expired",
      "publishedAt": "2026-04-15T10:00:00Z"
    },
    {
      "id": "d5",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z",
      "restaurantId": "r1",
      "postedByUserId": "u4",
      "repeatedFromDonationId": "d5",
      "sponsorCampaignId": "sponsor_campaign_005",
      "description": "Sample description for record 5",
      "portionsTotal": 31,
      "portionsRemaining": 31,
      "confirmedPortions": 31,
      "pickupLocation": "sample_pickuplocation_5",
      "pickupByAt": "2026-05-15T10:00:00Z",
      "inputMethod": "sample_inputmethod_5",
      "aiExtracted": true,
      "photoUrl": "https://i.pravatar.cc/150?img=5",
      "status": "published",
      "publishedAt": "2026-05-15T10:00:00Z"
    },
    {
      "id": "d6",
      "createdAt": "2026-06-15T10:00:00Z",
      "updatedAt": "2026-06-15T10:00:00Z",
      "restaurantId": "r1",
      "postedByUserId": "u5",
      "repeatedFromDonationId": "d6",
      "sponsorCampaignId": "sponsor_campaign_001",
      "description": "Sample description for record 6",
      "portionsTotal": 38,
      "portionsRemaining": 38,
      "confirmedPortions": 38,
      "pickupLocation": "sample_pickuplocation_6",
      "pickupByAt": "2026-06-15T10:00:00Z",
      "inputMethod": "sample_inputmethod_6",
      "aiExtracted": false,
      "photoUrl": "https://i.pravatar.cc/150?img=6",
      "status": "delivered",
      "publishedAt": "2026-06-15T10:00:00Z"
    }
  ],
  "handling_declarations": [
    {
      "id": "handling_declaration_001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "donationId": "d1",
      "declaredByUserId": "00000000-0000-4000-8000-000000000001",
      "preparationTimeMinutes": 75,
      "preparationTimeAt": "2026-11-22T12:40:00",
      "preparedAt": "2026-11-22T12:40:00",
      "storageMethod": "hot_held",
      "requiresRefrigeration": true,
      "allergens": "Dairy (raita), nuts (garnish)",
      "checklistConfirmed": true,
      "declaredAt": "2026-11-22T12:50:00",
      "status": "verified"
    },
    {
      "id": "handling_declaration_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "donationId": "d2",
      "declaredByUserId": "u1",
      "preparationTimeMinutes": 90,
      "preparationTimeAt": "2026-11-22T11:30:00",
      "preparedAt": "2026-11-22T11:30:00",
      "storageMethod": "refrigerated",
      "requiresRefrigeration": true,
      "allergens": "Soy, gluten (soy sauce)",
      "checklistConfirmed": true,
      "declaredAt": "2026-11-22T11:50:00",
      "status": "verified"
    },
    {
      "id": "handling_declaration_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "donationId": "d3",
      "declaredByUserId": "u2",
      "preparationTimeMinutes": 120,
      "preparationTimeAt": "2026-11-21T08:30:00",
      "preparedAt": "2026-11-21T08:30:00",
      "storageMethod": "hot_held",
      "requiresRefrigeration": true,
      "allergens": "Lentils (urad dal); mustard in sambar",
      "checklistConfirmed": true,
      "declaredAt": "2026-11-21T09:00:00",
      "status": "verified"
    },
    {
      "id": "handling_declaration_004",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "donationId": "d4",
      "declaredByUserId": "u3",
      "preparationTimeMinutes": 30,
      "preparationTimeAt": "2026-04-15T10:00:00Z",
      "preparedAt": "2026-04-15T10:00:00Z",
      "storageMethod": "hot_held",
      "requiresRefrigeration": true,
      "allergens": "Gluten (pav), dairy (butter)",
      "checklistConfirmed": false,
      "declaredAt": "2026-11-20T11:00:00",
      "status": "flagged"
    },
    {
      "id": "handling_declaration_005",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z",
      "donationId": "d5",
      "declaredByUserId": "u4",
      "preparationTimeMinutes": 45,
      "preparationTimeAt": "2026-05-15T10:00:00Z",
      "preparedAt": "2026-05-15T10:00:00Z",
      "storageMethod": "refrigerated",
      "requiresRefrigeration": true,
      "allergens": "Dairy (paneer, butter), gluten (naan)",
      "checklistConfirmed": true,
      "declaredAt": "2026-11-22T09:30:00",
      "status": "pending_check"
    },
    {
      "id": "handling_declaration_006",
      "createdAt": "2026-06-15T10:00:00Z",
      "updatedAt": "2026-06-15T10:00:00Z",
      "donationId": "d6",
      "declaredByUserId": "u5",
      "preparationTimeMinutes": 60,
      "preparationTimeAt": "2026-06-15T10:00:00Z",
      "preparedAt": "2026-06-15T10:00:00Z",
      "storageMethod": "refrigerated",
      "requiresRefrigeration": true,
      "allergens": "Fish, mustard seed",
      "checklistConfirmed": true,
      "declaredAt": "2026-11-18T10:00:00",
      "status": "verified"
    }
  ],
  "donation_claims": [
    {
      "id": "donation_claim_001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "donationId": "d1",
      "ngoId": "n1",
      "claimedByUserId": "00000000-0000-4000-8000-000000000001",
      "portionsClaimed": 40,
      "status": "reserved",
      "reservedUntil": "2026-11-22T15:50:00",
      "portionsReceived": 3,
      "receivedAt": "2026-01-15T10:00:00Z",
      "portionsReleased": 0
    },
    {
      "id": "donation_claim_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "donationId": "d2",
      "ngoId": "n2",
      "claimedByUserId": "u1",
      "portionsClaimed": 30,
      "status": "confirmed",
      "reservedUntil": "2026-11-21T20:00:00",
      "portionsReceived": 30,
      "receivedAt": "2026-11-21T20:40:00",
      "portionsReleased": 0
    },
    {
      "id": "donation_claim_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "donationId": "d3",
      "ngoId": "ngo_003",
      "claimedByUserId": "u2",
      "portionsClaimed": 35,
      "status": "confirmed",
      "reservedUntil": "2026-11-19T18:00:00",
      "portionsReceived": 35,
      "receivedAt": "2026-11-19T18:40:00",
      "portionsReleased": 0
    },
    {
      "id": "donation_claim_004",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "donationId": "d4",
      "ngoId": "n1",
      "claimedByUserId": "u3",
      "portionsClaimed": 18,
      "status": "expired",
      "reservedUntil": "2026-11-20T20:00:00",
      "portionsReceived": 24,
      "receivedAt": "2026-04-15T10:00:00Z",
      "portionsReleased": 18
    },
    {
      "id": "donation_claim_005",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z",
      "donationId": "d5",
      "ngoId": "n2",
      "claimedByUserId": "u4",
      "portionsClaimed": 50,
      "status": "reserved",
      "reservedUntil": "2026-11-23T13:30:00",
      "portionsReceived": 31,
      "receivedAt": "2026-05-15T10:00:00Z",
      "portionsReleased": 0
    },
    {
      "id": "donation_claim_006",
      "createdAt": "2026-06-15T10:00:00Z",
      "updatedAt": "2026-06-15T10:00:00Z",
      "donationId": "d6",
      "ngoId": "ngo_003",
      "claimedByUserId": "u5",
      "portionsClaimed": 15,
      "status": "released",
      "reservedUntil": "2026-11-22T12:30:00",
      "portionsReceived": 38,
      "receivedAt": "2026-06-15T10:00:00Z",
      "portionsReleased": 15
    }
  ],
  "pickup_tasks": [
    {
      "id": "pickup_task_001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "donationId": "d1",
      "claimId": "donation_claim_001",
      "volunteerUserId": "00000000-0000-4000-8000-000000000001",
      "portionCount": 40,
      "status": "accepted",
      "acceptedAt": "2026-11-22T14:10:00",
      "collectedAt": "2026-01-15T10:00:00Z",
      "handedOverAt": "2026-01-15T10:00:00Z",
      "failureReason": "sample_failurereason_1"
    },
    {
      "id": "pickup_task_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "donationId": "d2",
      "claimId": "donation_claim_002",
      "volunteerUserId": "u1",
      "portionCount": 30,
      "status": "handed_over",
      "acceptedAt": "2026-11-21T20:05:00",
      "collectedAt": "2026-11-21T20:20:00",
      "handedOverAt": "2026-11-21T20:40:00",
      "failureReason": "sample_failurereason_2"
    },
    {
      "id": "pickup_task_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "donationId": "d3",
      "claimId": "donation_claim_003",
      "volunteerUserId": "u2",
      "portionCount": 35,
      "status": "handed_over",
      "acceptedAt": "2026-11-19T17:10:00",
      "collectedAt": "2026-11-19T17:30:00",
      "handedOverAt": "2026-11-19T18:40:00",
      "failureReason": "sample_failurereason_3"
    },
    {
      "id": "pickup_task_004",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "donationId": "d4",
      "claimId": "donation_claim_004",
      "volunteerUserId": "u3",
      "portionCount": 18,
      "status": "failed",
      "acceptedAt": "2026-11-20T20:10:00",
      "collectedAt": "2026-04-15T10:00:00Z",
      "handedOverAt": "2026-04-15T10:00:00Z",
      "failureReason": "Food not chilled in time; refused at pickup."
    },
    {
      "id": "pickup_task_005",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z",
      "donationId": "d5",
      "claimId": "donation_claim_005",
      "volunteerUserId": "u4",
      "portionCount": 25,
      "status": "open",
      "acceptedAt": "2026-05-15T10:00:00Z",
      "collectedAt": "2026-05-15T10:00:00Z",
      "handedOverAt": "2026-05-15T10:00:00Z",
      "failureReason": "sample_failurereason_5"
    },
    {
      "id": "pickup_task_006",
      "createdAt": "2026-06-15T10:00:00Z",
      "updatedAt": "2026-06-15T10:00:00Z",
      "donationId": "d6",
      "claimId": "donation_claim_006",
      "volunteerUserId": "u5",
      "portionCount": 22,
      "status": "open",
      "acceptedAt": "2026-06-15T10:00:00Z",
      "collectedAt": "2026-06-15T10:00:00Z",
      "handedOverAt": "2026-06-15T10:00:00Z",
      "failureReason": "sample_failurereason_6"
    }
  ],
  "status_events": [
    {
      "id": "e1",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "donationId": "d1",
      "pickupTaskId": "pickup_task_001",
      "actorUserId": "00000000-0000-4000-8000-000000000001",
      "fromStatus": "sample_fromstatus_1",
      "toStatus": "sample_tostatus_1",
      "reason": "sample_reason_1",
      "eventType": "sample_eventtype_1",
      "sequenceNo": 3,
      "recordType": "sample_recordtype_1",
      "recordId": "record_001"
    },
    {
      "id": "e2",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "donationId": "d1",
      "pickupTaskId": "pickup_task_002",
      "actorUserId": "u1",
      "fromStatus": "sample_fromstatus_2",
      "toStatus": "sample_tostatus_2",
      "reason": "sample_reason_2",
      "eventType": "sample_eventtype_2",
      "sequenceNo": 10,
      "recordType": "sample_recordtype_2",
      "recordId": "record_002"
    },
    {
      "id": "e3",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "donationId": "d2",
      "pickupTaskId": "pickup_task_003",
      "actorUserId": "u2",
      "fromStatus": "sample_fromstatus_3",
      "toStatus": "sample_tostatus_3",
      "reason": "sample_reason_3",
      "eventType": "sample_eventtype_3",
      "sequenceNo": 17,
      "recordType": "sample_recordtype_3",
      "recordId": "record_003"
    },
    {
      "id": "e4",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "donationId": "d3",
      "pickupTaskId": "pickup_task_004",
      "actorUserId": "u3",
      "fromStatus": "sample_fromstatus_4",
      "toStatus": "sample_tostatus_4",
      "reason": "sample_reason_4",
      "eventType": "sample_eventtype_4",
      "sequenceNo": 24,
      "recordType": "sample_recordtype_4",
      "recordId": "record_004"
    },
    {
      "id": "e5",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z",
      "donationId": "d3",
      "pickupTaskId": "pickup_task_005",
      "actorUserId": "u4",
      "fromStatus": "sample_fromstatus_5",
      "toStatus": "sample_tostatus_5",
      "reason": "sample_reason_5",
      "eventType": "sample_eventtype_5",
      "sequenceNo": 31,
      "recordType": "sample_recordtype_5",
      "recordId": "record_005"
    },
    {
      "id": "e6",
      "createdAt": "2026-06-15T10:00:00Z",
      "updatedAt": "2026-06-15T10:00:00Z",
      "donationId": "d4",
      "pickupTaskId": "pickup_task_006",
      "actorUserId": "u5",
      "fromStatus": "sample_fromstatus_6",
      "toStatus": "sample_tostatus_6",
      "reason": "sample_reason_6",
      "eventType": "sample_eventtype_6",
      "sequenceNo": 38,
      "recordType": "sample_recordtype_6",
      "recordId": "record_006"
    }
  ],
  "sponsor_campaigns": [
    {
      "id": "sponsor_campaign_001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "name": "Velachery Winter Meals 2026",
      "sponsorUserId": "00000000-0000-4000-8000-000000000001",
      "recognitionText": "Supported by Tamarind Foods Foundation",
      "startsOn": "2026-11-01T00:00:00",
      "endsOn": "2026-12-31T23:59:00",
      "status": "active",
      "costPerPortion": 25.0
    },
    {
      "id": "sponsor_campaign_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "name": "Pallikaranai Night Kitchen Fund",
      "sponsorUserId": "u1",
      "recognitionText": "With thanks to Coromandel Logistics Pvt Ltd",
      "startsOn": "2026-10-01T00:00:00",
      "endsOn": "2026-11-15T23:59:00",
      "status": "ended",
      "costPerPortion": 30.0
    },
    {
      "id": "sponsor_campaign_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "name": "Monsoon Relief Partners",
      "sponsorUserId": "u2",
      "recognitionText": "Funded by Kaveri Textiles CSR",
      "startsOn": "2027-01-01T00:00:00",
      "endsOn": "2027-03-31T23:59:00",
      "status": "draft",
      "costPerPortion": 28.0
    },
    {
      "id": "sponsor_campaign_004",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "name": "Hungerless Fridays",
      "sponsorUserId": "u3",
      "recognitionText": "Thanks to the staff of Nilgiri Dairy",
      "startsOn": "2026-09-01T00:00:00",
      "endsOn": "2026-09-30T23:59:00",
      "status": "ended",
      "costPerPortion": 20.0
    },
    {
      "id": "sponsor_campaign_005",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z",
      "name": "Festival Feeding Drive",
      "sponsorUserId": "u4",
      "recognitionText": "Sponsored by Greenleaf Insurance Group",
      "startsOn": "2026-12-15T00:00:00",
      "endsOn": "2027-01-15T23:59:00",
      "status": "draft",
      "costPerPortion": 22.5
    }
  ],
  "impact_reports": [
    {
      "id": "impact_report_001",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "periodStart": "2026-10-01T00:00:00",
      "periodEnd": "2026-10-31T23:59:00",
      "confirmedPortions": 210,
      "kgPerPortionAssumption": 0.4,
      "estimatedWasteAvoidedKg": 84.0,
      "illustrativeCost": 5250.0,
      "currency": "INR",
      "generatedAt": "2026-11-01T09:00:00"
    },
    {
      "id": "impact_report_002",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z",
      "periodStart": "2026-11-01T00:00:00",
      "periodEnd": "2026-11-15T23:59:00",
      "confirmedPortions": 120,
      "kgPerPortionAssumption": 0.4,
      "estimatedWasteAvoidedKg": 48.0,
      "illustrativeCost": 3000.0,
      "currency": "INR",
      "generatedAt": "2026-11-16T09:00:00"
    },
    {
      "id": "impact_report_003",
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z",
      "periodStart": "2026-11-16T00:00:00",
      "periodEnd": "2026-11-22T23:59:00",
      "confirmedPortions": 65,
      "kgPerPortionAssumption": 0.4,
      "estimatedWasteAvoidedKg": 26.0,
      "illustrativeCost": 1625.0,
      "currency": "INR",
      "generatedAt": "2026-11-23T09:00:00"
    },
    {
      "id": "impact_report_004",
      "createdAt": "2026-04-15T10:00:00Z",
      "updatedAt": "2026-04-15T10:00:00Z",
      "periodStart": "2026-11-23T00:00:00",
      "periodEnd": "2026-11-29T23:59:00",
      "confirmedPortions": 40,
      "kgPerPortionAssumption": 0.4,
      "estimatedWasteAvoidedKg": 16.0,
      "illustrativeCost": 1000.0,
      "currency": "INR",
      "generatedAt": "2026-11-30T09:00:00"
    }
  ]
};
__NEXEN_MOCK_ROWS__["passwordResetTokens"] = __NEXEN_MOCK_ROWS__["password_reset_tokens"];
__NEXEN_MOCK_ROWS__["password-reset-tokens"] = __NEXEN_MOCK_ROWS__["password_reset_tokens"];
__NEXEN_MOCK_ROWS__["restaurantPreferences"] = __NEXEN_MOCK_ROWS__["restaurant_preferences"];
__NEXEN_MOCK_ROWS__["restaurant-preferences"] = __NEXEN_MOCK_ROWS__["restaurant_preferences"];
__NEXEN_MOCK_ROWS__["ngoCapacities"] = __NEXEN_MOCK_ROWS__["ngo_capacities"];
__NEXEN_MOCK_ROWS__["ngo-capacities"] = __NEXEN_MOCK_ROWS__["ngo_capacities"];
__NEXEN_MOCK_ROWS__["handlingDeclarations"] = __NEXEN_MOCK_ROWS__["handling_declarations"];
__NEXEN_MOCK_ROWS__["handling-declarations"] = __NEXEN_MOCK_ROWS__["handling_declarations"];
__NEXEN_MOCK_ROWS__["donation-claims"] = __NEXEN_MOCK_ROWS__["donation_claims"];
__NEXEN_MOCK_ROWS__["donationClaims"] = __NEXEN_MOCK_ROWS__["donation_claims"];
__NEXEN_MOCK_ROWS__["pickup-tasks"] = __NEXEN_MOCK_ROWS__["pickup_tasks"];
__NEXEN_MOCK_ROWS__["pickupTasks"] = __NEXEN_MOCK_ROWS__["pickup_tasks"];
__NEXEN_MOCK_ROWS__["statusEvents"] = __NEXEN_MOCK_ROWS__["status_events"];
__NEXEN_MOCK_ROWS__["status-events"] = __NEXEN_MOCK_ROWS__["status_events"];
__NEXEN_MOCK_ROWS__["sponsorCampaigns"] = __NEXEN_MOCK_ROWS__["sponsor_campaigns"];
__NEXEN_MOCK_ROWS__["sponsor-campaigns"] = __NEXEN_MOCK_ROWS__["sponsor_campaigns"];
__NEXEN_MOCK_ROWS__["impact-reports"] = __NEXEN_MOCK_ROWS__["impact_reports"];
__NEXEN_MOCK_ROWS__["impactReports"] = __NEXEN_MOCK_ROWS__["impact_reports"];

// ── Sample-data changes: kept for this browser tab ──────────────────────────
const __NEXEN_SAMPLE_KEY__ = 'nexen.sample.356c1e37caf2';
let __sampleLoaded = false;
const __sampleCreated = new Set<string>();
const __sampleAnswered = new WeakMap<object, any>();
function __sampleTables(): string[] {
  const keys = Object.keys(__NEXEN_MOCK_ROWS__);
  return keys.filter((k, i) => keys.findIndex((j) => __NEXEN_MOCK_ROWS__[j] === __NEXEN_MOCK_ROWS__[k]) === i);
}
function __sampleLoad(): void {
  if (__sampleLoaded) return;
  __sampleLoaded = true;
  try {
    const saved = JSON.parse(globalThis.sessionStorage?.getItem(__NEXEN_SAMPLE_KEY__) ?? 'null');
    if (!saved || typeof saved !== 'object') return;
    for (const t of __sampleTables()) {
      const kept = saved.rows?.[t];
      if (Array.isArray(kept)) __NEXEN_MOCK_ROWS__[t].splice(0, __NEXEN_MOCK_ROWS__[t].length, ...kept);
    }
    for (const id of Array.isArray(saved.created) ? saved.created : []) __sampleCreated.add(String(id));
  } catch { /* blocked or unreadable storage: the sample rows as shipped */ }
}
function __sampleSave(): void {
  try {
    const rows: Record<string, any[]> = {};
    for (const t of __sampleTables()) rows[t] = __NEXEN_MOCK_ROWS__[t];
    globalThis.sessionStorage?.setItem(__NEXEN_SAMPLE_KEY__, JSON.stringify({ rows, created: Array.from(__sampleCreated) }));
  } catch { /* full or blocked: kept until the page reloads */ }
  // The IDE preview says, once, that this went to sample data only.
  try {
    if (typeof window !== 'undefined' && window.parent !== window) window.parent.postMessage({ type: 'nexen:sample-write' }, '*');
  } catch { /* no preview around this page */ }
}
function __sampleFind(all: any[], id: string): number {
  return all.findIndex((r) => String(r.id) === String(id) || String(r.slug) === String(id));
}
/** A field the person did not fill, as a new row of theirs would hold it. Links and
 *  status-like values keep a sample row's (pages read them); its text, dates and counts do
 *  not: a new habit showed "Sample description for record 1" and its reminder. */
function __sampleBlank(k: string, v: any): any {
  if (/(Id|_id)$/.test(k) || /status|state|role|type|kind|priority|category|level|currency|unit|visibility/i.test(k)) return v;
  if (Array.isArray(v)) return [];
  if (v && typeof v === 'object') return v;
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  return null;
}
/** A new row: a sample row's fields (what pages read), the person's values in them. */
function __sampleInsert(table: string, body: any, links?: Record<string, string>): any {
  if (body && typeof body === 'object' && __sampleAnswered.has(body)) return __sampleAnswered.get(body);
  __sampleLoad();
  const all = __NEXEN_MOCK_ROWS__[table] ?? (__NEXEN_MOCK_ROWS__[table] = []);
  const like: any = all[0] ?? {};
  const now = new Date().toISOString();
  const row: any = {};
  for (const [k, v] of Object.entries(like)) row[k] = __sampleBlank(k, v);
  Object.assign(row, body && typeof body === 'object' ? body : {}, links ?? {});
  row.id = typeof like.id === 'number'
    ? all.reduce((m: number, r: any) => Math.max(m, Number(r.id) || 0), 0) + 1
    : (globalThis.crypto?.randomUUID?.() ?? `sample-${Date.now().toString(36)}`);
  if ('slug' in like && !(body && body.slug)) row.slug = String(row.id);
  for (const k of ['createdAt', 'updatedAt', 'created_at', 'updated_at']) if (k in like) row[k] = now;
  all.unshift(row);
  __sampleCreated.add(String(row.id));
  if (body && typeof body === 'object') __sampleAnswered.set(body, row);
  __sampleSave();
  return row;
}
function __sampleUpdate(table: string, id: string, body: any): any {
  __sampleLoad();
  const all = __NEXEN_MOCK_ROWS__[table] ?? [];
  const changes: any = { ...(body && typeof body === 'object' ? body : {}) };
  delete changes.id;
  const i = __sampleFind(all, id);
  if (i < 0) return { ...__mockRow(table, id), ...changes };
  Object.assign(all[i], changes);
  for (const k of ['updatedAt', 'updated_at']) if (k in all[i]) all[i][k] = new Date().toISOString();
  __sampleSave();
  return all[i];
}
function __sampleDelete(table: string, id: string): undefined {
  __sampleLoad();
  const all = __NEXEN_MOCK_ROWS__[table] ?? [];
  const i = __sampleFind(all, id);
  if (i >= 0) {
    all.splice(i, 1);
    __sampleSave();
  }
  return undefined;
}
/** A write no designed endpoint answers, applied to the table its path names. */
function __sampleWrite(method: string, path: string, body: any): any {
  const segs = path.split('/').filter(Boolean);
  for (let i = segs.length - 1; i >= 0; i -= 1) {
    if (!__NEXEN_MOCK_ROWS__[segs[i]]) continue;
    if (i === segs.length - 1 && method === 'POST') return __sampleInsert(segs[i], body);
    if (i === segs.length - 2 && (method === 'PATCH' || method === 'PUT')) return __sampleUpdate(segs[i], decodeURIComponent(segs[i + 1]), body);
    if (i === segs.length - 2 && method === 'DELETE') return __sampleDelete(segs[i], decodeURIComponent(segs[i + 1]));
    return undefined;
  }
  return undefined;
}

function __mockRows(table: string, where?: Record<string, string>): any[] {
  __sampleLoad();
  const all = __NEXEN_MOCK_ROWS__[table] ?? [];
  if (!where || !Object.keys(where).length) return all;
  const hit = all.filter((r) => Object.entries(where).every(([k, v]) => String(r[k]) === String(v)));
  // A parent added in this tab has no children yet: none, not every sample row.
  return hit.length || Object.values(where).some((v) => __sampleCreated.has(String(v))) ? hit : all;
}

function __mockRow(table: string, id?: string): any {
  __sampleLoad();
  const all = __NEXEN_MOCK_ROWS__[table] ?? [];
  return (id !== undefined && all.find((r) => String(r.id) === String(id) || String(r.slug) === String(id))) || all[0] || {};
}

/** One answer per designed endpoint, in the shape the API Layer declares for it. */
const __NEXEN_MOCK_ROUTES__: Array<[string, RegExp, (p: string[], body: any) => any]> = [
  ["GET", /^\/api\/my\/volunteer-availability$/, (p, body) => ({ "is_available": true, "carrying_capacity": 3 })],
  ["PATCH", /^\/api\/my\/volunteer-availability$/, (p, body) => ({ "is_available": true, "carrying_capacity": 3 })],
  ["GET", /^\/api\/admin\/operations-summary$/, (p, body) => ({ "pending_approvals": 3, "active_rescues": 3, "failed_assignments": 3, "suspended_users": 3 })],
  ["GET", /^\/api\/admin\/sponsor-campaigns$/, (p, body) => __mockRows("sponsor_campaigns")],
  ["POST", /^\/api\/admin\/sponsor-campaigns$/, (p, body) => __sampleInsert("sponsor_campaigns", body)],
  ["GET", /^\/api\/admin\/donation-claims$/, (p, body) => __mockRows("donation_claims")],
  ["GET", /^\/api\/my\/sponsor-campaigns$/, (p, body) => __mockRows("sponsor_campaigns")],
  ["POST", /^\/api\/my\/sponsor-campaigns$/, (p, body) => __sampleInsert("sponsor_campaigns", body)],
  ["GET", /^\/api\/admin\/ngo-capacities$/, (p, body) => __mockRows("ngo_capacities")],
  ["GET", /^\/api\/admin\/impact-reports$/, (p, body) => __mockRows("impact_reports")],
  ["POST", /^\/api\/admin\/impact-reports$/, (p, body) => __sampleInsert("impact_reports", body)],
  ["GET", /^\/api\/my\/donation-matches$/, (p, body) => ({ "matches": [({ "donation": __mockRow("donations"), "distance_km": 3, "portions_available": 3, "match_reasons": ["sample_match_reasons_1"] })], "alerts": [({ "donation_id": "donation__001", "message": "Done", "created_at": "2026-01-15T10:00:00Z" })] })],
  ["GET", /^\/api\/my\/donor-dashboard$/, (p, body) => ({ "published": 3, "claimed": 3, "delivered": 3, "recent_donations": __mockRows("donations") })],
  ["GET", /^\/api\/my\/donation-claims$/, (p, body) => __mockRows("donation_claims")],
  ["GET", /^\/api\/admin\/pickup-tasks$/, (p, body) => __mockRows("pickup_tasks")],
  ["GET", /^\/api\/donations\/eligible$/, (p, body) => ({ "donations": [({ "donation": __mockRow("donations"), "distance_km": 3, "match_explanation": "sample_match_explanation_1" })], "alerts": [({ "message": "Done", "donation_id": "donation__001" })] })],
  ["GET", /^\/api\/admin\/restaurants$/, (p, body) => __mockRows("restaurants")],
  ["GET", /^\/api\/pickup-tasks\/open$/, (p, body) => __mockRows("pickup_tasks")],
  ["POST", /^\/api\/admin\/restaurants$/, (p, body) => __sampleInsert("restaurants", body)],
  ["GET", /^\/api\/my\/notifications$/, (p, body) => []],
  ["GET", /^\/api\/my\/availability$/, (p, body) => ({ "is_available": true, "need_portions": 3, "capacity_portions": 3, "carrying_capacity_portions": 3 })],
  ["PATCH", /^\/api\/my\/availability$/, (p, body) => ({ "is_available": true, "need_portions": 3, "capacity_portions": 3, "carrying_capacity_portions": 3 })],
  ["GET", /^\/api\/donation-matches$/, (p, body) => [({ "donation": __mockRow("donations"), "restaurant": __mockRow("restaurants"), "portions_available": 3, "match_explanation": "sample_match_explanation_1" })]],
  ["GET", /^\/api\/admin\/donations$/, (p, body) => __mockRows("donations")],
  ["GET", /^\/api\/impact-dashboard$/, (p, body) => ({ "confirmed_portions_delivered": 3, "estimated_waste_avoided_kg": 3, "illustrative_cost": 3, "assumptions": ({ "kg_per_portion": 3, "cost_basis": "sample_cost_basis_1", "is_illustrative": true }) })],
  ["GET", /^\/api\/my\/pickup-tasks$/, (p, body) => __mockRows("pickup_tasks")],
  ["GET", /^\/api\/my\/ngo-capacity$/, (p, body) => __mockRow("ngo_capacities")],
  ["POST", /^\/api\/my\/ngo-capacity$/, (p, body) => __sampleInsert("ngo_capacities", body)],
  ["PATCH", /^\/api\/my\/ngo-capacity$/, (p, body) => ({ ...__mockRow("ngo_capacities"), ...body })],
  ["GET", /^\/api\/my\/restaurants$/, (p, body) => __mockRows("restaurants")],
  ["POST", /^\/api\/my\/restaurants$/, (p, body) => __sampleInsert("restaurants", body)],
  ["GET", /^\/api\/impact-reports$/, (p, body) => __mockRows("impact_reports")],
  ["POST", /^\/api\/my\/donations$/, (p, body) => __sampleInsert("donations", body)],
  ["GET", /^\/api\/my\/donations$/, (p, body) => __mockRows("donations")],
  ["GET", /^\/api\/my\/dashboard$/, (p, body) => ({ "restaurant": __mockRow("restaurants"), "donations_published_this_month": 3, "recent_donations": __mockRows("donations") })],
  ["GET", /^\/api\/admin\/users$/, (p, body) => __mockRows("users")],
  ["POST", /^\/api\/admin\/users$/, (p, body) => __sampleInsert("users", body)],
  ["GET", /^\/api\/pickup-tasks$/, (p, body) => __mockRows("pickup_tasks")],
  ["POST", /^\/api\/restaurants$/, (p, body) => __sampleInsert("restaurants", body)],
  ["GET", /^\/api\/restaurants$/, (p, body) => __mockRows("restaurants")],
  ["GET", /^\/api\/admin\/ngos$/, (p, body) => __mockRows("ngos")],
  ["POST", /^\/api\/admin\/ngos$/, (p, body) => __sampleInsert("ngos", body)],
  ["GET", /^\/api\/settings$/, (p, body) => []],
  ["GET", /^\/api\/ngos$/, (p, body) => __mockRows("ngos")],
  ["POST", /^\/api\/my\/donation-claims\/([^\/]+)\/confirm-receipt$/, (p, body) => __mockRow("donation_claims")],
  ["GET", /^\/api\/my\/donations\/([^\/]+)\/handling-declarations$/, (p, body) => __mockRows("handling_declarations", { donationId: p[0] })],
  ["POST", /^\/api\/my\/donations\/([^\/]+)\/handling-declarations$/, (p, body) => __sampleInsert("handling_declarations", body, { donationId: p[0] })],
  ["POST", /^\/api\/admin\/sponsor-campaigns\/([^\/]+)\/activate$/, (p, body) => __mockRow("sponsor_campaigns", p[0])],
  ["POST", /^\/api\/admin\/donations\/([^\/]+)\/resolve-failure$/, (p, body) => __mockRow("donations", p[0])],
  ["GET", /^\/api\/my\/donation-claims\/([^\/]+)\/pickup-tasks$/, (p, body) => __mockRows("pickup_tasks", { claimId: p[0] })],
  ["GET", /^\/api\/donations\/([^\/]+)\/handling-declarations$/, (p, body) => __mockRows("handling_declarations", { donationId: p[0] })],
  ["POST", /^\/api\/donations\/([^\/]+)\/handling-declarations$/, (p, body) => __sampleInsert("handling_declarations", body, { donationId: p[0] })],
  ["GET", /^\/api\/admin\/restaurants\/([^\/]+)\/preferences$/, (p, body) => __mockRow("restaurant_preferences")],
  ["PATCH", /^\/api\/admin\/restaurants\/([^\/]+)\/preferences$/, (p, body) => ({ ...__mockRow("restaurant_preferences"), ...body })],
  ["POST", /^\/api\/admin\/pickup-tasks\/([^\/]+)\/reassign$/, (p, body) => __mockRow("pickup_tasks", p[0])],
  ["POST", /^\/api\/admin\/sponsor-campaigns\/([^\/]+)\/end$/, (p, body) => __mockRow("sponsor_campaigns", p[0])],
  ["PUT", /^\/api\/my\/restaurants\/([^\/]+)\/preferences$/, (p, body) => __mockRow("restaurants", p[0])],
  ["POST", /^\/api\/my\/donation-claims\/([^\/]+)\/release$/, (p, body) => __mockRow("donation_claims")],
  ["PATCH", /^\/api\/admin\/handling-declarations\/([^\/]+)$/, (p, body) => __sampleUpdate("handling_declarations", p[0], body)],
  ["POST", /^\/api\/my\/donation-claims\/([^\/]+)\/confirm$/, (p, body) => __mockRow("donation_claims")],
  ["POST", /^\/api\/admin\/pickup-tasks\/([^\/]+)\/resolve$/, (p, body) => __mockRow("pickup_tasks", p[0])],
  ["POST", /^\/api\/my\/donation-claims\/([^\/]+)\/receipt$/, (p, body) => __mockRow("donation_claims")],
  ["POST", /^\/api\/admin\/pickup-tasks\/([^\/]+)\/cancel$/, (p, body) => __mockRow("pickup_tasks", p[0])],
  ["POST", /^\/api\/admin\/restaurants\/([^\/]+)\/approve$/, (p, body) => __mockRow("restaurants", p[0])],
  ["POST", /^\/api\/admin\/restaurants\/([^\/]+)\/suspend$/, (p, body) => __mockRow("restaurants", p[0])],
  ["POST", /^\/api\/my\/pickup-tasks\/([^\/]+)\/handover$/, (p, body) => __mockRow("pickup_tasks", p[0])],
  ["POST", /^\/api\/my\/pickup-tasks\/([^\/]+)\/collect$/, (p, body) => __mockRow("pickup_tasks", p[0])],
  ["PATCH", /^\/api\/admin\/sponsor-campaigns\/([^\/]+)$/, (p, body) => __sampleUpdate("sponsor_campaigns", p[0], body)],
  ["GET", /^\/api\/donations\/([^\/]+)\/status-events$/, (p, body) => __mockRows("status_events", { donationId: p[0] })],
  ["GET", /^\/api\/restaurants\/([^\/]+)\/preferences$/, (p, body) => __mockRow("restaurant_preferences")],
  ["PUT", /^\/api\/restaurants\/([^\/]+)\/preferences$/, (p, body) => ({ ...__mockRow("restaurant_preferences"), ...body })],
  ["GET", /^\/api\/admin\/sponsor-campaigns\/([^\/]+)$/, (p, body) => __mockRow("sponsor_campaigns", p[0])],
  ["DELETE", /^\/api\/admin\/sponsor-campaigns\/([^\/]+)$/, (p, body) => __sampleDelete("sponsor_campaigns", p[0])],
  ["GET", /^\/api\/donations\/([^\/]+)\/pickup-tasks$/, (p, body) => __mockRows("pickup_tasks", { donationId: p[0] })],
  ["POST", /^\/api\/my\/donations\/([^\/]+)\/publish$/, (p, body) => __mockRow("donations", p[0])],
  ["POST", /^\/api\/my\/pickup-tasks\/([^\/]+)\/fail$/, (p, body) => __mockRow("pickup_tasks", p[0])],
  ["PATCH", /^\/api\/admin\/donation-claims\/([^\/]+)$/, (p, body) => __sampleUpdate("donation_claims", p[0], body)],
  ["POST", /^\/api\/pickup-tasks\/([^\/]+)\/handover$/, (p, body) => __mockRow("pickup_tasks", p[0])],
  ["POST", /^\/api\/admin\/users\/([^\/]+)\/approve$/, (p, body) => __mockRow("users", p[0])],
  ["POST", /^\/api\/admin\/users\/([^\/]+)\/suspend$/, (p, body) => __mockRow("users", p[0])],
  ["GET", /^\/api\/my\/sponsor-campaigns\/([^\/]+)$/, (p, body) => __mockRow("sponsor_campaigns", p[0])],
  ["PATCH", /^\/api\/my\/sponsor-campaigns\/([^\/]+)$/, (p, body) => __sampleUpdate("sponsor_campaigns", p[0], body)],
  ["POST", /^\/api\/my\/donations\/([^\/]+)\/repeat$/, (p, body) => __mockRow("donations", p[0])],
  ["POST", /^\/api\/my\/donations\/([^\/]+)\/cancel$/, (p, body) => __mockRow("donations", p[0])],
  ["PATCH", /^\/api\/admin\/ngo-capacities\/([^\/]+)$/, (p, body) => __sampleUpdate("ngo_capacities", p[0], body)],
  ["POST", /^\/api\/pickup-tasks\/([^\/]+)\/collect$/, (p, body) => __mockRow("pickup_tasks", p[0])],
  ["DELETE", /^\/api\/admin\/impact-reports\/([^\/]+)$/, (p, body) => __sampleDelete("impact_reports", p[0])],
  ["PUT", /^\/api\/my\/donations\/([^\/]+)\/photo$/, (p, body) => __mockRow("donations", p[0])],
  ["POST", /^\/api\/pickup-tasks\/([^\/]+)\/accept$/, (p, body) => __mockRow("pickup_tasks", p[0])],
  ["POST", /^\/api\/admin\/ngos\/([^\/]+)\/approve$/, (p, body) => __mockRow("ngos", p[0])],
  ["POST", /^\/api\/admin\/ngos\/([^\/]+)\/suspend$/, (p, body) => __mockRow("ngos", p[0])],
  ["POST", /^\/api\/my\/donations\/([^\/]+)\/photo$/, (p, body) => __mockRow("donations", p[0])],
  ["GET", /^\/api\/my\/donation-claims\/([^\/]+)$/, (p, body) => __mockRow("donation_claims", p[0])],
  ["PATCH", /^\/api\/admin\/pickup-tasks\/([^\/]+)$/, (p, body) => __sampleUpdate("pickup_tasks", p[0], body)],
  ["GET", /^\/api\/admin\/pickup-tasks\/([^\/]+)$/, (p, body) => __mockRow("pickup_tasks", p[0])],
  ["PATCH", /^\/api\/admin\/restaurants\/([^\/]+)$/, (p, body) => __sampleUpdate("restaurants", p[0], body)],
  ["GET", /^\/api\/admin\/restaurants\/([^\/]+)$/, (p, body) => __mockRow("restaurants", p[0])],
  ["POST", /^\/api\/pickup-tasks\/([^\/]+)\/fail$/, (p, body) => __mockRow("pickup_tasks", p[0])],
  ["POST", /^\/api\/donations\/([^\/]+)\/claims$/, (p, body) => __sampleInsert("donation_claims", body, { donationId: p[0] })],
  ["GET", /^\/api\/donations\/([^\/]+)\/claims$/, (p, body) => __mockRows("donation_claims", { donationId: p[0] })],
  ["PATCH", /^\/api\/admin\/donations\/([^\/]+)$/, (p, body) => __sampleUpdate("donations", p[0], body)],
  ["GET", /^\/api\/admin\/donations\/([^\/]+)$/, (p, body) => __mockRow("donations", p[0])],
  ["GET", /^\/api\/my\/pickup-tasks\/([^\/]+)$/, (p, body) => __mockRow("pickup_tasks", p[0])],
  ["GET", /^\/api\/my\/restaurants\/([^\/]+)$/, (p, body) => __mockRow("restaurants", p[0])],
  ["PATCH", /^\/api\/my\/restaurants\/([^\/]+)$/, (p, body) => __sampleUpdate("restaurants", p[0], body)],
  ["GET", /^\/api\/impact-reports\/([^\/]+)$/, (p, body) => __mockRow("impact_reports", p[0])],
  ["PATCH", /^\/api\/my\/donations\/([^\/]+)$/, (p, body) => __sampleUpdate("donations", p[0], body)],
  ["GET", /^\/api\/my\/donations\/([^\/]+)$/, (p, body) => __mockRow("donations", p[0])],
  ["DELETE", /^\/api\/my\/donations\/([^\/]+)$/, (p, body) => __sampleDelete("donations", p[0])],
  ["GET", /^\/api\/admin\/users\/([^\/]+)$/, (p, body) => __mockRow("users", p[0])],
  ["PATCH", /^\/api\/admin\/users\/([^\/]+)$/, (p, body) => __sampleUpdate("users", p[0], body)],
  ["GET", /^\/api\/pickup-tasks\/([^\/]+)$/, (p, body) => __mockRow("pickup_tasks", p[0])],
  ["PATCH", /^\/api\/restaurants\/([^\/]+)$/, (p, body) => __sampleUpdate("restaurants", p[0], body)],
  ["GET", /^\/api\/restaurants\/([^\/]+)$/, (p, body) => __mockRow("restaurants", p[0])],
  ["GET", /^\/api\/admin\/ngos\/([^\/]+)$/, (p, body) => __mockRow("ngos", p[0])],
  ["PATCH", /^\/api\/admin\/ngos\/([^\/]+)$/, (p, body) => __sampleUpdate("ngos", p[0], body)],
  ["GET", /^\/api\/donations\/([^\/]+)$/, (p, body) => ({ "donation": __mockRow("donations", p[0]), "restaurant": __mockRow("restaurants") })],
  ["GET", /^\/api\/ngos\/([^\/]+)$/, (p, body) => __mockRow("ngos", p[0])],
  ["PATCH", /^\/api\/my\/donations\/([^\/]+)\/handling-declarations\/([^\/]+)$/, (p, body) => __sampleUpdate("handling_declarations", p[1], body)],
  ["DELETE", /^\/api\/my\/donations\/([^\/]+)\/handling-declarations\/([^\/]+)$/, (p, body) => __sampleDelete("handling_declarations", p[1])],
  ["PATCH", /^\/api\/donations\/([^\/]+)\/handling-declarations\/([^\/]+)$/, (p, body) => __sampleUpdate("handling_declarations", p[1], body)],
  ["DELETE", /^\/api\/donations\/([^\/]+)\/handling-declarations\/([^\/]+)$/, (p, body) => __sampleDelete("handling_declarations", p[1])],
];

/** What `http()` returns in mock mode. Sign-in paths hand back the demo
 *  session @/lib/authContext uses. Every endpoint the API Layer designed
 *  answers in its own declared shape (`__NEXEN_MOCK_ROUTES__`), built from
 *  the same sample rows the database seed uses, and passed through the
 *  same `unwrap` a real answer gets — so a screen that works here reads
 *  the fields it will read against the real routes.
 *
 *  The `/me` rule is anchored to the END of the path: unanchored, it
 *  caught `/api/me/orders` and answered every "my ..." screen with the
 *  demo user. */
function __nexenMockResponse(url: string, init?: RequestInit): any {
  const method = (init?.method ?? 'GET').toUpperCase();
  const __path = String(url).split('?')[0].replace(/\/+$/, '') || '/';
  __sampleLoad();
  if (/\/(login|register|signup|sign-up|sign-in|signin)$/.test(__path)) {
    return { token: 'nexen-mock-token', user: __NEXEN_DEMO_USER__ };
  }
  if (/\/(logout|sign-out|signout)$/.test(__path)) return { ok: true };
  let __body: any = {};
  try { __body = init?.body ? JSON.parse(String(init.body)) : {}; } catch { __body = {}; }
  for (const [m, re, answer] of __NEXEN_MOCK_ROUTES__) {
    if (m !== method) continue;
    const hit = re.exec(__path);
    if (hit) return unwrap(answer(hit.slice(1).map(decodeURIComponent), __body));
  }
  if (method === 'GET' && /\/auth\/(me|session|user)$|^\/api\/(me|profile)$|\/users\/me$/.test(__path)) {
    return __NEXEN_DEMO_USER__;
  }
  // No designed answer: a write changes the rows its path names, kept for this
  // tab (`__sampleWrite`); else it echoes its body so optimistic UI still
  // renders. A read finds the rows its path names.
  if (method !== 'GET') {
    const written = __sampleWrite(method, __path, __body);
    if (written !== undefined || method === 'DELETE') return written;
  }
  if (method !== 'GET' && init?.body) return __body;
  const __segs = __path.split('/').filter(Boolean);
  for (let i = __segs.length - 1; i >= 0; i -= 1) {
    const rows = __NEXEN_MOCK_ROWS__[__segs[i]];
    if (!rows) continue;
    const isItem = i === __segs.length - 2;
    return isItem ? __mockRow(__segs[i], __segs[i + 1]) : rows;
  }
  return {};
}

import type { Donation } from '@/types/donation';
import type { DonationClaim } from '@/types/donationclaim';
import type { HandlingDeclaration } from '@/types/handlingdeclaration';
import type { ImpactReport } from '@/types/impactreport';
import type { Ngo } from '@/types/ngo';
import type { NgoCapacity } from '@/types/ngocapacity';
import type { PickupTask } from '@/types/pickuptask';
import type { Restaurant } from '@/types/restaurant';
import type { RestaurantPreference } from '@/types/restaurantpreference';
import type { SponsorCampaign } from '@/types/sponsorcampaign';
import type { StatusEvent } from '@/types/statusevent';
import type { User } from '@/types/user';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function withQuery(
  url: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  if (!query) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

// ONE envelope convention, applied here so nothing downstream has to think
// about it: route handlers return the entity WRAPPED — `{ task }`, `{ projects }`
// — matching the `{ error }` shape errors already use and leaving room for
// `{ data, meta }` later. This unwraps it, so hooks and pages only ever see
// entities.
//
// Without a single decision, some generated consumers unwrapped and some did
// not: `useTask` stored `{ task: {...} }` as the task itself while the page
// next to it got it right. Both were plausible readings of an unstated rule.
function unwrap(payload: any): any {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }
  const keys = Object.keys(payload);
  // A single-key object whose key is not a known envelope field IS the
  // envelope. Anything else is already the entity — unwrapping a real
  // one-field entity would be worse than leaving a wrapper on.
  if (keys.length === 1 && !['error', 'message', 'ok'].includes(keys[0])) {
    return payload[keys[0]];
  }
  return payload;
}

async function http(url: string, init?: RequestInit): Promise<any> {
  // No database exists during the preview — answer locally.
  if (__NEXEN_IS_MOCK__) return __nexenMockResponse(url, init);
  // Unified-Next: same-origin relative URLs. Auth is DUAL — the login route
  // sets an httpOnly session cookie AND returns the JWT, which the login form
  // persists via @/lib/authToken. We attach it as `Authorization: Bearer` here
  // because the cookie is withheld inside the IDE preview's cross-site iframe;
  // `credentials: 'include'` keeps the cookie working in a normal browser too.
  const token = typeof window !== 'undefined' ? getToken() : null;
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((init?.headers as Record<string, string> | undefined) ?? {}),
    },
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.text().catch(() => res.statusText));
  }
  if (res.status === 204) return undefined;
  return unwrap(await res.json().catch(() => undefined));
}

export async function createAuthRegister(input: { name: string; email: string; password: string; role: string }): Promise<User> {
  return http(`/api/auth/register`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAuthDemoLogin(input: { role: string }): Promise<User> {
  return http(`/api/auth/demo-login`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAuthLogin(input: { email: string; password: string }): Promise<User> {
  return http(`/api/auth/login`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAuthLogout(input: Record<string, unknown>): Promise<any> {
  return http(`/api/auth/logout`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getAuthMe(query?: Record<string, string | number | boolean | undefined>): Promise<User> {
  return http(withQuery(`/api/auth/me`, query));
}
export async function updateAuthMe(input: { name?: string; email?: string }): Promise<User> {
  return http(`/api/auth/me`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function createAuthChangePassword(input: { current_password: string; new_password: string }): Promise<any> {
  return http(`/api/auth/change-password`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAuthForgotPassword(input: { email: string }): Promise<{ message: string }> {
  return http(`/api/auth/forgot-password`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAuthResetPassword(input: { token: string; password: string }): Promise<any> {
  return http(`/api/auth/reset-password`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getAdminUsers(query?: Record<string, string | number | boolean | undefined>): Promise<User[]> {
  return http(withQuery(`/api/admin/users`, query));
}
export async function createAdminUser(input: Partial<Omit<User, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<User> {
  return http(`/api/admin/users`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getAdminUserById(userId: string, query?: Record<string, string | number | boolean | undefined>): Promise<User> {
  return http(withQuery(`/api/admin/users/${userId}`, query));
}
export async function updateAdminUser(userId: string, input: Partial<Omit<User, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<User> {
  return http(`/api/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function createAdminUserApprove(userId: string, input: Record<string, unknown>): Promise<User> {
  return http(`/api/admin/users/${userId}/approve`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAdminUserSuspend(userId: string, input: Record<string, unknown>): Promise<User> {
  return http(`/api/admin/users/${userId}/suspend`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getMyAvailability(query?: Record<string, string | number | boolean | undefined>): Promise<{ is_available: boolean; need_portions?: number; capacity_portions?: number; carrying_capacity_portions?: number }> {
  return http(withQuery(`/api/my/availability`, query));
}
export async function updateMyAvailability(input: { is_available?: boolean; need_portions?: number; capacity_portions?: number; carrying_capacity_portions?: number }): Promise<{ is_available: boolean; need_portions?: number; capacity_portions?: number; carrying_capacity_portions?: number }> {
  return http(`/api/my/availability`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function getMyRestaurants(query?: Record<string, string | number | boolean | undefined>): Promise<Restaurant[]> {
  return http(withQuery(`/api/my/restaurants`, query));
}
export async function createMyRestaurant(input: Partial<Omit<Restaurant, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Restaurant> {
  return http(`/api/my/restaurants`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getMyRestaurantById(restaurantId: string, query?: Record<string, string | number | boolean | undefined>): Promise<Restaurant> {
  return http(withQuery(`/api/my/restaurants/${restaurantId}`, query));
}
export async function updateMyRestaurant(restaurantId: string, input: Partial<Omit<Restaurant, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Restaurant> {
  return http(`/api/my/restaurants/${restaurantId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function updateMyRestaurantPreference(restaurantId: string, input: Record<string, unknown>): Promise<Restaurant> {
  return http(`/api/my/restaurants/${restaurantId}/preferences`, { method: 'PUT', body: JSON.stringify(input) });
}
export async function getAdminRestaurants(query?: Record<string, string | number | boolean | undefined>): Promise<Restaurant[]> {
  return http(withQuery(`/api/admin/restaurants`, query));
}
export async function updateAdminRestaurant(restaurantId: string, input: Partial<Omit<Restaurant, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Restaurant> {
  return http(`/api/admin/restaurants/${restaurantId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function getMySponsorCampaigns(query?: Record<string, string | number | boolean | undefined>): Promise<SponsorCampaign[]> {
  return http(withQuery(`/api/my/sponsor-campaigns`, query));
}
export async function createMySponsorCampaign(input: Partial<Omit<SponsorCampaign, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<SponsorCampaign> {
  return http(`/api/my/sponsor-campaigns`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getMySponsorCampaignById(campaignId: string, query?: Record<string, string | number | boolean | undefined>): Promise<SponsorCampaign> {
  return http(withQuery(`/api/my/sponsor-campaigns/${campaignId}`, query));
}
export async function updateMySponsorCampaign(campaignId: string, input: Partial<Omit<SponsorCampaign, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<SponsorCampaign> {
  return http(`/api/my/sponsor-campaigns/${campaignId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function getAdminSponsorCampaigns(query?: Record<string, string | number | boolean | undefined>): Promise<SponsorCampaign[]> {
  return http(withQuery(`/api/admin/sponsor-campaigns`, query));
}
export async function updateAdminSponsorCampaign(campaignId: string, input: Partial<Omit<SponsorCampaign, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<SponsorCampaign> {
  return http(`/api/admin/sponsor-campaigns/${campaignId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function createMyDonation(input: Partial<Omit<Donation, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Donation> {
  return http(`/api/my/donations`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getMyDonations(query?: Record<string, string | number | boolean | undefined>): Promise<Donation[]> {
  return http(withQuery(`/api/my/donations`, query));
}
export async function updateMyDonation(donationId: string, input: Partial<Omit<Donation, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Donation> {
  return http(`/api/my/donations/${donationId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function createMyDonationRepeat(donationId: string, input: Record<string, unknown>): Promise<Donation> {
  return http(`/api/my/donations/${donationId}/repeat`, { method: 'POST', body: JSON.stringify(input) });
}
export async function updateMyDonationPhoto(donationId: string, input: Record<string, unknown>): Promise<Donation> {
  return http(`/api/my/donations/${donationId}/photo`, { method: 'PUT', body: JSON.stringify(input) });
}
export async function createMyDonationPublish(donationId: string, input: Record<string, unknown>): Promise<Donation> {
  return http(`/api/my/donations/${donationId}/publish`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createMyDonationCancel(donationId: string, input: Record<string, unknown>): Promise<Donation> {
  return http(`/api/my/donations/${donationId}/cancel`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getMyDonorDashboard(query?: Record<string, string | number | boolean | undefined>): Promise<{ published: number; claimed: number; delivered: number; recent_donations: Donation[] }> {
  return http(withQuery(`/api/my/donor-dashboard`, query));
}
export async function getDonationById(donationId: string, query?: Record<string, string | number | boolean | undefined>): Promise<{ donation: Donation; restaurant: Restaurant }> {
  return http(withQuery(`/api/donations/${donationId}`, query));
}
export async function getDonationMatches(query?: Record<string, string | number | boolean | undefined>): Promise<Array<{ donation: Donation; restaurant: Restaurant; portions_available: number; match_explanation: string }>> {
  return http(withQuery(`/api/donation-matches`, query));
}
export async function getAdminDonations(query?: Record<string, string | number | boolean | undefined>): Promise<Donation[]> {
  return http(withQuery(`/api/admin/donations`, query));
}
export async function updateAdminDonation(donationId: string, input: Partial<Omit<Donation, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Donation> {
  return http(`/api/admin/donations/${donationId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function getAdminOperationsSummary(query?: Record<string, string | number | boolean | undefined>): Promise<{ pending_approvals: number; active_rescues: number; failed_assignments: number; suspended_users: number }> {
  return http(withQuery(`/api/admin/operations-summary`, query));
}
export async function getImpactDashboard(query?: Record<string, string | number | boolean | undefined>): Promise<{ confirmed_portions_delivered: number; estimated_waste_avoided_kg: number; illustrative_cost: number; assumptions: { kg_per_portion: number; cost_basis: string; is_illustrative: boolean } }> {
  return http(withQuery(`/api/impact-dashboard`, query));
}
export async function getDonationHandlingDeclarations(donationId: string, query?: Record<string, string | number | boolean | undefined>): Promise<HandlingDeclaration[]> {
  return http(withQuery(`/api/donations/${donationId}/handling-declarations`, query));
}
export async function createDonationHandlingDeclaration(donationId: string, input: Partial<Omit<HandlingDeclaration, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<HandlingDeclaration> {
  return http(`/api/donations/${donationId}/handling-declarations`, { method: 'POST', body: JSON.stringify(input) });
}
export async function updateDonationHandlingDeclaration(donationId: string, declarationId: string, input: Partial<Omit<HandlingDeclaration, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<HandlingDeclaration> {
  return http(`/api/donations/${donationId}/handling-declarations/${declarationId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function deleteDonationHandlingDeclaration(donationId: string, declarationId: string): Promise<void> {
  return http(`/api/donations/${donationId}/handling-declarations/${declarationId}`, { method: 'DELETE' });
}
export async function createDonationClaim(donationId: string, input: { portions_claimed: number }): Promise<DonationClaim> {
  return http(`/api/donations/${donationId}/claims`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getMyDonationClaims(query?: Record<string, string | number | boolean | undefined>): Promise<DonationClaim[]> {
  return http(withQuery(`/api/my/donation-claims`, query));
}
export async function createMyDonationClaimConfirmReceipt(claimId: string, input: { confirmed_portions: number }): Promise<DonationClaim> {
  return http(`/api/my/donation-claims/${claimId}/confirm-receipt`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createMyDonationClaimRelease(claimId: string, input: Record<string, unknown>): Promise<DonationClaim> {
  return http(`/api/my/donation-claims/${claimId}/release`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getAdminDonationClaims(query?: Record<string, string | number | boolean | undefined>): Promise<DonationClaim[]> {
  return http(withQuery(`/api/admin/donation-claims`, query));
}
export async function getPickupTasks(query?: Record<string, string | number | boolean | undefined>): Promise<PickupTask[]> {
  return http(withQuery(`/api/pickup-tasks`, query));
}
export async function createPickupTaskAccept(pickupTaskId: string, input: Record<string, unknown>): Promise<PickupTask> {
  return http(`/api/pickup-tasks/${pickupTaskId}/accept`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getMyPickupTasks(query?: Record<string, string | number | boolean | undefined>): Promise<PickupTask[]> {
  return http(withQuery(`/api/my/pickup-tasks`, query));
}
export async function createMyPickupTaskCollect(pickupTaskId: string, input: Record<string, unknown>): Promise<PickupTask> {
  return http(`/api/my/pickup-tasks/${pickupTaskId}/collect`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createMyPickupTaskHandover(pickupTaskId: string, input: Record<string, unknown>): Promise<PickupTask> {
  return http(`/api/my/pickup-tasks/${pickupTaskId}/handover`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createMyPickupTaskFail(pickupTaskId: string, input: { failure_reason: string }): Promise<PickupTask> {
  return http(`/api/my/pickup-tasks/${pickupTaskId}/fail`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getDonationPickupTasks(donationId: string, query?: Record<string, string | number | boolean | undefined>): Promise<PickupTask[]> {
  return http(withQuery(`/api/donations/${donationId}/pickup-tasks`, query));
}
export async function getAdminPickupTasks(query?: Record<string, string | number | boolean | undefined>): Promise<PickupTask[]> {
  return http(withQuery(`/api/admin/pickup-tasks`, query));
}
export async function createAdminPickupTaskReassign(pickupTaskId: string, input: Record<string, unknown>): Promise<PickupTask> {
  return http(`/api/admin/pickup-tasks/${pickupTaskId}/reassign`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAdminPickupTaskCancel(pickupTaskId: string, input: Record<string, unknown>): Promise<PickupTask> {
  return http(`/api/admin/pickup-tasks/${pickupTaskId}/cancel`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getDonationStatusEvents(donationId: string, query?: Record<string, string | number | boolean | undefined>): Promise<StatusEvent[]> {
  return http(withQuery(`/api/donations/${donationId}/status-events`, query));
}
export async function getMyNotifications(query?: Record<string, string | number | boolean | undefined>): Promise<any> {
  return http(withQuery(`/api/my/notifications`, query));
}
export async function deleteMyNotification(notificationId: string): Promise<any> {
  return http(`/api/my/notifications/${notificationId}`, { method: 'DELETE' });
}
export async function getSettings(query?: Record<string, string | number | boolean | undefined>): Promise<any> {
  return http(withQuery(`/api/settings`, query));
}
export async function updateAdminSetting(settingKey: string, input: Record<string, unknown>): Promise<any> {
  return http(`/api/admin/settings/${settingKey}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function createAuthDemoSignIn(input: { role: string }): Promise<User> {
  return http(`/api/auth/demo-sign-in`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createRestaurant(input: Partial<Omit<Restaurant, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Restaurant> {
  return http(`/api/restaurants`, { method: 'POST', body: JSON.stringify(input) });
}
export async function updateRestaurant(restaurantId: string, input: Partial<Omit<Restaurant, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Restaurant> {
  return http(`/api/restaurants/${restaurantId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function getRestaurants(query?: Record<string, string | number | boolean | undefined>): Promise<Restaurant[]> {
  return http(withQuery(`/api/restaurants`, query));
}
export async function getRestaurantById(restaurantId: string, query?: Record<string, string | number | boolean | undefined>): Promise<Restaurant> {
  return http(withQuery(`/api/restaurants/${restaurantId}`, query));
}
export async function getAdminRestaurantById(restaurantId: string, query?: Record<string, string | number | boolean | undefined>): Promise<Restaurant> {
  return http(withQuery(`/api/admin/restaurants/${restaurantId}`, query));
}
export async function createAdminRestaurantApprove(restaurantId: string, input: Record<string, unknown>): Promise<Restaurant> {
  return http(`/api/admin/restaurants/${restaurantId}/approve`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAdminRestaurantSuspend(restaurantId: string, input: { reason?: string }): Promise<Restaurant> {
  return http(`/api/admin/restaurants/${restaurantId}/suspend`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getRestaurantPreferences(restaurantId: string, query?: Record<string, string | number | boolean | undefined>): Promise<RestaurantPreference> {
  return http(withQuery(`/api/restaurants/${restaurantId}/preferences`, query));
}
export async function updateRestaurantPreference(restaurantId: string, input: Partial<RestaurantPreference>): Promise<RestaurantPreference> {
  return http(`/api/restaurants/${restaurantId}/preferences`, { method: 'PUT', body: JSON.stringify(input) });
}
export async function getAdminRestaurantPreferences(restaurantId: string, query?: Record<string, string | number | boolean | undefined>): Promise<RestaurantPreference> {
  return http(withQuery(`/api/admin/restaurants/${restaurantId}/preferences`, query));
}
export async function updateAdminRestaurantPreference(restaurantId: string, input: Partial<RestaurantPreference>): Promise<RestaurantPreference> {
  return http(`/api/admin/restaurants/${restaurantId}/preferences`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function getMyDashboard(query?: Record<string, string | number | boolean | undefined>): Promise<{ restaurant: Restaurant; donations_published_this_month: number; recent_donations: Donation[] }> {
  return http(withQuery(`/api/my/dashboard`, query));
}
export async function getNgos(query?: Record<string, string | number | boolean | undefined>): Promise<Ngo[]> {
  return http(withQuery(`/api/ngos`, query));
}
export async function getNgoById(ngoId: string, query?: Record<string, string | number | boolean | undefined>): Promise<Ngo> {
  return http(withQuery(`/api/ngos/${ngoId}`, query));
}
export async function getAdminNgos(query?: { status?: string }): Promise<Ngo[]> {
  return http(withQuery(`/api/admin/ngos`, query));
}
export async function createAdminNgo(input: Partial<Omit<Ngo, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Ngo> {
  return http(`/api/admin/ngos`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getAdminNgoById(ngoId: string, query?: Record<string, string | number | boolean | undefined>): Promise<Ngo> {
  return http(withQuery(`/api/admin/ngos/${ngoId}`, query));
}
export async function updateAdminNgo(ngoId: string, input: Partial<Omit<Ngo, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Ngo> {
  return http(`/api/admin/ngos/${ngoId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function createAdminNgoApprove(ngoId: string, input: Record<string, unknown>): Promise<Ngo> {
  return http(`/api/admin/ngos/${ngoId}/approve`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAdminNgoSuspend(ngoId: string, input: { reason?: string }): Promise<Ngo> {
  return http(`/api/admin/ngos/${ngoId}/suspend`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getMyNgoCapacity(query?: Record<string, string | number | boolean | undefined>): Promise<NgoCapacity> {
  return http(withQuery(`/api/my/ngo-capacity`, query));
}
export async function createMyNgoCapacity(input: Partial<Omit<NgoCapacity, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<NgoCapacity> {
  return http(`/api/my/ngo-capacity`, { method: 'POST', body: JSON.stringify(input) });
}
export async function updateMyNgoCapacity(input: Partial<Omit<NgoCapacity, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<NgoCapacity> {
  return http(`/api/my/ngo-capacity`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function getAdminNgoCapacities(query?: Record<string, string | number | boolean | undefined>): Promise<NgoCapacity[]> {
  return http(withQuery(`/api/admin/ngo-capacities`, query));
}
export async function updateAdminNgoCapacity(ngoCapacityId: string, input: Partial<Omit<NgoCapacity, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<NgoCapacity> {
  return http(`/api/admin/ngo-capacities/${ngoCapacityId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function getMyDonationById(donationId: string, query?: Record<string, string | number | boolean | undefined>): Promise<Donation> {
  return http(withQuery(`/api/my/donations/${donationId}`, query));
}
export async function deleteMyDonation(donationId: string): Promise<void> {
  return http(`/api/my/donations/${donationId}`, { method: 'DELETE' });
}
export async function createMyDonationPhoto(donationId: string, input: Record<string, unknown>): Promise<Donation> {
  return http(`/api/my/donations/${donationId}/photo`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getMyDonationHandlingDeclarations(donationId: string, query?: Record<string, string | number | boolean | undefined>): Promise<HandlingDeclaration[]> {
  return http(withQuery(`/api/my/donations/${donationId}/handling-declarations`, query));
}
export async function createMyDonationHandlingDeclaration(donationId: string, input: Partial<Omit<HandlingDeclaration, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<HandlingDeclaration> {
  return http(`/api/my/donations/${donationId}/handling-declarations`, { method: 'POST', body: JSON.stringify(input) });
}
export async function updateMyDonationHandlingDeclaration(donationId: string, handlingDeclarationId: string, input: Partial<Omit<HandlingDeclaration, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<HandlingDeclaration> {
  return http(`/api/my/donations/${donationId}/handling-declarations/${handlingDeclarationId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function deleteMyDonationHandlingDeclaration(donationId: string, handlingDeclarationId: string): Promise<void> {
  return http(`/api/my/donations/${donationId}/handling-declarations/${handlingDeclarationId}`, { method: 'DELETE' });
}
export async function updateAdminHandlingDeclaration(handlingDeclarationId: string, input: Partial<Omit<HandlingDeclaration, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<HandlingDeclaration> {
  return http(`/api/admin/handling-declarations/${handlingDeclarationId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function getDonationEligible(query?: Record<string, string | number | boolean | undefined>): Promise<{ donations: Array<{ donation: Donation; distance_km: number; match_explanation: string }>; alerts: Array<{ message: string; donation_id: string }> }> {
  return http(withQuery(`/api/donations/eligible`, query));
}
export async function getDonationClaims(donationId: string, query?: Record<string, string | number | boolean | undefined>): Promise<DonationClaim[]> {
  return http(withQuery(`/api/donations/${donationId}/claims`, query));
}
export async function getMyDonationClaimById(claimId: string, query?: Record<string, string | number | boolean | undefined>): Promise<DonationClaim> {
  return http(withQuery(`/api/my/donation-claims/${claimId}`, query));
}
export async function createMyDonationClaimConfirm(claimId: string, input: Record<string, unknown>): Promise<DonationClaim> {
  return http(`/api/my/donation-claims/${claimId}/confirm`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getAdminDonationById(donationId: string, query?: Record<string, string | number | boolean | undefined>): Promise<Donation> {
  return http(withQuery(`/api/admin/donations/${donationId}`, query));
}
export async function createAdminDonationResolveFailure(donationId: string, input: { action: 'reopen' | 'close'; reason: string }): Promise<Donation> {
  return http(`/api/admin/donations/${donationId}/resolve-failure`, { method: 'POST', body: JSON.stringify(input) });
}
export async function updateAdminDonationClaim(claimId: string, input: Partial<Omit<DonationClaim, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<DonationClaim> {
  return http(`/api/admin/donation-claims/${claimId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function getPickupTaskOpen(query?: Record<string, string | number | boolean | undefined>): Promise<PickupTask[]> {
  return http(withQuery(`/api/pickup-tasks/open`, query));
}
export async function getPickupTaskById(pickupTaskId: string, query?: Record<string, string | number | boolean | undefined>): Promise<PickupTask> {
  return http(withQuery(`/api/pickup-tasks/${pickupTaskId}`, query));
}
export async function createPickupTaskCollect(pickupTaskId: string, input: Record<string, unknown>): Promise<PickupTask> {
  return http(`/api/pickup-tasks/${pickupTaskId}/collect`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createPickupTaskHandover(pickupTaskId: string, input: Record<string, unknown>): Promise<PickupTask> {
  return http(`/api/pickup-tasks/${pickupTaskId}/handover`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createPickupTaskFail(pickupTaskId: string, input: { reason: string }): Promise<PickupTask> {
  return http(`/api/pickup-tasks/${pickupTaskId}/fail`, { method: 'POST', body: JSON.stringify(input) });
}
export async function updateAdminPickupTask(pickupTaskId: string, input: Partial<Omit<PickupTask, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<PickupTask> {
  return http(`/api/admin/pickup-tasks/${pickupTaskId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function createAdminPickupTaskResolve(pickupTaskId: string, input: { resolution: string; reason: string; volunteer_user_id?: string }): Promise<PickupTask> {
  return http(`/api/admin/pickup-tasks/${pickupTaskId}/resolve`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAdminSponsorCampaign(input: Partial<Omit<SponsorCampaign, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<SponsorCampaign> {
  return http(`/api/admin/sponsor-campaigns`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getAdminSponsorCampaignById(sponsorCampaignId: string, query?: Record<string, string | number | boolean | undefined>): Promise<SponsorCampaign> {
  return http(withQuery(`/api/admin/sponsor-campaigns/${sponsorCampaignId}`, query));
}
export async function updateAdminSponsorCampaignPatch(sponsorCampaignId: string, input: Partial<Omit<SponsorCampaign, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<SponsorCampaign> {
  return http(`/api/admin/sponsor-campaigns/${sponsorCampaignId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export async function deleteAdminSponsorCampaign(sponsorCampaignId: string): Promise<void> {
  return http(`/api/admin/sponsor-campaigns/${sponsorCampaignId}`, { method: 'DELETE' });
}
export async function createAdminSponsorCampaignActivate(sponsorCampaignId: string, input: Record<string, unknown>): Promise<SponsorCampaign> {
  return http(`/api/admin/sponsor-campaigns/${sponsorCampaignId}/activate`, { method: 'POST', body: JSON.stringify(input) });
}
export async function createAdminSponsorCampaignEnd(sponsorCampaignId: string, input: Record<string, unknown>): Promise<SponsorCampaign> {
  return http(`/api/admin/sponsor-campaigns/${sponsorCampaignId}/end`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getImpactReports(query?: Record<string, string | number | boolean | undefined>): Promise<ImpactReport[]> {
  return http(withQuery(`/api/impact-reports`, query));
}
export async function getImpactReportById(impactReportId: string, query?: Record<string, string | number | boolean | undefined>): Promise<ImpactReport> {
  return http(withQuery(`/api/impact-reports/${impactReportId}`, query));
}
export async function getAdminImpactReports(query?: Record<string, string | number | boolean | undefined>): Promise<ImpactReport[]> {
  return http(withQuery(`/api/admin/impact-reports`, query));
}
export async function createAdminImpactReport(input: Partial<Omit<ImpactReport, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<ImpactReport> {
  return http(`/api/admin/impact-reports`, { method: 'POST', body: JSON.stringify(input) });
}
export async function deleteAdminImpactReport(impactReportId: string): Promise<void> {
  return http(`/api/admin/impact-reports/${impactReportId}`, { method: 'DELETE' });
}
export async function getAdminNgoCapacityById(ngoCapacityId: string, query?: Record<string, string | number | boolean | undefined>): Promise<NgoCapacity> {
  return http(withQuery(`/api/admin/ngo-capacities/${ngoCapacityId}`, query));
}
export async function getMyRestaurantPreferences(restaurantId: string, query?: Record<string, string | number | boolean | undefined>): Promise<any> {
  return http(withQuery(`/api/my/restaurants/${restaurantId}/preferences`, query));
}
export async function createAdminRestaurant(input: Partial<Omit<Restaurant, 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'>>): Promise<Restaurant> {
  return http(`/api/admin/restaurants`, { method: 'POST', body: JSON.stringify(input) });
}
export async function deleteMyDonationPhoto(donationId: string): Promise<any> {
  return http(`/api/my/donations/${donationId}/photo`, { method: 'DELETE' });
}
export async function getMyDonationMatches(query?: Record<string, string | number | boolean | undefined>): Promise<{ matches: Array<{ donation: Donation; distance_km: number; portions_available: number; match_reasons: string[] }>; alerts: Array<{ donation_id: string; message: string; created_at: string }> }> {
  return http(withQuery(`/api/my/donation-matches`, query));
}
export async function createMyDonationClaimReceipt(claimId: string, input: { portions_received: number }): Promise<DonationClaim> {
  return http(`/api/my/donation-claims/${claimId}/receipt`, { method: 'POST', body: JSON.stringify(input) });
}
export async function getMyPickupTaskById(pickupTaskId: string, query?: Record<string, string | number | boolean | undefined>): Promise<PickupTask> {
  return http(withQuery(`/api/my/pickup-tasks/${pickupTaskId}`, query));
}
export async function getMyDonationClaimPickupTasks(claimId: string, query?: Record<string, string | number | boolean | undefined>): Promise<PickupTask[]> {
  return http(withQuery(`/api/my/donation-claims/${claimId}/pickup-tasks`, query));
}
export async function getAdminPickupTaskById(pickupTaskId: string, query?: Record<string, string | number | boolean | undefined>): Promise<PickupTask> {
  return http(withQuery(`/api/admin/pickup-tasks/${pickupTaskId}`, query));
}
export async function getMySponsorCampaignByIdGet(sponsorCampaignId: string, query?: Record<string, string | number | boolean | undefined>): Promise<SponsorCampaign> {
  return http(withQuery(`/api/my/sponsor-campaigns/${sponsorCampaignId}`, query));
}
export async function getMyVolunteerAvailability(query?: Record<string, string | number | boolean | undefined>): Promise<{ is_available: boolean; carrying_capacity: number | null }> {
  return http(withQuery(`/api/my/volunteer-availability`, query));
}
export async function updateMyVolunteerAvailability(input: { is_available?: boolean; carrying_capacity?: number }): Promise<{ is_available: boolean; carrying_capacity: number | null }> {
  return http(`/api/my/volunteer-availability`, { method: 'PATCH', body: JSON.stringify(input) });
}
