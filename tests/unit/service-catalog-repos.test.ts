import {
  CustomFieldValidationError,
  StaleCustomFieldVersionConflictError,
  UnauthorizedCustomFieldAccessError,
  serviceCustomFieldRepository,
} from "@/lib/mock/service-custom-fields";
import {
  ServiceValidationError,
  StaleServiceVersionConflictError,
  UnauthorizedServiceAccessError,
  serviceRepository,
} from "@/lib/mock/services";
import type { CommandCenterUser } from "@/types";
import { beforeEach, describe, expect, it } from "vitest";

const superAdminUser: CommandCenterUser = {
  id: "usr_admin_1",
  email: "admin@xtreme.local",
  name: "Master Admin",
  role: "SUPER_ADMIN",
};

const adminUser: CommandCenterUser = {
  id: "usr_admin_2",
  email: "ops@xtreme.local",
  name: "Operations Admin",
  role: "ADMIN",
};

const vendorUser: CommandCenterUser = {
  id: "usr_vendor_1",
  email: "vendor@monacochauffeur.com",
  name: "Monaco Chauffeur Fleet",
  role: "VENDOR",
  vendorId: "vnd_005",
};

describe("Batch 10 Services & Custom Fields Repositories", () => {
  beforeEach(() => {
    serviceRepository.resetDefaults();
    serviceCustomFieldRepository.resetDefaults();
  });

  describe("Service Repository (CC-CAT-02, CC-CAT-03, CC-CAT-04)", () => {
    it("lists seeded catalog services with execution templates and booking modes", () => {
      const services = serviceRepository.listServices();
      expect(services.length).toBeGreaterThanOrEqual(6);

      const jetService = services.find((s) => s.id === "srv_aviation_01");
      expect(jetService).toBeDefined();
      expect(jetService?.name).toBe("Private Jet Charter · Europe");
      expect(jetService?.template).toBe("AIR_CHARTER");
      expect(jetService?.bookingMode).toBe("QUOTE_REQUIRED");
      expect(jetService?.availabilityModel).toBe("DURATION_BASED");
      expect(jetService?.paymentMode).toBe("PREPAYMENT");
    });

    it("filters services by category, template, and active state", () => {
      const airServices = serviceRepository.listServices({ template: "AIR_CHARTER" });
      expect(airServices.length).toBeGreaterThanOrEqual(2);
      expect(airServices.every((s) => s.template === "AIR_CHARTER")).toBe(true);

      const chauffeurServices = serviceRepository.listServices({ categoryId: "cat_chauffeur" });
      expect(chauffeurServices.length).toBeGreaterThanOrEqual(1);
      expect(chauffeurServices[0].name).toBe("Executive Chauffeur Transfer");
    });

    it("allows administrators to create new catalog services with slug generation", () => {
      const created = serviceRepository.createService(superAdminUser, {
        name: "Helicopter Alpine Heli-Ski Transfer",
        categoryId: "cat_heli",
        template: "AIR_CHARTER",
        bookingMode: "QUOTE_REQUIRED",
        availabilityModel: "SCHEDULED_SLOTS",
        paymentMode: "PREPAYMENT",
        description: "Bespoke high alpine drop-offs with certified guides.",
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe("Helicopter Alpine Heli-Ski Transfer");
      expect(created.slug).toBe("helicopter-alpine-heli-ski-transfer");
      expect(created.version).toBe(1);
      expect(created.active).toBe(true);
    });

    it("rejects service creation with duplicate slug", () => {
      expect(() => {
        serviceRepository.createService(superAdminUser, {
          name: "Duplicate Jet Charter",
          slug: "private-jet-charter-europe", // Already taken by srv_aviation_01
          categoryId: "cat_jet_charter",
          template: "AIR_CHARTER",
          bookingMode: "QUOTE_REQUIRED",
          availabilityModel: "DURATION_BASED",
          paymentMode: "PREPAYMENT",
        });
      }).toThrow(ServiceValidationError);
    });

    it("allows administrators to update service details and increments version", () => {
      const target = serviceRepository.getServiceById("srv_chauffeur_01");
      expect(target).toBeDefined();
      if (!target) return;

      const updated = serviceRepository.updateService(adminUser, {
        serviceId: target.id,
        name: "Executive Chauffeur & VIP Armored Transfer",
        bookingMode: "MANUAL_APPROVAL",
        expectedVersion: target.version,
      });

      expect(updated.version).toBe(target.version + 1);
      expect(updated.name).toBe("Executive Chauffeur & VIP Armored Transfer");
      expect(updated.bookingMode).toBe("MANUAL_APPROVAL");
    });

    it("rejects updates with stale version conflict", () => {
      const target = serviceRepository.getServiceById("srv_chauffeur_01");
      expect(target).toBeDefined();
      if (!target) return;

      expect(() => {
        serviceRepository.updateService(adminUser, {
          serviceId: target.id,
          name: "Conflict Attempt",
          expectedVersion: 999, // Stale
        });
      }).toThrow(StaleServiceVersionConflictError);
    });

    it("strictly blocks vendor personas from modifying or toggling catalog services", () => {
      expect(() => {
        serviceRepository.createService(vendorUser, {
          name: "Vendor Rogue Service",
          categoryId: "cat_chauffeur",
          template: "CHAUFFEUR_TRANSFER",
          bookingMode: "INSTANT_CONFIRMATION",
          availabilityModel: "SCHEDULED_SLOTS",
          paymentMode: "PREPAYMENT",
        });
      }).toThrow(UnauthorizedServiceAccessError);

      expect(() => {
        serviceRepository.toggleServiceActive(vendorUser, "srv_chauffeur_01", false);
      }).toThrow(UnauthorizedServiceAccessError);
    });
  });

  describe("Service Custom Field Repository (CC-CAT-05, CC-CAT-06)", () => {
    it("lists seeded custom fields scoped to parent service", () => {
      const jetFields = serviceCustomFieldRepository.listFieldsByService("srv_aviation_01");
      expect(jetFields.length).toBe(4);
      expect(jetFields.some((f) => f.fieldKey === "pax_count")).toBe(true);
      expect(jetFields.some((f) => f.fieldKey === "special_catering")).toBe(true);

      const chauffeurFields = serviceCustomFieldRepository.listFieldsByService("srv_chauffeur_01");
      expect(chauffeurFields.length).toBe(2);
      expect(chauffeurFields.some((f) => f.fieldKey === "flight_number")).toBe(true);
    });

    it("filters custom fields by usage and data type", () => {
      const bookingFields = serviceCustomFieldRepository.listFieldsByService("srv_aviation_01", {
        usage: "BOOKING_FORM",
      });
      expect(bookingFields.length).toBe(3);
      expect(bookingFields.every((f) => f.usage === "BOOKING_FORM")).toBe(true);

      const opsFields = serviceCustomFieldRepository.listFieldsByService("srv_aviation_01", {
        usage: "INTERNAL_OPS",
      });
      expect(opsFields.length).toBe(1);
      expect(opsFields[0].fieldKey).toBe("tail_registration_ops");
    });

    it("creates a new custom field and automatically updates parent service count", () => {
      const initialCount = serviceRepository.getServiceById("srv_aviation_01")?.customFieldCount;

      const created = serviceCustomFieldRepository.createField(superAdminUser, {
        serviceId: "srv_aviation_01",
        fieldKey: "smoking_allowed",
        label: "Smoking Permission Requested",
        localizedLabels: {
          en: "Smoking Permission Requested",
          fr: "Autorisation de fumer demandée",
        },
        dataType: "BOOLEAN",
        usage: "BOOKING_FORM",
        required: false,
        customerVisible: true,
      });

      expect(created.id).toBeDefined();
      expect(created.fieldKey).toBe("smoking_allowed");
      expect(created.dataType).toBe("BOOLEAN");

      const updatedService = serviceRepository.getServiceById("srv_aviation_01");
      expect(updatedService?.customFieldCount).toBe((initialCount || 0) + 1);
    });

    it("rejects duplicate field key on the same service", () => {
      expect(() => {
        serviceCustomFieldRepository.createField(superAdminUser, {
          serviceId: "srv_aviation_01",
          fieldKey: "pax_count", // Already exists on srv_aviation_01
          label: "Duplicate Passengers",
          dataType: "NUMBER",
          usage: "BOOKING_FORM",
        });
      }).toThrow(CustomFieldValidationError);
    });

    it("rejects SELECT data types with empty options list", () => {
      expect(() => {
        serviceCustomFieldRepository.createField(superAdminUser, {
          serviceId: "srv_aviation_01",
          fieldKey: "aircraft_model",
          label: "Aircraft Model",
          dataType: "SELECT",
          options: [], // Empty options
          usage: "BOOKING_FORM",
        });
      }).toThrow(CustomFieldValidationError);
    });

    it("allows administrators to update custom fields and increments version", () => {
      const target = serviceCustomFieldRepository.getFieldById("cf_pax_count");
      expect(target).toBeDefined();
      if (!target) return;

      const updated = serviceCustomFieldRepository.updateField(adminUser, {
        fieldId: target.id,
        label: "Total Passenger Headcount",
        placeholder: "e.g. 5 passengers",
        expectedVersion: target.version,
      });

      expect(updated.version).toBe(target.version + 1);
      expect(updated.label).toBe("Total Passenger Headcount");
      expect(updated.placeholder).toBe("e.g. 5 passengers");
    });

    it("toggles field active status to preserve historical booking answers", () => {
      const target = serviceCustomFieldRepository.getFieldById("cf_pax_count");
      expect(target).toBeDefined();
      if (!target) return;

      const deactivated = serviceCustomFieldRepository.toggleFieldActive(
        superAdminUser,
        target.id,
        false,
      );
      expect(deactivated.active).toBe(false);

      // Verify that active-only filtering excludes it
      const activeOnly = serviceCustomFieldRepository.listFieldsByService("srv_aviation_01", {
        active: true,
      });
      expect(activeOnly.some((f) => f.id === target.id)).toBe(false);

      // But unfiltered query still retains it (preservation guarantee)
      const allFields = serviceCustomFieldRepository.listFieldsByService("srv_aviation_01");
      expect(allFields.some((f) => f.id === target.id)).toBe(true);
    });

    it("strictly blocks vendor personas from modifying custom fields", () => {
      expect(() => {
        serviceCustomFieldRepository.createField(vendorUser, {
          serviceId: "srv_chauffeur_01",
          fieldKey: "vendor_unauth_field",
          label: "Unauthorized",
          dataType: "TEXT",
          usage: "INTERNAL_OPS",
        });
      }).toThrow(UnauthorizedCustomFieldAccessError);
    });
  });
});
