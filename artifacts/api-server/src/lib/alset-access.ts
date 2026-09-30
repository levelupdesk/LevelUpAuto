import type {
  AlsetClaim,
  AlsetRental,
  AlsetTowing,
  AlsetVehicle,
  AlsetWorkOrder,
} from "@workspace/db/schema";
import type { AlsetSession } from "./alset-auth";

export function canCreateVehicle(user: AlsetSession): boolean {
  return user.role === "owner" || user.role === "admin";
}

export function canViewVehicle(
  user: AlsetSession,
  vehicle: AlsetVehicle,
  options: { hasAssignedWorkOrder?: boolean } = {},
): boolean {
  return (
    user.role === "admin" ||
    (user.role === "shop" && options.hasAssignedWorkOrder === true) ||
    (user.role === "owner" && vehicle.ownerId === user.userId)
  );
}

export function canCreateClaim(user: AlsetSession): boolean {
  return user.role === "owner" || user.role === "admin";
}

export function canViewClaim(user: AlsetSession, claim: AlsetClaim): boolean {
  return (
    user.role === "admin" ||
    (user.role === "owner" && claim.ownerId === user.userId) ||
    (user.role === "insurer" && claim.insurerId === user.userId)
  );
}

export function canUpdateClaim(
  user: AlsetSession,
  claim: AlsetClaim,
): boolean {
  return (
    user.role === "admin" ||
    (user.role === "insurer" && claim.insurerId === user.userId)
  );
}

export function canCreateWorkOrder(user: AlsetSession): boolean {
  return user.role === "shop" || user.role === "admin";
}

export function canViewWorkOrder(
  user: AlsetSession,
  workOrder: AlsetWorkOrder,
  options: { vehicleOwnerId?: number | null; claimInsurerId?: number | null } = {},
): boolean {
  return (
    user.role === "admin" ||
    (user.role === "shop" && workOrder.shopId === user.userId) ||
    (user.role === "owner" && options.vehicleOwnerId === user.userId) ||
    (user.role === "insurer" && options.claimInsurerId === user.userId)
  );
}

export function canUpdateWorkOrder(
  user: AlsetSession,
  workOrder: AlsetWorkOrder,
): boolean {
  return (
    user.role === "admin" ||
    (user.role === "shop" && workOrder.shopId === user.userId)
  );
}

export function canCreateTowingJob(user: AlsetSession): boolean {
  return user.role === "owner" || user.role === "admin";
}

export function canViewTowingJob(
  user: AlsetSession,
  towingJob: AlsetTowing,
): boolean {
  return (
    user.role === "admin" ||
    (user.role === "owner" && towingJob.requestedById === user.userId) ||
    (user.role === "towing" &&
      (towingJob.assignedCompanyId === null ||
        towingJob.assignedCompanyId === user.userId))
  );
}

export function canUpdateTowingJob(
  user: AlsetSession,
  towingJob: AlsetTowing,
): boolean {
  return (
    user.role === "admin" ||
    (user.role === "towing" && towingJob.assignedCompanyId === user.userId)
  );
}

export function canCreateRental(user: AlsetSession): boolean {
  return user.role === "owner" || user.role === "admin";
}

export function canViewRental(
  user: AlsetSession,
  rental: AlsetRental,
): boolean {
  return (
    user.role === "admin" ||
    (user.role === "owner" && rental.ownerId === user.userId) ||
    (user.role === "rental" &&
      (rental.rentalCompanyId === null ||
        rental.rentalCompanyId === user.userId))
  );
}

export function canUpdateRental(
  user: AlsetSession,
  rental: AlsetRental,
): boolean {
  return (
    user.role === "admin" ||
    (user.role === "rental" && rental.rentalCompanyId === user.userId)
  );
}
