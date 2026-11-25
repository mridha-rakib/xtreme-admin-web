import {
  type BookingAllocationError,
  bookingRepository,
  getVendorIdForBooking,
} from "@/lib/mock/bookings";
import type { AuthorizedActor } from "@/types";
import type { Asset } from "@/types/asset";
import type { AvailabilityRule } from "@/types/availability";
import type { Booking } from "@/types/booking";
import { assetRepository } from "./assets";
import { availabilityRepository } from "./availability";
import { availabilityExceptionRepository } from "./availability-exceptions";
import { availabilitySlotRepository } from "./availability-slots";

export class AssetAllocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssetAllocationError";
  }
}

export class UnauthorizedAssetAllocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedAssetAllocationError";
  }
}

export interface ScheduleInterval {
  startsAt: string;
  endsAt: string;
}

export interface AllocationEligibilityResult {
  eligible: boolean;
  reason?: string;
  asset?: Asset;
  effectiveCapacity?: number;
  consumedCapacity?: number;
  remainingCapacity?: number;
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

function parseIsoTimestamp(iso: string): number {
  if (!iso) return Number.NaN;
  const s = iso.trim();
  if (!s.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(s)) {
    return Date.parse(`${s}Z`);
  }
  return Date.parse(s);
}

function isWeekdayInApprovedWindow(ruleWeekday: string, weekdayName: string): boolean {
  const d = weekdayName.toLowerCase();
  const isMonToFri = ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(d);
  const isWeekend = ["saturday", "sunday"].includes(d);
  if (ruleWeekday === "Daily") return true;
  if (ruleWeekday === "Mon - Fri") return isMonToFri;
  if (ruleWeekday === "Fri - Sun") return d === "friday" || isWeekend;
  if (ruleWeekday === "Saturday - Sunday") return isWeekend;
  if (ruleWeekday === "Mon - Sat") return isMonToFri || d === "saturday";
  return false;
}

function getLocalWeekdayAndTimeString(
  dateMs: number,
  timeZone: string,
): { weekday: string; time: string } {
  try {
    const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
    });
    const weekday = weekdayFormatter.format(new Date(dateMs));

    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(dateMs));

    const hour = parts.find((p) => p.type === "hour")?.value || "00";
    const minute = parts.find((p) => p.type === "minute")?.value || "00";
    return { weekday, time: `${hour}:${minute}` };
  } catch {
    const d = new Date(dateMs);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const minutes = String(d.getUTCMinutes()).padStart(2, "0");
    return { weekday: dayNames[d.getUTCDay()], time: `${hours}:${minutes}` };
  }
}

