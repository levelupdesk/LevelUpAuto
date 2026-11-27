import { db } from "@workspace/db";
import {
  alsetOrganizationsTable,
  alsetUsersTable,
  alsetVehiclesTable,
  alsetClaimsTable,
  alsetWorkOrdersTable,
  alsetTowingTable,
  alsetRentalsTable,
} from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");

  return `scrypt$${salt}$${derivedKey}`;
}

async function seed() {
  const demoPassword = process.env.SEED_DEMO_PASSWORD?.trim();

  if (!demoPassword) {
    console.error(
      "SEED_DEMO_PASSWORD must be set to seed Alset demo accounts. Refusing to continue.",
    );
    process.exit(1);
  }

  console.log("Seeding Alset demo data...");

  await db.execute(sql`TRUNCATE TABLE alset_rentals RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE alset_towing RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE alset_work_orders RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE alset_claims RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE alset_vehicles RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE alset_users RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE alset_organizations RESTART IDENTITY CASCADE`);

  // Organizations
  const [shopOrg, insurerOrg, towingOrg, rentalOrg] = await db.insert(alsetOrganizationsTable).values([
    { name: "Bay Area Tesla Service Center", type: "shop" },
    { name: "TeslaShield Insurance", type: "insurer" },
    { name: "EV Tow Pro", type: "towing" },
    { name: "GreenFleet Rentals", type: "rental" },
  ]).returning();

  const password = hashPassword(demoPassword);

  // Users
  const [ownerUser, shopUser, insurerUser, towingUser, rentalUser, adminUser] = await db.insert(alsetUsersTable).values([
    { email: "owner@alset.com", passwordHash: password, name: "Alex Johnson", role: "owner" },
    { email: "shop@alset.com", passwordHash: password, name: "Mike Torres", role: "shop", organizationId: shopOrg.id },
    { email: "insurer@alset.com", passwordHash: password, name: "Sarah Chen", role: "insurer", organizationId: insurerOrg.id },
    { email: "towing@alset.com", passwordHash: password, name: "Carlos Rivera", role: "towing", organizationId: towingOrg.id },
    { email: "rental@alset.com", passwordHash: password, name: "Priya Patel", role: "rental", organizationId: rentalOrg.id },
    { email: "admin@alset.com", passwordHash: password, name: "Admin User", role: "admin" },
  ]).returning();

  // Vehicles
  const [vehicle1, vehicle2] = await db.insert(alsetVehiclesTable).values([
    {
      ownerId: ownerUser.id,
      vin: "5YJ3E1EA1PF123456",
      model: "Model 3",
      year: 2023,
      color: "Pearl White",
      licensePlate: "ALSET01",
      mileage: 18500,
    },
    {
      ownerId: ownerUser.id,
      vin: "5YJSA1E26PF987654",
      model: "Model S",
      year: 2022,
      color: "Midnight Silver",
      licensePlate: "ALSET02",
      mileage: 32000,
    },
  ]).returning();

  // Claims
  const [claim1, claim2, claim3] = await db.insert(alsetClaimsTable).values([
    {
      claimNumber: "CLM-001A2B",
      vehicleId: vehicle1.id,
      ownerId: ownerUser.id,
      insurerId: insurerUser.id,
      incidentDate: "2026-03-10",
      incidentDescription: "Rear-end collision at intersection on Market St. Bumper and sensors damaged.",
      estimatedDamage: "4850.00",
      approvedAmount: "4500.00",
      status: "approved",
      priority: "high",
      notes: "Tesla Autopilot sensors require recalibration after repair.",
    },
    {
      claimNumber: "CLM-002C3D",
      vehicleId: vehicle2.id,
      ownerId: ownerUser.id,
      incidentDate: "2026-03-20",
      incidentDescription: "Hail damage to roof and hood during storm. Multiple dents across the vehicle.",
      estimatedDamage: "7200.00",
      status: "under-review",
      priority: "medium",
      notes: "Waiting for adjuster inspection.",
    },
    {
      claimNumber: "CLM-003E4F",
      vehicleId: vehicle1.id,
      ownerId: ownerUser.id,
      incidentDate: "2026-02-15",
      incidentDescription: "Side mirror clipped by passing truck in parking structure.",
      estimatedDamage: "650.00",
      approvedAmount: "650.00",
      status: "paid",
      priority: "low",
    },
  ]).returning();

  // Work Orders
  await db.insert(alsetWorkOrdersTable).values([
    {
      workOrderNumber: "WO-AAA001",
      claimId: claim1.id,
      vehicleId: vehicle1.id,
      shopId: shopUser.id,
      technicianName: "James Park",
      description: "Repair rear bumper, replace parking sensors, recalibrate Autopilot cameras.",
      laborHours: "6.5",
      partsTotal: "2100.00",
      laborRate: "185.00",
      totalCost: "3302.50",
      status: "in-progress",
      startDate: "2026-03-22",
      notes: "Parts ordered. Sensors arrive 3/25.",
    },
    {
      workOrderNumber: "WO-BBB002",
      claimId: claim3.id,
      vehicleId: vehicle1.id,
      shopId: shopUser.id,
      technicianName: "Lisa Wang",
      description: "Replace driver side mirror assembly and housing.",
      laborHours: "1.5",
      partsTotal: "380.00",
      laborRate: "185.00",
      totalCost: "657.50",
      status: "completed",
      startDate: "2026-02-20",
      completionDate: "2026-02-20",
    },
  ]);

  // Towing Jobs
  await db.insert(alsetTowingTable).values([
    {
      jobNumber: "TOW-T1A2B",
      vehicleId: vehicle1.id,
      requestedById: ownerUser.id,
      pickupAddress: "450 Market St, San Francisco, CA 94105",
      dropoffAddress: "Bay Area Tesla Service Center, 1 Tesla Dr, Fremont, CA",
      assignedCompanyId: towingUser.id,
      driverName: "Miguel Santos",
      estimatedArrival: new Date("2026-03-10T14:30:00Z"),
      completedAt: new Date("2026-03-10T16:00:00Z"),
      status: "completed",
      notes: "Vehicle was not drivable due to rear collision damage.",
    },
    {
      jobNumber: "TOW-T3C4D",
      vehicleId: vehicle2.id,
      requestedById: ownerUser.id,
      pickupAddress: "789 Oak Ave, San Jose, CA 95112",
      dropoffAddress: "Bay Area Tesla Service Center, 1 Tesla Dr, Fremont, CA",
      status: "requested",
      notes: "Battery range critically low, needs flatbed.",
    },
  ]);

  // Rentals
  await db.insert(alsetRentalsTable).values([
    {
      bookingNumber: "RNT-R1A2B",
      claimId: claim1.id,
      ownerId: ownerUser.id,
      rentalCompanyId: rentalUser.id,
      vehicleType: "electric",
      startDate: "2026-03-22",
      endDate: "2026-03-28",
      dailyRate: "75.00",
      totalCost: "450.00",
      status: "active",
      notes: "EV loaner while Model 3 is being repaired.",
    },
    {
      bookingNumber: "RNT-R2C3D",
      ownerId: ownerUser.id,
      vehicleType: "suv",
      startDate: "2026-03-26",
      status: "requested",
      notes: "Requested for hail damage repair period.",
    },
  ]);

  console.log("\nAlset demo accounts (password from SEED_DEMO_PASSWORD):");
  console.log("  owner@alset.com     (Tesla Owner)");
  console.log("  shop@alset.com      (Repair Shop)");
  console.log("  insurer@alset.com   (Insurance Adjuster)");
  console.log("  towing@alset.com    (Towing Dispatcher)");
  console.log("  rental@alset.com    (Rental Company)");
  console.log("  admin@alset.com     (Admin)");
  console.log("\nSeeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
