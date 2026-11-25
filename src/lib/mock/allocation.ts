import { bookingRepository } from "@/lib/mock/bookings";
import type { AuthorizedActor } from "@/types";
import type { Asset } from "@/types/asset";
import type { Booking } from "@/types/booking";
import { assetRepository } from "./assets";
import { availabilityExceptionRepository } from "./availability-exceptions";
import { availabilitySlotRepository } from "./availability-slots";

export class AssetAllocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssetAllocationError";
  }
}

export interface ScheduleInterval {
  startsAt?: string;
  endsAt?: string;
}

export interface AllocationEligibilityResult {
  eligible: boolean;
  reason?: string;
  asset?: Asset;
  effectiveCapacity?: number;
}

export interface ActiveCommitmentRecord {
  bookingId: string;
  reference: string;
  customerName: string;
  schedule: string;
  lifecycleStatus: string;
  paymentStatus: string;
  assetId: string;
  assetCode: string;
  preserved: boolean;
}

export class AssetAllocationService {
  /**
   * Evaluates whether an asset is eligible for a NEW booking allocation.
   * Enforces:
   * 1. Actor authorization (Vendor self-service scope or Admin/Operations role).
   * 2. MAINTENANCE and INACTIVE assets are strictly rejected for new allocations.
   * 3. Certified passenger capacity constraints.
   * 4. Date/time-aware interval evaluation against Availability Exceptions and Slots.
   *    - UNAVAILABLE exception blocks interval.
   *    - AVAILABLE_OVERRIDE applies approved override but CANNOT bypass active allocation conflicts or maintenance/inactive status.
   *    - CAPACITY_OVERRIDE adjusts remaining capacity.
   *    - CLOSED slot rejects new allocations.
   * 5. Active allocation conflicts on existing confirmed bookings.
   */
  public checkAssetEligibility(
    actor: AuthorizedActor | null | undefined,
    assetId: string,
    requestedCapacity?: number,
    interval?: ScheduleInterval,
  ): AllocationEligibilityResult {
    // 1. Authoritative actor lookup enforcing tenant boundary & permissions
    const asset = assetRepository.getAssetById(actor, assetId);
    if (!asset) {
      return {
        eligible: false,
        reason: `Physical asset with ID "${assetId}" was not found.`,
      };
    }

    // 2. Reject MAINTENANCE assets
    if (asset.status === "MAINTENANCE") {
      return {
        eligible: false,
        reason: `Asset "${asset.name}" (${asset.code}) is currently in MAINTENANCE status. New allocations are blocked.`,
        asset,
      };
    }

    // 3. Reject INACTIVE assets
    if (asset.status === "INACTIVE") {
      return {
        eligible: false,
        reason: `Asset "${asset.name}" (${asset.code}) is currently INACTIVE (decommissioned/drydock). New allocations are blocked.`,
        asset,
      };
    }

    // 4. Evaluate Exceptions
    let effectiveCapacity = asset.capacity;
    const exceptions = availabilityExceptionRepository.listExceptionsInternal(asset.id);

    const reqStart = interval?.startsAt ? Date.parse(interval.startsAt) : Number.NaN;
    const reqEnd = interval?.endsAt ? Date.parse(interval.endsAt) : reqStart;
    const hasInterval = !Number.isNaN(reqStart);

    for (const ex of exceptions) {
      const exStart = Date.parse(ex.startsAt);
      const exEnd = Date.parse(ex.endsAt);
      const overlaps = hasInterval
        ? reqStart <= exEnd && (Number.isNaN(reqEnd) ? reqStart : reqEnd) >= exStart
        : true; // If no interval is passed, any active/future exception is evaluated

      if (overlaps) {
        if (ex.type === "UNAVAILABLE") {
          return {
            eligible: false,
            reason: `Asset "${asset.name}" has an active UNAVAILABLE exception (${ex.reason}) from ${ex.startsDisplay || ex.startsAt} to ${ex.endsDisplay || ex.endsAt}. New allocations are blocked.`,
            asset,
          };
        }

        if (ex.type === "CAPACITY_OVERRIDE" && ex.capacityOverride !== undefined) {
          effectiveCapacity = Math.min(effectiveCapacity, ex.capacityOverride);
        }
      }
    }

    // 5. Evaluate Slots
    if (hasInterval) {
      const slots = availabilitySlotRepository.listSlotsInternal(asset.id);
      for (const slot of slots) {
        const slotStart = Date.parse(slot.startsAt);
        const slotEnd = Date.parse(slot.endsAt);
        const overlaps =
          reqStart <= slotEnd && (Number.isNaN(reqEnd) ? reqStart : reqEnd) >= slotStart;

        if (overlaps && slot.status === "CLOSED") {
          return {
            eligible: false,
            reason: `Availability slot for asset "${asset.name}" covering this interval is CLOSED (${slot.notes || "Operational closure"}). New allocations are rejected.`,
            asset,
          };
        }
      }
    }

    // 6. Validate capacity constraint against effective capacity
    if (requestedCapacity !== undefined && requestedCapacity > 0) {
      if (requestedCapacity > effectiveCapacity) {
        return {
          eligible: false,
          reason: `Requested capacity (${requestedCapacity} pax) exceeds effective capacity (${effectiveCapacity} pax) for asset "${asset.code}".`,
          asset,
          effectiveCapacity,
        };
      }
    }

    // 7. Check Active Allocation Conflicts on existing confirmed bookings
    if (hasInterval) {
      const bookingList = bookingRepository.listBookings({ pageSize: 100 });
      const conflict = bookingList.items.find((b: Booking) => {
        if (
          b.lifecycleStatus !== "CONFIRMED" &&
          b.lifecycleStatus !== "IN_PROGRESS" &&
          b.lifecycleStatus !== "PENDING_ADMIN"
        ) {
          return false;
        }

        const isAllocated =
          b.dynamicFields?.allocatedAssetId === asset.id ||
          b.dynamicFields?.allocatedAssetCode === asset.code;
        if (!isAllocated) return false;

        const bkgTime = Date.parse(b.schedule);
        if (Number.isNaN(bkgTime)) return false;

        // Interval conflict within 3 hours
        const diffMs = Math.abs(bkgTime - reqStart);
        return diffMs < 3 * 3600 * 1000;
      });

      if (conflict) {
        return {
          eligible: false,
          reason: `Active allocation conflict: Asset "${asset.name}" is already committed to confirmed booking ${conflict.reference} at ${conflict.scheduleDisplay || conflict.schedule}. Overrides cannot bypass active allocation conflicts.`,
          asset,
        };
      }
    }

    return {
      eligible: true,
      asset,
      effectiveCapacity,
    };
  }