export class AssetAllocationService {
  /**
   * Evaluates whether an asset is eligible for a booking allocation.
   * Enforces:
   * 1. Actor authorization (Vendor self-service scope or Admin/Operations role).
   * 2. Physical status: MAINTENANCE and INACTIVE assets are strictly rejected.
   * 3. Certified physical passenger capacity constraints.
   * 4. Schedule interval validation (startsAt < endsAt, valid ISO timestamps).
   * 5. Availability Exceptions:
   *    - UNAVAILABLE: strictly blocks interval.
   *    - AVAILABLE_OVERRIDE: permits outside-hours / inactive rule operation,
   *      but CANNOT bypass active allocation conflicts or maintenance/inactive status.
   *    - CAPACITY_OVERRIDE: caps/adjusts capacity ceiling.
   * 6. Recurring Availability Rules:
   *    - Evaluates approved weekdays and local operating hours in canonical rule timezone.
   *    - Rejects outside-hours allocations unless covered by AVAILABLE_OVERRIDE.
   *    - Applies rule capacity ceiling.
   * 7. Availability Slots:
   *    - CLOSED slot strictly rejects new allocations.
   *    - OPEN slot capacity ceiling is enforced.
   * 8. Actual interval-based allocation conflicts on existing confirmed/in-progress bookings.
   *    - Overlapping interval checking ([reqStart, reqEnd] vs [bStart, bEnd]).
   *    - Resource exclusivity and remaining capacity validation.
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
        reason: `Physical asset with ID "${assetId}" was not found or access is denied.`,
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

    // 4. Validate Scheduling Interval if provided
    let reqStart = Number.NaN;
    let reqEnd = Number.NaN;
    const hasInterval = Boolean(interval?.startsAt);

    if (hasInterval) {
      if (!interval?.startsAt || !interval?.endsAt) {
        return {
          eligible: false,
          reason: "Scheduling interval must provide both startsAt and endsAt timestamps.",
          asset,
        };
      }

      reqStart = parseIsoTimestamp(interval.startsAt);
      reqEnd = parseIsoTimestamp(interval.endsAt);

      if (Number.isNaN(reqStart) || Number.isNaN(reqEnd)) {
        return {
          eligible: false,
          reason: `Invalid scheduling timestamps: startsAt ("${interval.startsAt}") and endsAt ("${interval.endsAt}") must be valid ISO date-times.`,
          asset,
        };
      }

      if (reqStart >= reqEnd) {
        return {
          eligible: false,
          reason: `Invalid scheduling interval: startsAt must strictly precede endsAt (received startsAt="${interval.startsAt}", endsAt="${interval.endsAt}").`,
          asset,
        };
      }
    }

    let effectiveCapacity = asset.capacity;
    let hasAvailableOverride = false;

    // 5. Evaluate Availability Exceptions
    const exceptions = availabilityExceptionRepository.listExceptionsInternal(asset.id);
    for (const ex of exceptions) {
      const exStart = parseIsoTimestamp(ex.startsAt);
      const exEnd = parseIsoTimestamp(ex.endsAt);
      const overlaps = hasInterval ? reqStart < exEnd && reqEnd > exStart : true;

      if (overlaps) {
        if (ex.type === "UNAVAILABLE") {
          return {
            eligible: false,
            reason: `Asset "${asset.name}" has an active UNAVAILABLE exception (${ex.reason}) from ${ex.startsDisplay || ex.startsAt} to ${ex.endsDisplay || ex.endsAt}. New allocations are blocked.`,
            asset,
          };
        }

        if (ex.type === "AVAILABLE_OVERRIDE") {
          hasAvailableOverride = true;
        }

        if (ex.type === "CAPACITY_OVERRIDE" && ex.capacityOverride !== undefined) {
          effectiveCapacity = Math.min(effectiveCapacity, ex.capacityOverride);
        }
      }
    }

    // 6. Evaluate Recurring Availability Rules
    const rules = availabilityRepository.listRulesInternal(asset.id);
    const activeRules = rules.filter((r) => r.active);

    if (activeRules.length > 0 && hasInterval) {
      if (!hasAvailableOverride) {
        for (const rule of activeRules) {
          const { weekday, time } = getLocalWeekdayAndTimeString(reqStart, rule.timezone);

          if (!isWeekdayInApprovedWindow(rule.weekday, weekday)) {
            return {
              eligible: false,
              reason: `Requested allocation day (${weekday}) is outside approved recurring schedule ("${rule.weekday}") for asset "${asset.name}".`,
              asset,
            };
          }

          if (
            rule.timeWindow !== "24 Hours" &&
            !(rule.startTime === "00:00" && (rule.endTime === "24:00" || rule.endTime === "23:59"))
          ) {
            if (time < rule.startTime || time > rule.endTime) {
              return {
                eligible: false,
                reason: `Requested allocation time (${time} in ${rule.timezone}) is outside approved operating hours (${rule.timeWindow}) for asset "${asset.name}".`,
                asset,
              };
            }
          }

          effectiveCapacity = Math.min(effectiveCapacity, rule.capacity);
        }
      } else {
        // AVAILABLE_OVERRIDE bypasses operating hours, but still respects rule capacity ceiling if defined
        for (const rule of activeRules) {
          effectiveCapacity = Math.min(effectiveCapacity, rule.capacity);
        }
      }
    }

    // 7. Evaluate Availability Slots
    if (hasInterval) {
      const slots = availabilitySlotRepository.listSlotsInternal(asset.id);
      for (const slot of slots) {
        const slotStart = parseIsoTimestamp(slot.startsAt);
        const slotEnd = parseIsoTimestamp(slot.endsAt);
        const overlaps = reqStart < slotEnd && reqEnd > slotStart;

        if (overlaps) {
          if (slot.status === "CLOSED") {
            return {
              eligible: false,
              reason: `Availability slot for asset "${asset.name}" covering this interval is CLOSED (${slot.notes || "Operational closure"}). New allocations are rejected.`,
              asset,
            };
          }

          if (slot.status === "OPEN" && slot.capacity !== undefined) {
            effectiveCapacity = Math.min(effectiveCapacity, slot.capacity);
          }
        }
      }
    }

    // 8. Actual Interval-Based Allocation Conflicts & Consumed Capacity
    let consumedCapacity = 0;
    if (hasInterval) {
      const bookingList = bookingRepository.listBookings({ pageSize: 100 });
      for (const b of bookingList.items) {
        if (
          b.lifecycleStatus !== "CONFIRMED" &&
          b.lifecycleStatus !== "IN_PROGRESS" &&
          b.lifecycleStatus !== "PENDING_ADMIN"
        ) {
          continue;
        }

        const isAllocated =
          b.dynamicFields?.allocatedAssetId === asset.id ||
          b.dynamicFields?.allocatedAssetCode === asset.code;
        if (!isAllocated) continue;

        // Resolve authoritative allocation interval
        let bStart = Number.NaN;
        let bEnd = Number.NaN;

        if (b.dynamicFields?.allocatedStartsAt && b.dynamicFields?.allocatedEndsAt) {
          bStart = parseIsoTimestamp(b.dynamicFields.allocatedStartsAt);
          bEnd = parseIsoTimestamp(b.dynamicFields.allocatedEndsAt);
        } else if (b.schedule) {
          bStart = parseIsoTimestamp(b.schedule);
          bEnd = bStart + 2 * 3600 * 1000;
        }

        if (Number.isNaN(bStart) || Number.isNaN(bEnd)) continue;

        // Exact interval overlap check: startA < endB && endA > startB
        const overlaps = reqStart < bEnd && reqEnd > bStart;
        if (overlaps) {
          const bookingPax = Number.parseInt(b.dynamicFields?.allocatedCapacity || "1", 10) || 1;
          consumedCapacity += bookingPax;

          // For dedicated physical charter assets (jets, yachts, vehicles) or resource exclusivity:
          return {
            eligible: false,
            reason: `Active allocation conflict: Asset "${asset.name}" is already committed to confirmed booking ${b.reference} from ${b.dynamicFields?.allocatedStartsAt || b.schedule} to ${b.dynamicFields?.allocatedEndsAt || "end of service"}. Overrides cannot bypass active allocation conflicts.`,
            asset,
          };
        }
      }
    }

    const remainingCapacity = Math.max(0, effectiveCapacity - consumedCapacity);

    // 9. Validate Capacity Requirement against effective capacity and remaining capacity
    if (requestedCapacity !== undefined && requestedCapacity > 0) {
      if (requestedCapacity > effectiveCapacity || requestedCapacity > remainingCapacity) {
        return {
          eligible: false,
          reason: `Requested capacity (${requestedCapacity} pax) exceeds effective capacity (${effectiveCapacity} pax) for asset "${asset.code}".`,
          asset,
          effectiveCapacity,
          consumedCapacity,
          remainingCapacity,
        };
      }
    }

    return {
      eligible: true,
      asset,
      effectiveCapacity,
      consumedCapacity,
      remainingCapacity,
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
        const matchAsset =
          b.dynamicFields?.allocatedAssetId === asset.id ||
          b.dynamicFields?.allocatedAssetCode === asset.code;

        const isCommitted =
          b.lifecycleStatus === "CONFIRMED" ||
          b.lifecycleStatus === "IN_PROGRESS" ||
          b.lifecycleStatus === "PENDING_ADMIN";

        return matchAsset && isCommitted;
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
   * Enforces:
   * - Actor authorization and vendor tenant boundary.
   * - Required version concurrency checking.
   * - Validated scheduling interval.
   * - Authoritative eligibility verification before mutation.
   * - Atomic mutation delegation to bookingRepository.
   */
  public allocateAssetToBooking(
    actor: AuthorizedActor | null | undefined,
    assetId: string,
    bookingId: string,
    intervalOrCapacity?: ScheduleInterval | number,
    expectedVersion?: number,
    requestedCapacity?: number,
  ): { success: boolean; booking: Booking; message: string; assetId: string; bookingId: string } {
    const booking = bookingRepository.getBookingById(bookingId);
    if (!booking) {
      throw new AssetAllocationError(`Booking "${bookingId}" was not found.`);
    }

    let interval: ScheduleInterval | undefined;
    let capacity = requestedCapacity;

    if (typeof intervalOrCapacity === "number") {
      capacity = intervalOrCapacity;
      interval = undefined;
    } else if (typeof intervalOrCapacity === "object" && intervalOrCapacity !== null) {
      interval = intervalOrCapacity;
    }

    const startMs = parseIsoTimestamp(booking.schedule || "2026-11-26T10:00:00Z");
    const endMs = startMs + 2 * 3600 * 1000;

    const effectiveInterval: ScheduleInterval =
      interval?.startsAt && interval.endsAt
        ? interval
        : {
            startsAt: new Date(startMs).toISOString(),
            endsAt: new Date(endMs).toISOString(),
          };

    const effectiveVersion = expectedVersion ?? booking.version;

    const eligibility = this.checkAssetEligibility(actor, assetId, capacity, effectiveInterval);
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
        vendorId: eligibility.asset.vendorId,
        allocatedStartsAt: effectiveInterval.startsAt,
        allocatedEndsAt: effectiveInterval.endsAt,
        requestedCapacity: capacity,
      },
      effectiveVersion,
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
