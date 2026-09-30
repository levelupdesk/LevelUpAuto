import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  alsetClaimsTable,
  alsetWorkOrdersTable,
  alsetVehiclesTable,
  alsetUsersTable,
} from "@workspace/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { CreateWorkOrderBody, UpdateWorkOrderBody } from "@workspace/api-zod";
import {
  canCreateWorkOrder,
  canUpdateWorkOrder,
  canViewClaim,
  canViewVehicle,
  canViewWorkOrder,
} from "../lib/alset-access";
import { getRequestUser } from "../lib/alset-auth";

const router: IRouter = Router();

function genWoNumber() {
  return "WO-" + Date.now().toString(36).toUpperCase();
}

function formatDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function workOrderRow(
  workOrder: typeof alsetWorkOrdersTable.$inferSelect,
  vehiclesById: Map<number, { vin: string; model: (typeof alsetVehiclesTable.$inferSelect)["model"] }>,
  shopsById: Map<number, string>,
) {
  const vehicle = vehiclesById.get(workOrder.vehicleId);
  const shopName = workOrder.shopId ? shopsById.get(workOrder.shopId) ?? null : null;

  return {
    id: workOrder.id,
    workOrderNumber: workOrder.workOrderNumber,
    claimId: workOrder.claimId ?? null,
    vehicleId: workOrder.vehicleId,
    vehicleVin: vehicle?.vin ?? null,
    vehicleModel: vehicle?.model ?? null,
    shopId: workOrder.shopId ?? null,
    shopName,
    technicianName: workOrder.technicianName ?? null,
    description: workOrder.description,
    laborHours: workOrder.laborHours ? parseFloat(workOrder.laborHours) : null,
    partsTotal: workOrder.partsTotal ? parseFloat(workOrder.partsTotal) : null,
    laborRate: workOrder.laborRate ? parseFloat(workOrder.laborRate) : null,
    totalCost: workOrder.totalCost ? parseFloat(workOrder.totalCost) : null,
    status: workOrder.status,
    startDate: workOrder.startDate ?? null,
    completionDate: workOrder.completionDate ?? null,
    notes: workOrder.notes ?? null,
    createdAt: workOrder.createdAt.toISOString(),
    updatedAt: workOrder.updatedAt.toISOString(),
  };
}

async function listVisibleWorkOrders(
  user: NonNullable<Awaited<ReturnType<typeof getRequestUser>>>,
) {
  if (user.role === "admin") {
    return db.select().from(alsetWorkOrdersTable);
  }

  if (user.role === "shop") {
    return db
      .select()
      .from(alsetWorkOrdersTable)
      .where(eq(alsetWorkOrdersTable.shopId, user.userId));
  }

  if (user.role === "owner") {
    const ownedVehicles = await db
      .select({ id: alsetVehiclesTable.id })
      .from(alsetVehiclesTable)
      .where(eq(alsetVehiclesTable.ownerId, user.userId));
    const ownedVehicleIds = ownedVehicles.map((vehicle) => vehicle.id);

    if (ownedVehicleIds.length === 0) {
      return [];
    }

    return db
      .select()
      .from(alsetWorkOrdersTable)
      .where(inArray(alsetWorkOrdersTable.vehicleId, ownedVehicleIds));
  }

  if (user.role === "insurer") {
    const assignedClaims = await db
      .select({ id: alsetClaimsTable.id })
      .from(alsetClaimsTable)
      .where(eq(alsetClaimsTable.insurerId, user.userId));
    const claimIds = assignedClaims.map((claim) => claim.id);

    if (claimIds.length === 0) {
      return [];
    }

    return db
      .select()
      .from(alsetWorkOrdersTable)
      .where(inArray(alsetWorkOrdersTable.claimId, claimIds));
  }

  return [];
}

