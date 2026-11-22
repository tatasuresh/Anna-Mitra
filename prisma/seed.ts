// Demo data — rendered by the pipeline from prisma/schema.prisma. One account per
// role (<role>@example.com, password DEMO_PASSWORD from .env) plus demo@example.com, then every table,
// parents first. Every insert is non-fatal; safe to run again.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const db = new PrismaClient();
const ids: Record<string, Array<string | number>> = {};
const users: Record<string, string | number> = {};
function pick(model: string, i: number): string | number | undefined {
  const list = ids[model] || [];
  return list.length ? list[i % list.length] : undefined;
}
function why(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  return m.split('\n').filter(Boolean).slice(-1)[0]?.slice(0, 200) ?? m;
}

async function main() {
  // DEMO_PASSWORD in .env, random for each project. Unset, nobody can sign in as the demo accounts.
  const demoPassword = process.env.DEMO_PASSWORD || randomUUID();
  if (!process.env.DEMO_PASSWORD) console.log('[seed] demo accounts: DEMO_PASSWORD is not set in .env, so nobody can sign in as them');
  const hashed = await bcrypt.hash(demoPassword, 10);
  try {
    const u = await db.user.upsert({ where: { email: "demo@example.com" }, update: process.env.DEMO_PASSWORD ? { passwordHash: hashed } : {}, create: { id: "00000000-0000-4000-8000-000000000001", email: "demo@example.com", passwordHash: hashed, name: "Demo User", role: "admin" } });
    if (!users["admin"]) users["admin"] = u.id;
    (ids["User"] ??= []).push(u.id);
    console.log('[seed] demo-user: ok demo@example.com');
  } catch (e) {
    console.log('[seed] demo-user: MISSING — ' + why(e));
  }
  try {
    const u = await db.user.upsert({ where: { email: "donor@example.com" }, update: process.env.DEMO_PASSWORD ? { passwordHash: hashed } : {}, create: { email: "donor@example.com", passwordHash: hashed, name: "Demo Donor", role: "donor" } });
    if (!users["donor"]) users["donor"] = u.id;
    (ids["User"] ??= []).push(u.id);
    console.log('[seed] account: ok donor@example.com');
  } catch (e) {
    console.log('[seed] account donor@example.com: ' + why(e));
  }
  try {
    const u = await db.user.upsert({ where: { email: "ngo@example.com" }, update: process.env.DEMO_PASSWORD ? { passwordHash: hashed } : {}, create: { email: "ngo@example.com", passwordHash: hashed, name: "Demo Ngo", role: "ngo" } });
    if (!users["ngo"]) users["ngo"] = u.id;
    (ids["User"] ??= []).push(u.id);
    console.log('[seed] account: ok ngo@example.com');
  } catch (e) {
    console.log('[seed] account ngo@example.com: ' + why(e));
  }
  try {
    const u = await db.user.upsert({ where: { email: "volunteer@example.com" }, update: process.env.DEMO_PASSWORD ? { passwordHash: hashed } : {}, create: { email: "volunteer@example.com", passwordHash: hashed, name: "Demo Volunteer", role: "volunteer" } });
    if (!users["volunteer"]) users["volunteer"] = u.id;
    (ids["User"] ??= []).push(u.id);
    console.log('[seed] account: ok volunteer@example.com');
  } catch (e) {
    console.log('[seed] account volunteer@example.com: ' + why(e));
  }
  try {
    const u = await db.user.upsert({ where: { email: "admin@example.com" }, update: process.env.DEMO_PASSWORD ? { passwordHash: hashed } : {}, create: { email: "admin@example.com", passwordHash: hashed, name: "Demo Admin", role: "admin" } });
    if (!users["admin"]) users["admin"] = u.id;
    (ids["User"] ??= []).push(u.id);
    console.log('[seed] account: ok admin@example.com');
  } catch (e) {
    console.log('[seed] account admin@example.com: ' + why(e));
  }
  try {
    const u = await db.user.upsert({ where: { email: "csr.sponsor@example.com" }, update: process.env.DEMO_PASSWORD ? { passwordHash: hashed } : {}, create: { email: "csr.sponsor@example.com", passwordHash: hashed, name: "Demo Csr Sponsor", role: "csr_sponsor" } });
    if (!users["csr_sponsor"]) users["csr_sponsor"] = u.id;
    (ids["User"] ??= []).push(u.id);
    console.log('[seed] account: ok csr.sponsor@example.com');
  } catch (e) {
    console.log('[seed] account csr.sponsor@example.com: ' + why(e));
  }
  try {
    if ((await db.impactReport.count()) === 0) {
      const rows: Array<() => Record<string, unknown>> = [
        () => ({ periodStart: new Date("2026-10-01T00:00:00"), periodEnd: new Date("2026-10-31T23:59:00"), confirmedPortions: 210, kgPerPortionAssumption: 0.4, estimatedWasteAvoidedKg: 84.0, illustrativeCost: 5250.0, currency: "INR", generatedAt: new Date("2026-11-01T09:00:00") }),
        () => ({ periodStart: new Date("2026-11-01T00:00:00"), periodEnd: new Date("2026-11-15T23:59:00"), confirmedPortions: 120, kgPerPortionAssumption: 0.4, estimatedWasteAvoidedKg: 48.0, illustrativeCost: 3000.0, currency: "INR", generatedAt: new Date("2026-11-16T09:00:00") }),
        () => ({ periodStart: new Date("2026-11-16T00:00:00"), periodEnd: new Date("2026-11-22T23:59:00"), confirmedPortions: 65, kgPerPortionAssumption: 0.4, estimatedWasteAvoidedKg: 26.0, illustrativeCost: 1625.0, currency: "INR", generatedAt: new Date("2026-11-23T09:00:00") }),
        () => ({ periodStart: new Date("2026-11-23T00:00:00"), periodEnd: new Date("2026-11-29T23:59:00"), confirmedPortions: 40, kgPerPortionAssumption: 0.4, estimatedWasteAvoidedKg: 16.0, illustrativeCost: 1000.0, currency: "INR", generatedAt: new Date("2026-11-30T09:00:00") }),
      ];
      let ok = 0;
      for (const row of rows) {
        try {
          const r = await db.impactReport.create({ data: row() as never });
          (ids["ImpactReport"] ??= []).push((r as { id: string | number }).id);
          ok++;
        } catch (e) {
          console.log('[seed] ImpactReport row skipped: ' + why(e));
        }
      }
      console.log(`[seed] ImpactReport: ${ok}/${rows.length} rows`);
    } else {
      ids["ImpactReport"] = (await db.impactReport.findMany({ take: 50, select: { id: true } } as never) as Array<{ id: string | number }>).map((r) => r.id);
    }
  } catch (e) {
    console.log('[seed] ImpactReport skipped: ' + why(e));
  }
  try {
    if ((await db.ngo.count()) === 0) {
      const rows: Array<() => Record<string, unknown>> = [
        () => ({ name: "Velachery Hunger Relief Trust", latitude: 12.9752, longitude: 80.2187, serviceRadiusKm: 5.0, status: "approved" }),
        () => ({ name: "Pallikaranai Shelter Kitchen", latitude: 12.9389, longitude: 80.1934, serviceRadiusKm: 6.5, status: "approved" }),
        () => ({ name: "Thiruvanmiyur Community Meals", latitude: 12.983, longitude: 80.2585, serviceRadiusKm: 4.0, status: "pending_approval" }),
        () => ({ name: "Sholinganallur Night Relief", latitude: 12.901, longitude: 80.2279, serviceRadiusKm: 7.5, status: "suspended" }),
        () => ({ name: "Tambaram Food Circle", latitude: 12.9249, longitude: 80.1, serviceRadiusKm: 8.0, status: "approved" }),
      ];
      let ok = 0;
      for (const row of rows) {
        try {
          const r = await db.ngo.create({ data: row() as never });
          (ids["Ngo"] ??= []).push((r as { id: string | number }).id);
          ok++;
        } catch (e) {
          console.log('[seed] Ngo row skipped: ' + why(e));
        }
      }
      console.log(`[seed] Ngo: ${ok}/${rows.length} rows`);
    } else {
      ids["Ngo"] = (await db.ngo.findMany({ take: 50, select: { id: true } } as never) as Array<{ id: string | number }>).map((r) => r.id);
    }
  } catch (e) {
    console.log('[seed] Ngo skipped: ' + why(e));
  }
  console.log('[seed] PasswordResetToken: left empty (one-time tokens)');
  try {
    if ((await db.restaurant.count()) === 0) {
      const rows: Array<() => Record<string, unknown>> = [
        () => ({ name: "Saffron Buffet", ownerUserId: users["donor"] ?? pick("User", 0), latitude: 12.9784, longitude: 80.2209, status: "approved" }),
        () => ({ name: "Coral Table Kitchen", ownerUserId: users["donor"] ?? pick("User", 1), latitude: 12.976, longitude: 80.2181, status: "pending_approval" }),
        () => ({ name: "Annapoorna Dining Hall", ownerUserId: users["donor"] ?? pick("User", 2), latitude: 12.9742, longitude: 80.2163, status: "approved" }),
        () => ({ name: "Chettinad Corner Mess", ownerUserId: users["donor"] ?? pick("User", 3), latitude: 12.9801, longitude: 80.2234, status: "suspended" }),
        () => ({ name: "Velachery Grill House", ownerUserId: users["donor"] ?? pick("User", 4), latitude: 12.9718, longitude: 80.2195, status: "approved" }),
        () => ({ name: "Marina Spice Cafe", ownerUserId: users["donor"] ?? pick("User", 5), latitude: 12.9833, longitude: 80.225, status: "pending_approval" }),
      ];
      let ok = 0;
      for (const row of rows) {
        try {
          const r = await db.restaurant.create({ data: row() as never });
          (ids["Restaurant"] ??= []).push((r as { id: string | number }).id);
          ok++;
        } catch (e) {
          console.log('[seed] Restaurant row skipped: ' + why(e));
        }
      }
      console.log(`[seed] Restaurant: ${ok}/${rows.length} rows`);
    } else {
      ids["Restaurant"] = (await db.restaurant.findMany({ take: 50, select: { id: true } } as never) as Array<{ id: string | number }>).map((r) => r.id);
    }
  } catch (e) {
    console.log('[seed] Restaurant skipped: ' + why(e));
  }
  try {
    if ((await db.sponsorCampaign.count()) === 0) {
      const rows: Array<() => Record<string, unknown>> = [
        () => ({ name: "Velachery Winter Meals 2026", sponsorUserId: users["csr_sponsor"] ?? pick("User", 0), recognitionText: "Supported by Tamarind Foods Foundation", startsOn: new Date("2026-11-01T00:00:00"), endsOn: new Date("2026-12-31T23:59:00"), status: "active", costPerPortion: 25.0 }),
        () => ({ name: "Pallikaranai Night Kitchen Fund", sponsorUserId: users["csr_sponsor"] ?? pick("User", 1), recognitionText: "With thanks to Coromandel Logistics Pvt Ltd", startsOn: new Date("2026-10-01T00:00:00"), endsOn: new Date("2026-11-15T23:59:00"), status: "ended", costPerPortion: 30.0 }),
        () => ({ name: "Monsoon Relief Partners", sponsorUserId: users["csr_sponsor"] ?? pick("User", 2), recognitionText: "Funded by Kaveri Textiles CSR", startsOn: new Date("2027-01-01T00:00:00"), endsOn: new Date("2027-03-31T23:59:00"), status: "draft", costPerPortion: 28.0 }),
        () => ({ name: "Hungerless Fridays", sponsorUserId: users["csr_sponsor"] ?? pick("User", 3), recognitionText: "Thanks to the staff of Nilgiri Dairy", startsOn: new Date("2026-09-01T00:00:00"), endsOn: new Date("2026-09-30T23:59:00"), status: "ended", costPerPortion: 20.0 }),
        () => ({ name: "Festival Feeding Drive", sponsorUserId: users["csr_sponsor"] ?? pick("User", 4), recognitionText: "Sponsored by Greenleaf Insurance Group", startsOn: new Date("2026-12-15T00:00:00"), endsOn: new Date("2027-01-15T23:59:00"), status: "draft", costPerPortion: 22.5 }),
      ];
      let ok = 0;
      for (const row of rows) {
        try {
          const r = await db.sponsorCampaign.create({ data: row() as never });
          (ids["SponsorCampaign"] ??= []).push((r as { id: string | number }).id);
          ok++;
        } catch (e) {
          console.log('[seed] SponsorCampaign row skipped: ' + why(e));
        }
      }
      console.log(`[seed] SponsorCampaign: ${ok}/${rows.length} rows`);
    } else {
      ids["SponsorCampaign"] = (await db.sponsorCampaign.findMany({ take: 50, select: { id: true } } as never) as Array<{ id: string | number }>).map((r) => r.id);
    }
  } catch (e) {
    console.log('[seed] SponsorCampaign skipped: ' + why(e));
  }
  try {
    if ((await db.donation.count()) === 0) {
      const rows: Array<() => Record<string, unknown>> = [
        () => ({ restaurantId: pick("Restaurant", 0), postedByUserId: users["donor"] ?? pick("User", 0), repeatedFromDonationId: pick("Donation", 0), sponsorCampaignId: pick("SponsorCampaign", 0), description: "Chicken biryani with raita, buffet trays", portionsTotal: 40, portionsRemaining: 0, confirmedPortions: 0, pickupLocation: "14 100 Feet Road, Velachery, Chennai 600042", pickupByAt: new Date("2026-11-22T21:30:00"), inputMethod: "voice", aiExtracted: true, photoUrl: "https://picsum.photos/seed/biryani/800/600", status: "claimed", publishedAt: new Date("2026-11-22T12:50:00") }),
        () => ({ restaurantId: pick("Restaurant", 1), postedByUserId: users["donor"] ?? pick("User", 1), repeatedFromDonationId: pick("Donation", 1), sponsorCampaignId: pick("SponsorCampaign", 1), description: "Vegetable fried rice and paneer manchurian", portionsTotal: 25, portionsRemaining: 25, confirmedPortions: 0, pickupLocation: "14 100 Feet Road, Velachery, Chennai 600042", pickupByAt: new Date("2026-11-22T23:00:00"), inputMethod: "text", aiExtracted: false, photoUrl: "https://picsum.photos/seed/biryani/800/600", status: "published", publishedAt: new Date("2026-11-22T11:50:00") }),
        () => ({ restaurantId: pick("Restaurant", 2), postedByUserId: users["donor"] ?? pick("User", 2), repeatedFromDonationId: pick("Donation", 2), sponsorCampaignId: pick("SponsorCampaign", 2), description: "Idli, sambar and coconut chutney", portionsTotal: 30, portionsRemaining: 0, confirmedPortions: 30, pickupLocation: "14 100 Feet Road, Velachery, Chennai 600042", pickupByAt: new Date("2026-11-21T20:00:00"), inputMethod: "manual", aiExtracted: false, photoUrl: "https://picsum.photos/seed/biryani/800/600", status: "received", publishedAt: new Date("2026-11-21T09:00:00") }),
        () => ({ restaurantId: pick("Restaurant", 3), postedByUserId: users["donor"] ?? pick("User", 3), repeatedFromDonationId: pick("Donation", 3), sponsorCampaignId: pick("SponsorCampaign", 3), description: "Mutton keema pav", portionsTotal: 18, portionsRemaining: 18, confirmedPortions: 0, pickupLocation: "14 100 Feet Road, Velachery, Chennai 600042", pickupByAt: new Date("2026-11-20T21:00:00"), inputMethod: "repeat", aiExtracted: true, photoUrl: "https://picsum.photos/seed/biryani/800/600", status: "expired", publishedAt: new Date("2026-11-20T11:00:00") }),
        () => ({ restaurantId: pick("Restaurant", 4), postedByUserId: users["donor"] ?? pick("User", 4), repeatedFromDonationId: pick("Donation", 4), sponsorCampaignId: pick("SponsorCampaign", 4), description: "Paneer tikka with naan", portionsTotal: 22, portionsRemaining: 22, confirmedPortions: 0, pickupLocation: "14 100 Feet Road, Velachery, Chennai 600042", pickupByAt: new Date("2026-11-24T20:00:00"), inputMethod: "voice", aiExtracted: true, photoUrl: "https://picsum.photos/seed/biryani/800/600", status: "published", publishedAt: new Date("2026-11-22T09:30:00") }),
        () => ({ restaurantId: pick("Restaurant", 5), postedByUserId: users["donor"] ?? pick("User", 5), repeatedFromDonationId: pick("Donation", 5), sponsorCampaignId: pick("SponsorCampaign", 5), description: "Fish curry with steamed rice", portionsTotal: 35, portionsRemaining: 0, confirmedPortions: 35, pickupLocation: "14 100 Feet Road, Velachery, Chennai 600042", pickupByAt: new Date("2026-11-19T18:00:00"), inputMethod: "manual", aiExtracted: false, photoUrl: "https://picsum.photos/seed/biryani/800/600", status: "received", publishedAt: new Date("2026-11-18T10:00:00") }),
        () => ({ restaurantId: pick("Restaurant", 6), postedByUserId: users["donor"] ?? pick("User", 6), repeatedFromDonationId: pick("Donation", 6), sponsorCampaignId: pick("SponsorCampaign", 6), description: "Chapati, dal makhani and kachumber salad", portionsTotal: 50, portionsRemaining: 0, confirmedPortions: 0, pickupLocation: "14 100 Feet Road, Velachery, Chennai 600042", pickupByAt: new Date("2026-11-23T14:00:00"), inputMethod: "text", aiExtracted: true, photoUrl: "https://picsum.photos/seed/biryani/800/600", status: "claimed", publishedAt: new Date("2026-11-22T08:10:00") }),
      ];
      let ok = 0;
      for (const row of rows) {
        try {
          const r = await db.donation.create({ data: row() as never });
          (ids["Donation"] ??= []).push((r as { id: string | number }).id);
          ok++;
        } catch (e) {
          console.log('[seed] Donation row skipped: ' + why(e));
        }
      }
      console.log(`[seed] Donation: ${ok}/${rows.length} rows`);
    } else {
      ids["Donation"] = (await db.donation.findMany({ take: 50, select: { id: true } } as never) as Array<{ id: string | number }>).map((r) => r.id);
    }
  } catch (e) {
    console.log('[seed] Donation skipped: ' + why(e));
  }
  try {
    if ((await db.ngoCapacity.count()) === 0) {
      const rows: Array<() => Record<string, unknown>> = [
        () => ({ ngoId: pick("Ngo", 0), currentNeedPortions: 60, capacityPortions: 80, maxPortionsPerClaim: 40, hasColdStorage: true, isAvailable: true }),
        () => ({ ngoId: pick("Ngo", 1), currentNeedPortions: 40, capacityPortions: 50, maxPortionsPerClaim: 25, hasColdStorage: false, isAvailable: false }),
        () => ({ ngoId: pick("Ngo", 2), currentNeedPortions: 35, capacityPortions: 60, maxPortionsPerClaim: 30, hasColdStorage: true, isAvailable: true }),
        () => ({ ngoId: pick("Ngo", 3), currentNeedPortions: 20, capacityPortions: 30, maxPortionsPerClaim: 15, hasColdStorage: false, isAvailable: true }),
        () => ({ ngoId: pick("Ngo", 4), currentNeedPortions: 55, capacityPortions: 70, maxPortionsPerClaim: 35, hasColdStorage: true, isAvailable: false }),
      ];
      let ok = 0;
      for (const row of rows) {
        try {
          const r = await db.ngoCapacity.create({ data: row() as never });
          (ids["NgoCapacity"] ??= []).push((r as { id: string | number }).id);
          ok++;
        } catch (e) {
          console.log('[seed] NgoCapacity row skipped: ' + why(e));
        }
      }
      console.log(`[seed] NgoCapacity: ${ok}/${rows.length} rows`);
    } else {
      ids["NgoCapacity"] = (await db.ngoCapacity.findMany({ take: 50, select: { id: true } } as never) as Array<{ id: string | number }>).map((r) => r.id);
    }
  } catch (e) {
    console.log('[seed] NgoCapacity skipped: ' + why(e));
  }
  try {
    if ((await db.restaurantPreference.count()) === 0) {
      const rows: Array<() => Record<string, unknown>> = [
        () => ({ restaurantId: pick("Restaurant", 0), defaultPortions: 40, preferredPickupStart: "21:00", preferredPickupEnd: "22:00", pickupNotes: "Use the side service entrance and ask for the duty manager.", defaultPickupWindow: "21:00 to 22:00", defaultPickupWindowMinutes: 60, preferredFoodTypes: ["North Indian", "South Indian", "Biryani"], updatedByUserId: users["donor"] ?? pick("User", 0) }),
        () => ({ restaurantId: pick("Restaurant", 1), defaultPortions: 30, preferredPickupStart: "22:00", preferredPickupEnd: "23:00", pickupNotes: "Kitchen door at the back lane. Trays are labelled.", defaultPickupWindow: "22:00 to 23:00", defaultPickupWindowMinutes: 60, preferredFoodTypes: ["Continental", "Pasta", "Desserts"], updatedByUserId: users["donor"] ?? pick("User", 1) }),
        () => ({ restaurantId: pick("Restaurant", 2), defaultPortions: 25, preferredPickupStart: "20:30", preferredPickupEnd: "21:15", pickupNotes: "Call before arriving. Parking is on Vijaya Nagar side.", defaultPickupWindow: "20:30 to 21:15", defaultPickupWindowMinutes: 45, preferredFoodTypes: ["Thali", "Dal", "Rice dishes"], updatedByUserId: users["donor"] ?? pick("User", 2) }),
        () => ({ restaurantId: pick("Restaurant", 3), defaultPortions: 50, preferredPickupStart: "14:00", preferredPickupEnd: "15:00", pickupNotes: "", defaultPickupWindow: "14:00 to 15:00", defaultPickupWindowMinutes: 60, preferredFoodTypes: ["Chapati", "Dal", "Salads"], updatedByUserId: users["donor"] ?? pick("User", 3) }),
        () => ({ restaurantId: pick("Restaurant", 4), defaultPortions: 50, preferredPickupStart: "14:00", preferredPickupEnd: "15:00", pickupNotes: "Lunch buffet leftovers. Pickup from loading bay.", defaultPickupWindow: "14:00 to 15:00", defaultPickupWindowMinutes: 60, preferredFoodTypes: ["Chapati", "Dal", "Salads"], updatedByUserId: users["donor"] ?? pick("User", 4) }),
      ];
      let ok = 0;
      for (const row of rows) {
        try {
          const r = await db.restaurantPreference.create({ data: row() as never });
          (ids["RestaurantPreference"] ??= []).push((r as { id: string | number }).id);
          ok++;
        } catch (e) {
          console.log('[seed] RestaurantPreference row skipped: ' + why(e));
        }
      }
      console.log(`[seed] RestaurantPreference: ${ok}/${rows.length} rows`);
    } else {
      ids["RestaurantPreference"] = (await db.restaurantPreference.findMany({ take: 50, select: { id: true } } as never) as Array<{ id: string | number }>).map((r) => r.id);
    }
  } catch (e) {
    console.log('[seed] RestaurantPreference skipped: ' + why(e));
  }
  try {
    if ((await db.donationClaim.count()) === 0) {
      const rows: Array<() => Record<string, unknown>> = [
        () => ({ donationId: pick("Donation", 0), ngoId: pick("Ngo", 0), claimedByUserId: users["ngo"] ?? pick("User", 0), portionsClaimed: 40, status: "reserved", reservedUntil: new Date("2026-11-22T15:50:00"), portionsReceived: 30, receivedAt: new Date("2026-11-21T20:40:00"), portionsReleased: 0 }),
        () => ({ donationId: pick("Donation", 1), ngoId: pick("Ngo", 1), claimedByUserId: users["ngo"] ?? pick("User", 1), portionsClaimed: 30, status: "confirmed", reservedUntil: new Date("2026-11-21T20:00:00"), portionsReceived: 30, receivedAt: new Date("2026-11-21T20:40:00"), portionsReleased: 0 }),
        () => ({ donationId: pick("Donation", 2), ngoId: pick("Ngo", 2), claimedByUserId: users["ngo"] ?? pick("User", 2), portionsClaimed: 35, status: "confirmed", reservedUntil: new Date("2026-11-19T18:00:00"), portionsReceived: 35, receivedAt: new Date("2026-11-19T18:40:00"), portionsReleased: 0 }),
        () => ({ donationId: pick("Donation", 3), ngoId: pick("Ngo", 3), claimedByUserId: users["ngo"] ?? pick("User", 3), portionsClaimed: 18, status: "expired", reservedUntil: new Date("2026-11-20T20:00:00"), portionsReceived: 30, receivedAt: new Date("2026-11-21T20:40:00"), portionsReleased: 18 }),
        () => ({ donationId: pick("Donation", 4), ngoId: pick("Ngo", 4), claimedByUserId: users["ngo"] ?? pick("User", 4), portionsClaimed: 50, status: "reserved", reservedUntil: new Date("2026-11-23T13:30:00"), portionsReceived: 30, receivedAt: new Date("2026-11-21T20:40:00"), portionsReleased: 0 }),
        () => ({ donationId: pick("Donation", 5), ngoId: pick("Ngo", 5), claimedByUserId: users["ngo"] ?? pick("User", 5), portionsClaimed: 15, status: "released", reservedUntil: new Date("2026-11-22T12:30:00"), portionsReceived: 30, receivedAt: new Date("2026-11-21T20:40:00"), portionsReleased: 15 }),
      ];
      let ok = 0;
      for (const row of rows) {
        try {
          const r = await db.donationClaim.create({ data: row() as never });
          (ids["DonationClaim"] ??= []).push((r as { id: string | number }).id);
          ok++;
        } catch (e) {
          console.log('[seed] DonationClaim row skipped: ' + why(e));
        }
      }
      console.log(`[seed] DonationClaim: ${ok}/${rows.length} rows`);
    } else {
      ids["DonationClaim"] = (await db.donationClaim.findMany({ take: 50, select: { id: true } } as never) as Array<{ id: string | number }>).map((r) => r.id);
    }
  } catch (e) {
    console.log('[seed] DonationClaim skipped: ' + why(e));
  }
  try {
    if ((await db.handlingDeclaration.count()) === 0) {
      const rows: Array<() => Record<string, unknown>> = [
        () => ({ donationId: pick("Donation", 0), declaredByUserId: users["donor"] ?? pick("User", 0), preparationTimeMinutes: 75, preparationTimeAt: new Date("2026-11-22T12:40:00"), preparedAt: new Date("2026-11-22T12:40:00"), storageMethod: "hot_held", requiresRefrigeration: true, allergens: "Dairy (raita), nuts (garnish)", checklistConfirmed: true, declaredAt: new Date("2026-11-22T12:50:00"), status: "verified" }),
        () => ({ donationId: pick("Donation", 1), declaredByUserId: users["donor"] ?? pick("User", 1), preparationTimeMinutes: 90, preparationTimeAt: new Date("2026-11-22T11:30:00"), preparedAt: new Date("2026-11-22T11:30:00"), storageMethod: "refrigerated", requiresRefrigeration: true, allergens: "Soy, gluten (soy sauce)", checklistConfirmed: true, declaredAt: new Date("2026-11-22T11:50:00"), status: "verified" }),
        () => ({ donationId: pick("Donation", 2), declaredByUserId: users["donor"] ?? pick("User", 2), preparationTimeMinutes: 120, preparationTimeAt: new Date("2026-11-21T08:30:00"), preparedAt: new Date("2026-11-21T08:30:00"), storageMethod: "hot_held", requiresRefrigeration: true, allergens: "Lentils (urad dal); mustard in sambar", checklistConfirmed: true, declaredAt: new Date("2026-11-21T09:00:00"), status: "verified" }),
        () => ({ donationId: pick("Donation", 3), declaredByUserId: users["donor"] ?? pick("User", 3), preparationTimeMinutes: 30, preparationTimeAt: new Date("2026-11-22T07:30:00"), preparedAt: new Date("2026-11-22T07:30:00"), storageMethod: "hot_held", requiresRefrigeration: true, allergens: "Gluten (pav), dairy (butter)", checklistConfirmed: false, declaredAt: new Date("2026-11-20T11:00:00"), status: "flagged" }),
        () => ({ donationId: pick("Donation", 4), declaredByUserId: users["donor"] ?? pick("User", 4), preparationTimeMinutes: 45, preparationTimeAt: new Date("2026-11-22T07:30:00"), preparedAt: new Date("2026-11-22T07:30:00"), storageMethod: "refrigerated", requiresRefrigeration: true, allergens: "Dairy (paneer, butter), gluten (naan)", checklistConfirmed: true, declaredAt: new Date("2026-11-22T09:30:00"), status: "pending_check" }),
        () => ({ donationId: pick("Donation", 5), declaredByUserId: users["donor"] ?? pick("User", 5), preparationTimeMinutes: 60, preparationTimeAt: new Date("2026-11-22T07:30:00"), preparedAt: new Date("2026-11-22T07:30:00"), storageMethod: "refrigerated", requiresRefrigeration: true, allergens: "Fish, mustard seed", checklistConfirmed: true, declaredAt: new Date("2026-11-18T10:00:00"), status: "verified" }),
        () => ({ donationId: pick("Donation", 6), declaredByUserId: users["donor"] ?? pick("User", 6), preparationTimeMinutes: 60, preparationTimeAt: new Date("2026-11-22T07:30:00"), preparedAt: new Date("2026-11-22T07:30:00"), storageMethod: "refrigerated", requiresRefrigeration: true, allergens: "Gluten (wheat), dairy (butter)", checklistConfirmed: true, declaredAt: new Date("2026-11-22T08:10:00"), status: "pending_check" }),
      ];
      let ok = 0;
      for (const row of rows) {
        try {
          const r = await db.handlingDeclaration.create({ data: row() as never });
          (ids["HandlingDeclaration"] ??= []).push((r as { id: string | number }).id);
          ok++;
        } catch (e) {
          console.log('[seed] HandlingDeclaration row skipped: ' + why(e));
        }
      }
      console.log(`[seed] HandlingDeclaration: ${ok}/${rows.length} rows`);
    } else {
      ids["HandlingDeclaration"] = (await db.handlingDeclaration.findMany({ take: 50, select: { id: true } } as never) as Array<{ id: string | number }>).map((r) => r.id);
    }
  } catch (e) {
    console.log('[seed] HandlingDeclaration skipped: ' + why(e));
  }
  try {
    if ((await db.statusEvent.count()) === 0) {
      const rows: Array<() => Record<string, unknown>> = [
        () => ({ donationId: pick("Donation", 0), pickupTaskId: pick("PickupTask", 0), actorUserId: pick("User", 0), fromStatus: "published", toStatus: "published", reason: "Claimed by Velachery Hunger Relief Trust", eventType: "donation_published", sequenceNo: 1, recordType: "Donation" }),
        () => ({ donationId: pick("Donation", 1), pickupTaskId: pick("PickupTask", 1), actorUserId: pick("User", 1), fromStatus: "published", toStatus: "claimed", reason: "Claimed by Velachery Hunger Relief Trust", eventType: "donation_claimed", sequenceNo: 2, recordType: "Donation" }),
        () => ({ donationId: pick("Donation", 2), pickupTaskId: pick("PickupTask", 2), actorUserId: pick("User", 2), fromStatus: "published", toStatus: "published", reason: "Receipt confirmed by NGO", eventType: "donation_published", sequenceNo: 1, recordType: "Donation" }),
        () => ({ donationId: pick("Donation", 3), pickupTaskId: pick("PickupTask", 3), actorUserId: pick("User", 3), fromStatus: "published", toStatus: "published", reason: "Receipt confirmed by NGO", eventType: "donation_published", sequenceNo: 1, recordType: "Donation" }),
        () => ({ donationId: pick("Donation", 4), pickupTaskId: pick("PickupTask", 4), actorUserId: pick("User", 4), fromStatus: "published", toStatus: "confirmed", reason: "Receipt confirmed by NGO", eventType: "donation_confirmed", sequenceNo: 2, recordType: "Donation" }),
        () => ({ donationId: pick("Donation", 5), pickupTaskId: pick("PickupTask", 5), actorUserId: pick("User", 5), fromStatus: "published", toStatus: "published", reason: "Pickup window passed without collection", eventType: "donation_published", sequenceNo: 1, recordType: "Donation" }),
        () => ({ donationId: pick("Donation", 6), pickupTaskId: pick("PickupTask", 6), actorUserId: pick("User", 6), fromStatus: "published", toStatus: "expired", reason: "Pickup window passed without collection", eventType: "donation_expired", sequenceNo: 2, recordType: "Donation" }),
        () => ({ donationId: pick("Donation", 7), pickupTaskId: pick("PickupTask", 7), actorUserId: pick("User", 7), fromStatus: "published", toStatus: "delivered", reason: "Handover confirmed by Pallikaranai Shelter Kitchen", eventType: "donation_delivered", sequenceNo: 2, recordType: "Donation" }),
      ];
      let ok = 0;
      for (const row of rows) {
        try {
          const r = await db.statusEvent.create({ data: row() as never });
          (ids["StatusEvent"] ??= []).push((r as { id: string | number }).id);
          ok++;
        } catch (e) {
          console.log('[seed] StatusEvent row skipped: ' + why(e));
        }
      }
      console.log(`[seed] StatusEvent: ${ok}/${rows.length} rows`);
    } else {
      ids["StatusEvent"] = (await db.statusEvent.findMany({ take: 50, select: { id: true } } as never) as Array<{ id: string | number }>).map((r) => r.id);
    }
  } catch (e) {
    console.log('[seed] StatusEvent skipped: ' + why(e));
  }
  try {
    if ((await db.pickupTask.count()) === 0) {
      const rows: Array<() => Record<string, unknown>> = [
        () => ({ donationId: pick("Donation", 0), claimId: pick("DonationClaim", 0), volunteerUserId: users["volunteer"] ?? pick("User", 0), portionCount: 40, status: "accepted", acceptedAt: new Date("2026-11-22T14:10:00"), collectedAt: new Date("2026-11-21T20:20:00"), handedOverAt: new Date("2026-11-21T20:40:00"), failureReason: "Food not chilled in time; refused at pickup." }),
        () => ({ donationId: pick("Donation", 1), claimId: pick("DonationClaim", 1), volunteerUserId: users["volunteer"] ?? pick("User", 1), portionCount: 30, status: "handed_over", acceptedAt: new Date("2026-11-21T20:05:00"), collectedAt: new Date("2026-11-21T20:20:00"), handedOverAt: new Date("2026-11-21T20:40:00"), failureReason: "Food not chilled in time; refused at pickup." }),
        () => ({ donationId: pick("Donation", 2), claimId: pick("DonationClaim", 2), volunteerUserId: users["volunteer"] ?? pick("User", 2), portionCount: 35, status: "handed_over", acceptedAt: new Date("2026-11-19T17:10:00"), collectedAt: new Date("2026-11-19T17:30:00"), handedOverAt: new Date("2026-11-19T18:40:00"), failureReason: "Food not chilled in time; refused at pickup." }),
        () => ({ donationId: pick("Donation", 3), claimId: pick("DonationClaim", 3), volunteerUserId: users["volunteer"] ?? pick("User", 3), portionCount: 18, status: "failed", acceptedAt: new Date("2026-11-20T20:10:00"), collectedAt: new Date("2026-11-22T13:20:00"), handedOverAt: new Date("2026-11-21T20:40:00"), failureReason: "Food not chilled in time; refused at pickup." }),
        () => ({ donationId: pick("Donation", 4), claimId: pick("DonationClaim", 4), volunteerUserId: users["volunteer"] ?? pick("User", 4), portionCount: 25, status: "open", acceptedAt: new Date("2026-11-22T12:15:00"), collectedAt: new Date("2026-11-22T13:20:00"), handedOverAt: new Date("2026-11-21T20:40:00"), failureReason: "Food not chilled in time; refused at pickup." }),
        () => ({ donationId: pick("Donation", 5), claimId: pick("DonationClaim", 5), volunteerUserId: users["volunteer"] ?? pick("User", 5), portionCount: 22, status: "open", acceptedAt: new Date("2026-11-22T12:15:00"), collectedAt: new Date("2026-11-22T13:20:00"), handedOverAt: new Date("2026-11-21T20:40:00"), failureReason: "Food not chilled in time; refused at pickup." }),
        () => ({ donationId: pick("Donation", 6), claimId: pick("DonationClaim", 6), volunteerUserId: users["volunteer"] ?? pick("User", 6), portionCount: 50, status: "collected", acceptedAt: new Date("2026-11-22T12:15:00"), collectedAt: new Date("2026-11-22T13:20:00"), handedOverAt: new Date("2026-11-21T20:40:00"), failureReason: "Food not chilled in time; refused at pickup." }),
      ];
      let ok = 0;
      for (const row of rows) {
        try {
          const r = await db.pickupTask.create({ data: row() as never });
          (ids["PickupTask"] ??= []).push((r as { id: string | number }).id);
          ok++;
        } catch (e) {
          console.log('[seed] PickupTask row skipped: ' + why(e));
        }
      }
      console.log(`[seed] PickupTask: ${ok}/${rows.length} rows`);
    } else {
      ids["PickupTask"] = (await db.pickupTask.findMany({ take: 50, select: { id: true } } as never) as Array<{ id: string | number }>).map((r) => r.id);
    }
  } catch (e) {
    console.log('[seed] PickupTask skipped: ' + why(e));
  }
}

main()
  .then(async () => { await db.$disconnect(); })
  .catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(0); });