  /**
   * Retrieves all active confirmed booking commitments associated with an asset.
   * Confirmed commitments remain active and require explicit Operations review;
   * they are NEVER silently cancelled when asset status changes.
   */
  public getActiveCommitmentsForAsset(
    actor: AuthorizedActor | null | undefined,
    assetId: string,
  ): ActiveCommitmentRecord[] {
    const asset = assetRepository.getAssetById(actor, assetId);
    if (!asset) return [];

    const result = bookingRepository.listBookings({ pageSize: 100 });
    return result.items
      .filter((b: Booking) => {
        // Stable typed allocation reference model
        const matchAsset =
          b.dynamicFields?.allocatedAssetId === asset.id ||
          b.dynamicFields?.allocatedAssetCode === asset.code;

        const isConfirmed =
          b.lifecycleStatus === "CONFIRMED" ||
          b.lifecycleStatus === "IN_PROGRESS" ||
          b.lifecycleStatus === "PENDING_ADMIN";

        return matchAsset && isConfirmed;
      })
      .map((b: Booking) => ({
        bookingId: b.id,
        reference: b.reference,
        customerName: b.customerName,
        schedule: b.schedule,
        lifecycleStatus: b.lifecycleStatus,
        paymentStatus: b.paymentStatus,
        assetId: asset.id,
        assetCode: asset.code,
        preserved: true,
      }));
  }

  /**
   * Attempts to allocate an asset to a booking.
   * Atomically delegates to bookingRepository.allocateAssetToBooking.
   */
  public allocateAssetToBooking(
    actor: AuthorizedActor | null | undefined,
    assetId: string,
    bookingId: string,
    requestedCapacity?: number,
    expectedVersion?: number,
  ): { success: boolean; booking: Booking; message: string; assetId: string; bookingId: string } {
    const booking = bookingRepository.getBookingById(bookingId);
    if (!booking) {
      throw new AssetAllocationError(`Booking "${bookingId}" was not found.`);
    }

    const interval: ScheduleInterval | undefined = booking.schedule
      ? { startsAt: booking.schedule, endsAt: booking.schedule }
      : undefined;

    const eligibility = this.checkAssetEligibility(actor, assetId, requestedCapacity, interval);
    if (!eligibility.eligible || !eligibility.asset) {
      throw new AssetAllocationError(
        eligibility.reason || `Asset allocation rejected for "${assetId}".`,
      );
    }

    // Atomic mutation boundary through bookingRepository
    const updatedBooking = bookingRepository.allocateAssetToBooking(
      actor,
      bookingId,
      {
        assetId: eligibility.asset.id,
        assetCode: eligibility.asset.code,
        assetName: eligibility.asset.name,
      },
      expectedVersion ?? booking.version,
    );

    return {
      success: true,
      booking: updatedBooking,
      assetId: eligibility.asset.id,
      bookingId: updatedBooking.id,
      message: `Asset "${eligibility.asset.name}" (${eligibility.asset.code}) successfully allocated to booking ${updatedBooking.reference}.`,
    };
  }
}

export const assetAllocationService = new AssetAllocationService();
