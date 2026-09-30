import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { alsetTowingTable, alsetVehiclesTable, alsetUsersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateTowingJobBody, UpdateTowingJobBody } from "@workspace/api-zod";
import { canCreateTowingJob, canUpdateTowingJob, canViewTowingJob, canViewVehicle } from "../lib/alset-access";
import { getRequestUser } from "../lib/alset-auth";

const router: IRouter = Router();

function genJobNumber() {
  return "TOW-" + Date.now().toString(36).toUpperCase();
}

async function towRow(t: typeof alsetTowingTable.$inferSelect) {
  const [vehicle] = await db.select().from(alsetVehiclesTable).where(eq(alsetVehiclesTable.id, t.vehicleId)).limit(1);
  let assignedCompanyName: string | null = null;
  if (t.assignedCompanyId) {
    const [co] = await db.select().from(alsetUsersTable).where(eq(alsetUsersTable.id, t.assignedCompanyId)).limit(1);
    assignedCompanyName = co?.name ?? null;
  }
  return {
    id: t.id,
    jobNumber: t.jobNumber,
    vehicleId: t.vehicleId,
    vehicleVin: vehicle?.vin ?? null,
    vehicleModel: vehicle?.model ?? null,
    requestedById: t.requestedById,
    pickupAddress: t.pickupAddress,
    dropoffAddress: t.dropoffAddress,
    requestedAt: t.requestedAt.toISOString(),
    assignedCompanyId: t.assignedCompanyId ?? null,
    assignedCompanyName,
    driverName: t.driverName ?? null,
    estimatedArrival: t.estimatedArrival?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    status: t.status,
    notes: t.notes ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/alset/towing", async (req, res) => {
  try {
    const user = await getRequestUser(req);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const jobs = await db.select().from(alsetTowingTable);
    const accessibleJobs = jobs.filter(job => canViewTowingJob(user, job));
    res.json(await Promise.all(accessibleJobs.map(towRow)));
  } catch (err) {
    req.log.error({ err }, "Failed to list towing jobs");
    res.status(500).json({ error: "Failed to list towing jobs" });
  }
});

router.post("/alset/towing", async (req, res) => {
  try {
    const user = await getRequestUser(req);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (!canCreateTowingJob(user)) { res.status(403).json({ error: "Forbidden" }); return; }
    const parsed = CreateTowingJobBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

    const [vehicle] = await db
      .select()
      .from(alsetVehiclesTable)
      .where(eq(alsetVehiclesTable.id, parsed.data.vehicleId))
      .limit(1);
    if (!vehicle) { res.status(404).json({ error: "Vehicle not found" }); return; }
    if (user.role !== "admin" && !canViewVehicle(user, vehicle)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [t] = await db.insert(alsetTowingTable).values({
      jobNumber: genJobNumber(),
      vehicleId: parsed.data.vehicleId,
      requestedById: user.role === "admin" ? vehicle.ownerId : user.userId,
      pickupAddress: parsed.data.pickupAddress,
      dropoffAddress: parsed.data.dropoffAddress,
      notes: parsed.data.notes ?? null,
    }).returning();
    res.status(201).json(await towRow(t));
  } catch (err) {
    req.log.error({ err }, "Failed to create towing job");
    res.status(500).json({ error: "Failed to create towing job" });
  }
});

router.patch("/alset/towing/:id", async (req, res) => {
  try {
    const user = await getRequestUser(req);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const parsed = UpdateTowingJobBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

    const [currentJob] = await db
      .select()
      .from(alsetTowingTable)
      .where(eq(alsetTowingTable.id, Number(req.params.id)))
      .limit(1);
    if (!currentJob) { res.status(404).json({ error: "Towing job not found" }); return; }
    const isUnassignedSelfClaim =
      user.role === "towing" &&
      currentJob.assignedCompanyId === null &&
      (parsed.data.assignedCompanyId === undefined ||
        parsed.data.assignedCompanyId === user.userId) &&
      parsed.data.driverName === undefined &&
      parsed.data.estimatedArrival === undefined &&
      parsed.data.status === undefined;
    if (!isUnassignedSelfClaim && !canUpdateTowingJob(user, currentJob)) {
      res.status(404).json({ error: "Towing job not found" });
      return;
    }

    const updates: any = {};
    if (parsed.data.status) updates.status = parsed.data.status;
    if (user.role === "towing" && currentJob.assignedCompanyId === null) {
      updates.assignedCompanyId = user.userId;
    } else if (user.role === "admin" && parsed.data.assignedCompanyId !== undefined) {
      updates.assignedCompanyId = parsed.data.assignedCompanyId;
    }
    if (parsed.data.driverName !== undefined) updates.driverName = parsed.data.driverName;
    if (parsed.data.estimatedArrival !== undefined) updates.estimatedArrival = parsed.data.estimatedArrival ? new Date(parsed.data.estimatedArrival) : null;
    const [t] = await db.update(alsetTowingTable).set(updates).where(eq(alsetTowingTable.id, Number(req.params.id))).returning();
    if (!t) { res.status(404).json({ error: "Towing job not found" }); return; }
    res.json(await towRow(t));
  } catch (err) {
    req.log.error({ err }, "Failed to update towing job");
    res.status(500).json({ error: "Failed to update towing job" });
  }
});

export default router;
