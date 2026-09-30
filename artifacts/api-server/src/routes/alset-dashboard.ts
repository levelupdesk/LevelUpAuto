import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  alsetClaimsTable,
  alsetTowingTable,
  alsetRentalsTable,
  alsetVehiclesTable,
  alsetWorkOrdersTable,
} from "@workspace/db/schema";
import { eq, inArray, isNull, or } from "drizzle-orm";
import { getRequestUser } from "../lib/alset-auth";

const router: IRouter = Router();

async function loadDashboardData(
  user: NonNullable<Awaited<ReturnType<typeof getRequestUser>>>,
) {
  if (user.role === "admin") {
    return Promise.all([
      db.select().from(alsetClaimsTable),
      db.select().from(alsetWorkOrdersTable),
      db.select().from(alsetTowingTable),
      db.select().from(alsetRentalsTable),
      db.select().from(alsetVehiclesTable),
    ]);
  }

  if (user.role === "owner") {
    const [claims, towingJobs, rentals, vehicles] = await Promise.all([
      db.select().from(alsetClaimsTable).where(eq(alsetClaimsTable.ownerId, user.userId)),
      db.select().from(alsetTowingTable).where(eq(alsetTowingTable.requestedById, user.userId)),
      db.select().from(alsetRentalsTable).where(eq(alsetRentalsTable.ownerId, user.userId)),
      db.select().from(alsetVehiclesTable).where(eq(alsetVehiclesTable.ownerId, user.userId)),
    ]);
    const vehicleIds = vehicles.map((vehicle) => vehicle.id);
    const workOrders =
      vehicleIds.length === 0
        ? []
        : await db
            .select()
            .from(alsetWorkOrdersTable)
            .where(inArray(alsetWorkOrdersTable.vehicleId, vehicleIds));

    return [claims, workOrders, towingJobs, rentals, vehicles] as const;
  }

  if (user.role === "shop") {
    const workOrders = await db
      .select()
      .from(alsetWorkOrdersTable)
      .where(eq(alsetWorkOrdersTable.shopId, user.userId));
    const vehicleIds = [...new Set(workOrders.map((workOrder) => workOrder.vehicleId))];
    const vehicles =
      vehicleIds.length === 0
        ? []
        : await db
            .select()
            .from(alsetVehiclesTable)
            .where(inArray(alsetVehiclesTable.id, vehicleIds));

    return [[], workOrders, [], [], vehicles] as const;
  }

  if (user.role === "insurer") {
    const claims = await db
      .select()
      .from(alsetClaimsTable)
      .where(eq(alsetClaimsTable.insurerId, user.userId));
    const claimIds = claims.map((claim) => claim.id);
    const workOrders =
      claimIds.length === 0
        ? []
        : await db
            .select()
            .from(alsetWorkOrdersTable)
            .where(inArray(alsetWorkOrdersTable.claimId, claimIds));

    return [claims, workOrders, [], [], []] as const;
  }

  if (user.role === "towing") {
    const towingJobs = await db
      .select()
      .from(alsetTowingTable)
      .where(
        or(
          eq(alsetTowingTable.assignedCompanyId, user.userId),
          isNull(alsetTowingTable.assignedCompanyId),
        ),
      );

    return [[], [], towingJobs, [], []] as const;
  }

  const rentals = await db
    .select()
    .from(alsetRentalsTable)
    .where(
      or(
        eq(alsetRentalsTable.rentalCompanyId, user.userId),
        isNull(alsetRentalsTable.rentalCompanyId),
      ),
    );

  return [[], [], [], rentals, []] as const;
}

router.get("/alset/dashboard/stats", async (req, res) => {
  try {
    const user = await getRequestUser(req);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const [visibleClaims, visibleWorkOrders, visibleTowing, visibleRentals, visibleVehicles] =
      await loadDashboardData(user);

    const openClaimStatuses = ["submitted", "under-review"];
    const activeWoStatuses = ["assigned", "in-progress", "awaiting-parts"];
    const pendingTowStatuses = ["requested", "assigned", "en-route", "arrived"];
    const activeRentalStatuses = ["confirmed", "active"];

    const recentActivity = [
      ...visibleClaims.slice(-3).map((claim) => ({
        id: "claim-" + claim.id,
        type: "claim" as const,
        message: `Claim ${claim.claimNumber} — ${claim.status}`,
        timestamp: claim.updatedAt.toISOString(),
        status: claim.status,
      })),
      ...visibleWorkOrders.slice(-2).map((workOrder) => ({
        id: "wo-" + workOrder.id,
        type: "work-order" as const,
        message: `Work Order ${workOrder.workOrderNumber} — ${workOrder.status}`,
        timestamp: workOrder.updatedAt.toISOString(),
        status: workOrder.status,
      })),
      ...visibleTowing.slice(-2).map((job) => ({
        id: "tow-" + job.id,
        type: "towing" as const,
        message: `Tow Job ${job.jobNumber} — ${job.status}`,
        timestamp: job.createdAt.toISOString(),
        status: job.status,
      })),
    ].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()).slice(0, 8);

    res.json({
      totalClaims: visibleClaims.length,
      openClaims: visibleClaims.filter((claim) => openClaimStatuses.includes(claim.status)).length,
      totalWorkOrders: visibleWorkOrders.length,
      activeWorkOrders: visibleWorkOrders.filter((workOrder) => activeWoStatuses.includes(workOrder.status)).length,
      pendingTowingJobs: visibleTowing.filter((job) => pendingTowStatuses.includes(job.status)).length,
      activeRentals: visibleRentals.filter((rental) => activeRentalStatuses.includes(rental.status)).length,
      totalVehicles: visibleVehicles.length,
      recentActivity,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
});

export default router;