router.get("/alset/work-orders", async (req, res) => {
  try {
    const user = await getRequestUser(req);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const orders = await listVisibleWorkOrders(user);
    const vehicleIds = [...new Set(orders.map((order) => order.vehicleId))];
    const shopIds = [...new Set(orders.flatMap((order) => (order.shopId ? [order.shopId] : [])))];
    const [vehicles, shops] = await Promise.all([
      vehicleIds.length === 0
        ? Promise.resolve([])
        : db
            .select({ id: alsetVehiclesTable.id, vin: alsetVehiclesTable.vin, model: alsetVehiclesTable.model })
            .from(alsetVehiclesTable)
            .where(inArray(alsetVehiclesTable.id, vehicleIds)),
      shopIds.length === 0
        ? Promise.resolve([])
        : db
            .select({ id: alsetUsersTable.id, name: alsetUsersTable.name })
            .from(alsetUsersTable)
            .where(inArray(alsetUsersTable.id, shopIds)),
    ]);

    const vehiclesById = new Map(
      vehicles.map((vehicle) => [vehicle.id, { vin: vehicle.vin, model: vehicle.model }]),
    );
    const shopsById = new Map(shops.map((shop) => [shop.id, shop.name]));

    res.json(
      orders.map((order) =>
        workOrderRow(order, vehiclesById, shopsById),
      ),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list work orders");
    res.status(500).json({ error: "Failed to list work orders" });
  }
});

router.post("/alset/work-orders", async (req, res) => {
  try {
    const user = await getRequestUser(req);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (!canCreateWorkOrder(user)) { res.status(403).json({ error: "Forbidden" }); return; }
    const parsed = CreateWorkOrderBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

    const [vehicle] = await db
      .select()
      .from(alsetVehiclesTable)
      .where(eq(alsetVehiclesTable.id, parsed.data.vehicleId))
      .limit(1);
    if (!vehicle) { res.status(404).json({ error: "Vehicle not found" }); return; }

    const [shopVehicleAssignment] =
      user.role === "shop"
        ? await db
            .select({ id: alsetWorkOrdersTable.id })
            .from(alsetWorkOrdersTable)
            .where(
              and(
                eq(alsetWorkOrdersTable.vehicleId, vehicle.id),
                eq(alsetWorkOrdersTable.shopId, user.userId),
              ),
            )
            .limit(1)
        : [];
    if (
      user.role !== "admin" &&
      !canViewVehicle(user, vehicle, {
        hasAssignedWorkOrder: shopVehicleAssignment !== undefined,
      })
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    let claimId: number | null = null;
    if (parsed.data.claimId !== undefined && parsed.data.claimId !== null) {
      const [claim] = await db
        .select()
        .from(alsetClaimsTable)
        .where(eq(alsetClaimsTable.id, parsed.data.claimId))
        .limit(1);
      if (!claim) { res.status(404).json({ error: "Claim not found" }); return; }
      if (claim.vehicleId !== vehicle.id) {
        res.status(400).json({ error: "Claim does not belong to the selected vehicle" });
        return;
      }
      if (user.role !== "admin" && !canViewClaim(user, claim)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      claimId = claim.id;
    }

    const [workOrder] = await db.insert(alsetWorkOrdersTable).values({
      workOrderNumber: genWoNumber(),
      claimId,
      vehicleId: parsed.data.vehicleId,
      shopId: user.role === "shop" ? user.userId : null,
      description: parsed.data.description,
      laborHours: parsed.data.laborHours?.toString() ?? null,
      partsTotal: parsed.data.partsTotal?.toString() ?? null,
      laborRate: parsed.data.laborRate?.toString() ?? null,
      startDate:
        parsed.data.startDate instanceof Date
          ? formatDateOnly(parsed.data.startDate)
          : (parsed.data.startDate ?? null),
      notes: parsed.data.notes ?? null,
    }).returning();

    const vehiclesById = new Map([
      [vehicle.id, { vin: vehicle.vin, model: vehicle.model }],
    ]);
    const [shop] =
      workOrder.shopId === null
        ? []
        : await db
            .select({ id: alsetUsersTable.id, name: alsetUsersTable.name })
            .from(alsetUsersTable)
            .where(eq(alsetUsersTable.id, workOrder.shopId))
            .limit(1);
    const shopsById = new Map(shop ? [[shop.id, shop.name]] : []);

    res.status(201).json(workOrderRow(workOrder, vehiclesById, shopsById));
  } catch (err) {
    req.log.error({ err }, "Failed to create work order");
    res.status(500).json({ error: "Failed to create work order" });
  }
});

router.get("/alset/work-orders/:id", async (req, res) => {
  try {
    const user = await getRequestUser(req);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const [workOrder] = await db
      .select()
      .from(alsetWorkOrdersTable)
      .where(eq(alsetWorkOrdersTable.id, Number(req.params.id)))
      .limit(1);
    if (!workOrder) { res.status(404).json({ error: "Work order not found" }); return; }

    const [vehicle, claim] = await Promise.all([
      db
        .select()
        .from(alsetVehiclesTable)
        .where(eq(alsetVehiclesTable.id, workOrder.vehicleId))
        .limit(1),
      workOrder.claimId
        ? db
            .select()
            .from(alsetClaimsTable)
            .where(eq(alsetClaimsTable.id, workOrder.claimId))
            .limit(1)
        : Promise.resolve([]),
    ]);
    if (
      !canViewWorkOrder(user, workOrder, {
        vehicleOwnerId: vehicle[0]?.ownerId ?? null,
        claimInsurerId: claim[0]?.insurerId ?? null,
      })
    ) { res.status(404).json({ error: "Work order not found" }); return; }

    const [shop] =
      workOrder.shopId === null
        ? []
        : await db
            .select({ id: alsetUsersTable.id, name: alsetUsersTable.name })
            .from(alsetUsersTable)
            .where(eq(alsetUsersTable.id, workOrder.shopId))
            .limit(1);

    res.json(
      workOrderRow(
        workOrder,
        new Map(
          vehicle.map((currentVehicle) => [
            currentVehicle.id,
            { vin: currentVehicle.vin, model: currentVehicle.model },
          ]),
        ),
        new Map(shop ? [[shop.id, shop.name]] : []),
      ),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get work order");
    res.status(500).json({ error: "Failed to get work order" });
  }
});

router.patch("/alset/work-orders/:id", async (req, res) => {
  try {
    const user = await getRequestUser(req);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const parsed = UpdateWorkOrderBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

    const [currentWorkOrder] = await db
      .select()
      .from(alsetWorkOrdersTable)
      .where(eq(alsetWorkOrdersTable.id, Number(req.params.id)))
      .limit(1);
    if (!currentWorkOrder) { res.status(404).json({ error: "Work order not found" }); return; }
    if (!canUpdateWorkOrder(user, currentWorkOrder)) { res.status(404).json({ error: "Work order not found" }); return; }

    const updates: any = { updatedAt: new Date() };
    if (parsed.data.status) updates.status = parsed.data.status;
    if (parsed.data.technicianName !== undefined) updates.technicianName = parsed.data.technicianName;
    if (parsed.data.laborHours !== undefined) updates.laborHours = parsed.data.laborHours?.toString() ?? null;
    if (parsed.data.partsTotal !== undefined) updates.partsTotal = parsed.data.partsTotal?.toString() ?? null;
    if (parsed.data.completionDate !== undefined) updates.completionDate = parsed.data.completionDate;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    const [workOrder] = await db
      .update(alsetWorkOrdersTable)
      .set(updates)
      .where(eq(alsetWorkOrdersTable.id, Number(req.params.id)))
      .returning();
    if (!workOrder) { res.status(404).json({ error: "Work order not found" }); return; }

    const [vehicle, shop] = await Promise.all([
      db
        .select({ id: alsetVehiclesTable.id, vin: alsetVehiclesTable.vin, model: alsetVehiclesTable.model })
        .from(alsetVehiclesTable)
        .where(eq(alsetVehiclesTable.id, workOrder.vehicleId))
        .limit(1),
      workOrder.shopId === null
        ? Promise.resolve([])
        : db
            .select({ id: alsetUsersTable.id, name: alsetUsersTable.name })
            .from(alsetUsersTable)
            .where(eq(alsetUsersTable.id, workOrder.shopId))
            .limit(1),
    ]);

    res.json(
      workOrderRow(
        workOrder,
        new Map(
          vehicle.map((currentVehicle) => [
            currentVehicle.id,
            { vin: currentVehicle.vin, model: currentVehicle.model },
          ]),
        ),
        new Map(shop.map((currentShop) => [currentShop.id, currentShop.name])),
      ),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to update work order");
    res.status(500).json({ error: "Failed to update work order" });
  }
});

export default router;
