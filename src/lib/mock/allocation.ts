import { bookingRepository } from "@/lib/mock/bookings";
import type { AuthorizedActor } from "@/types";
import type { Asset } from "@/types/asset";
import type { Booking } from "@/types/booking";
import { assetRepository } from "./assets";

export class AssetAllocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssetAllocationError";
  }
}

export interface AllocationEligibilityResult {
  eligible: boolean;
  reason?: string;
  asset?: Asset;
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
   * Enforces that MAINTENANCE and INACTIVE assets are strictly rejected for new allocations.
   * Validates capacity constraints and availability rules.
   */
  public checkAssetEligibility(
    actor: AuthorizedActor | null | undefined,
    assetId: string,
    requestedCapacity?: number,
  ): AllocationEligibilityResult {
    // System actor lookup to resolve authoritative physical asset
    const asset = assetRepository.getAssetByIdInternal(assetId);
    if (!asset) {
      return {
        eligible: false,
        reason: `Physical asset with ID "${assetId}" was not found.`,
      };
    }

    // Allocation rule 1: Reject MAINTENANCE assets
    if (asset.status === "MAINTENANCE") {
      return {
        eligible: false,
        reason: `Asset "${asset.name}" (${asset.code}) is currently in MAINTENANCE status. New allocations are blocked.`,
        asset,
      };
    }

    // Allocation rule 2: Reject INACTIVE assets
    if (asset.status === "INACTIVE") {
      return {
        eligible: false,
        reason: `Asset "${asset.name}" (${asset.code}) is currently INACTIVE (decommissioned/drydock). New allocations are blocked.`,
        asset,
      };
    }

    // Allocation rule 3: Validate applicable certified capacity
    if (requestedCapacity !== undefined && requestedCapacity > 0) {
      if (requestedCapacity > asset.capacity) {
        return {
          eligible: false,
          reason: `Requested capacity (${requestedCapacity} pax) exceeds certified capacity (${asset.capacity} pax) for asset "${asset.code}".`,
          asset,
        };
      }
    }

    return {
      eligible: true,
      asset,
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
    const asset = assetRepository.getAssetByIdInternal(assetId);
    if (!asset) return [];

    const result = bookingRepository.listBookings({ pageSize: 100 });
    return result.items
      .filter((b: Booking) => {
        // Matches bookings assigned to this asset or matching internal asset reference
        const matchAsset =
          b.dynamicFields?.allocatedAssetId === asset.id ||
          b.dynamicFields?.allocatedAssetCode === asset.code ||
          b.assignedStaffName?.includes(asset.code);

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
   * Fails if the asset is in MAINTENANCE or INACTIVE status.
   */
  public allocateAssetToBooking(
    actor: AuthorizedActor | null | undefined,
    assetId: string,
    bookingId: string,
    requestedCapacity?: number,
  ): { success: boolean; booking: Booking; message: string; assetId: string; bookingId: string } {
    const eligibility = this.checkAssetEligibility(actor, assetId, requestedCapacity);
    if (!eligibility.eligible || !eligibility.asset) {
      throw new AssetAllocationError(
        eligibility.reason || `Asset allocation rejected for "${assetId}".`,
      );
    }

    const booking = bookingRepository.getBookingById(bookingId);
    if (!booking) {
      throw new AssetAllocationError(`Booking "${bookingId}" was not found.`);
    }

    // Apply allocation
    booking.dynamicFields = {
      ...booking.dynamicFields,
      allocatedAssetId: eligibility.asset.id,
      allocatedAssetCode: eligibility.asset.code,
      allocatedAssetName: eligibility.asset.name,
    };
    booking.assignmentStatus = "ASSIGNED";
    booking.updatedAt = new Date().toISOString();

    return {
      success: true,
      booking,
      assetId: eligibility.asset.id,
      bookingId: booking.id,
      message: `Asset "${eligibility.asset.name}" (${eligibility.asset.code}) successfully allocated to booking ${booking.reference}.`,
    };
  }
}

export const assetAllocationService = new AssetAllocationService();
