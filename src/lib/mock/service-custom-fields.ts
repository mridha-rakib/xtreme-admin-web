import { serviceRepository } from "@/lib/mock/services";
import type {
  AuthorizedActor,
  CreateCustomFieldInput,
  CustomFieldFilterOptions,
  ServiceCustomField,
  UpdateCustomFieldInput,
} from "@/types";
import { hasCommandCenterPermission } from "@/types";

export class CustomFieldValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomFieldValidationError";
  }
}

export class UnauthorizedCustomFieldAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedCustomFieldAccessError";
  }
}

export class StaleCustomFieldVersionConflictError extends Error {
  constructor(expected: number, actual: number) {
    super(
      `Stale custom field version conflict (409): Expected version ${expected}, but authoritative record is at version ${actual}. Please refresh and re-evaluate.`,
    );
    this.name = "StaleCustomFieldVersionConflictError";
  }
}

export const INITIAL_SERVICE_CUSTOM_FIELDS: ServiceCustomField[] = [
  // Custom fields for srv_aviation_01 (Private Jet Charter · Europe)
  {
    id: "cf_pax_count",
    serviceId: "srv_aviation_01",
    fieldKey: "pax_count",
    label: "Passenger Count",
    localizedLabels: {
      en: "Passenger Count",
      fr: "Nombre de passagers",
    },
    dataType: "NUMBER",
    usage: "BOOKING_FORM",
    required: true,
    customerVisible: true,
    sortOrder: 1,
    defaultValue: 2,
    placeholder: "e.g. 4",
    helpText: "Total number of adult and child passengers traveling onboard.",
    active: true,
    version: 1,
    createdAt: "2025-10-15T09:30:00Z",
    updatedAt: "2026-02-10T11:00:00Z",
  },
  {
    id: "cf_tail_pref",
    serviceId: "srv_aviation_01",
    fieldKey: "aircraft_tail_preference",
    label: "Tail / Aircraft Preference",
    localizedLabels: {
      en: "Tail / Aircraft Preference",
      fr: "Préférence d'aéronef",
    },
    dataType: "TEXT",
    usage: "BOOKING_FORM",
    required: false,
    customerVisible: true,
    sortOrder: 2,
    placeholder: "e.g. Gulfstream G650, Global 7500, Citation X",
    helpText: "Specific make/model or preferred registration code.",
    active: true,
    version: 1,
    createdAt: "2025-10-15T09:35:00Z",
    updatedAt: "2026-02-10T11:00:00Z",
  },
  {
    id: "cf_catering",
    serviceId: "srv_aviation_01",
    fieldKey: "special_catering",
    label: "Catering & Dietary Requirements",
    localizedLabels: {
      en: "Catering & Dietary Requirements",
      fr: "Restauration & Régimes spécifiques",
    },
    dataType: "TEXTAREA",
    usage: "BOOKING_FORM",
    required: false,
    customerVisible: true,
    sortOrder: 3,
    placeholder: "Specify kosher, halal, champagne preferences, allergies...",
    helpText: "VIP onboard culinary selections and dietary restrictions.",
    active: true,
    version: 1,
    createdAt: "2025-10-15T09:40:00Z",
    updatedAt: "2026-02-10T11:00:00Z",
  },
  {
    id: "cf_tail_reg",
    serviceId: "srv_aviation_01",
    fieldKey: "tail_registration_ops",
    label: "Allocated Tail Registration",
    localizedLabels: {
      en: "Allocated Tail Registration",
      fr: "Immatriculation de l'appareil",
    },
    dataType: "TEXT",
    usage: "INTERNAL_OPS",
    required: false,
    customerVisible: false,
    sortOrder: 4,
    placeholder: "e.g. 9H-VCA",
    helpText: "Command Center operational tail assignment verification.",
    active: true,
    version: 1,
    createdAt: "2025-10-15T09:45:00Z",
    updatedAt: "2026-02-10T11:00:00Z",
  },

  // Custom fields for srv_chauffeur_01 (Executive Chauffeur Transfer)
  {
    id: "cf_flight_num",
    serviceId: "srv_chauffeur_01",
    fieldKey: "flight_number",
    label: "Inbound Flight Number",
    localizedLabels: {
      en: "Inbound Flight Number",
      fr: "Numéro de vol d'arrivée",
    },
    dataType: "TEXT",
    usage: "BOOKING_FORM",
    required: false,
    customerVisible: true,
    sortOrder: 1,
    placeholder: "e.g. AF1234 or BA0348",
    helpText: "Flight tracking number for automated delay monitoring.",
    active: true,
    version: 1,
    createdAt: "2025-11-01T08:15:00Z",
    updatedAt: "2026-01-20T09:00:00Z",
  },
  {
    id: "cf_luggage",
    serviceId: "srv_chauffeur_01",
    fieldKey: "luggage_pieces",
    label: "Luggage Pieces",
    localizedLabels: {
      en: "Luggage Pieces",
      fr: "Nombre de bagages",
    },
    dataType: "NUMBER",
    usage: "BOOKING_FORM",
    required: true,
    customerVisible: true,
    sortOrder: 2,
    defaultValue: 2,
    placeholder: "e.g. 3",
    helpText: "Total number of checked suitcases and large bags.",
    active: true,
    version: 1,
    createdAt: "2025-11-01T08:20:00Z",
    updatedAt: "2026-01-20T09:00:00Z",
  },

  // Custom fields for srv_yacht_01 (Day Yacht Charter · Côte d'Azur)
  {
    id: "cf_guest_count",
    serviceId: "srv_yacht_01",
    fieldKey: "guest_count",
    label: "Guest Count",
    localizedLabels: {
      en: "Guest Count",
      fr: "Nombre d'invités",
    },
    dataType: "NUMBER",
    usage: "BOOKING_FORM",
    required: true,
    customerVisible: true,
    sortOrder: 1,
    defaultValue: 6,
    placeholder: "e.g. 8",
    helpText: "Total guests boarding the yacht (maximum vessel capacity applies).",
    active: true,
    version: 1,
    createdAt: "2025-10-25T14:15:00Z",
    updatedAt: "2026-03-10T14:00:00Z",
  },
  {
    id: "cf_cruising_itinerary",
    serviceId: "srv_yacht_01",
    fieldKey: "itinerary_pref",
    label: "Itinerary / Destination Preference",
    localizedLabels: {
      en: "Itinerary / Destination Preference",
      fr: "Itinéraire / Destinations souhaitées",
    },
    dataType: "TEXTAREA",
    usage: "BOOKING_FORM",
    required: false,
    customerVisible: true,
    sortOrder: 2,
    placeholder: "e.g. Cannes to Saint-Tropez via Îles de Lérins",
    helpText: "Desired anchorages, beach clubs, or cruising waypoints.",
    active: true,
    version: 1,
    createdAt: "2025-10-25T14:20:00Z",
    updatedAt: "2026-03-10T14:00:00Z",
  },
];

export class ServiceCustomFieldRepository {
  private fields: ServiceCustomField[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.resetDefaults();
  }

  public resetDefaults(): void {
    this.fields = JSON.parse(JSON.stringify(INITIAL_SERVICE_CUSTOM_FIELDS));
    this.syncAllServiceCounts();
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const fn of this.listeners) {
      try {
        fn();
      } catch (err) {
        console.error("ServiceCustomFieldRepository listener error:", err);
      }
    }
  }

  private checkMutationPermission(actor: AuthorizedActor | null | undefined): AuthorizedActor {
    if (!actor || !actor.role) {
      throw new UnauthorizedCustomFieldAccessError(
        "Authentication required: Actor context missing.",
      );
    }
    if (
      !hasCommandCenterPermission(actor.role, "manage:assets") &&
      actor.role !== "SUPER_ADMIN" &&
      actor.role !== "ADMIN"
    ) {
      throw new UnauthorizedCustomFieldAccessError(
        `Role "${actor.role}" is not authorized to create or modify service custom fields. Administrative authority or "manage:assets" required.`,
      );
    }
    return actor;
  }

  private syncAllServiceCounts(): void {
    const countsByService: Record<string, number> = {};
    for (const f of this.fields) {
      countsByService[f.serviceId] = (countsByService[f.serviceId] || 0) + 1;
    }
    for (const s of serviceRepository.listServices()) {
      serviceRepository.updateCustomFieldCount(s.id, countsByService[s.id] || 0);
    }
  }

  private syncSingleServiceCount(serviceId: string): void {
    const count = this.fields.filter((f) => f.serviceId === serviceId).length;
    serviceRepository.updateCustomFieldCount(serviceId, count);
  }

  public listFieldsByService(
    serviceId: string,
    filters?: CustomFieldFilterOptions,
  ): ServiceCustomField[] {
    return this.fields
      .filter((f) => {
        if (f.serviceId !== serviceId && f.serviceId.toLowerCase() !== serviceId.toLowerCase()) {
          return false;
        }
        if (filters?.usage && filters.usage !== "ALL" && f.usage !== filters.usage) {
          return false;
        }
        if (filters?.dataType && filters.dataType !== "ALL" && f.dataType !== filters.dataType) {
          return false;
        }
        if (
          filters?.active !== undefined &&
          filters.active !== "ALL" &&
          f.active !== filters.active
        ) {
          return false;
        }
        if (filters?.search?.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matchKey = f.fieldKey.toLowerCase().includes(q);
          const matchLabel = f.label.toLowerCase().includes(q);
          const matchEn = f.localizedLabels?.en?.toLowerCase().includes(q) || false;
          const matchFr = f.localizedLabels?.fr?.toLowerCase().includes(q) || false;
          if (!matchKey && !matchLabel && !matchEn && !matchFr) return false;
        }
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((f) => structuredClone(f));
  }

  public getFieldById(id: string): ServiceCustomField | undefined {
    const f = this.fields.find(
      (item) => item.id === id || item.id.toLowerCase() === id.toLowerCase(),
    );
    return f ? structuredClone(f) : undefined;
  }

  public createField(
    actor: AuthorizedActor | null | undefined,
    input: CreateCustomFieldInput,
  ): ServiceCustomField {
    this.checkMutationPermission(actor);

    if (!input.serviceId || !input.serviceId.trim()) {
      throw new CustomFieldValidationError("Service ID is required.");
    }

    const service = serviceRepository.getServiceById(input.serviceId);
    if (!service) {
      throw new CustomFieldValidationError(`Parent service "${input.serviceId}" does not exist.`);
    }

    if (!input.fieldKey || !input.fieldKey.trim()) {
      throw new CustomFieldValidationError("Field key identifier is required.");
    }

    const fieldKey = input.fieldKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/(^_|_$)/g, "");

    // Uniqueness within service
    if (this.fields.some((f) => f.serviceId === service.id && f.fieldKey === fieldKey)) {
      throw new CustomFieldValidationError(
        `Field key "${fieldKey}" already exists on service "${service.name}".`,
      );
    }

    if (!input.label || !input.label.trim()) {
      throw new CustomFieldValidationError("Field label is required.");
    }

    if (
      (input.dataType === "SELECT" || input.dataType === "MULTI_SELECT") &&
      (!input.options || input.options.length === 0)
    ) {
      throw new CustomFieldValidationError(
        `Options list cannot be empty for data type "${input.dataType}".`,
      );
    }

    const existingFields = this.fields.filter((f) => f.serviceId === service.id);
    const sortOrder = input.sortOrder !== undefined ? input.sortOrder : existingFields.length + 1;

    const now = new Date().toISOString();
    const newField: ServiceCustomField = {
      id: `cf_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      serviceId: service.id,
      fieldKey,
      label: input.label.trim(),
      localizedLabels: {
        en: input.localizedLabels?.en?.trim() || input.label.trim(),
        fr: input.localizedLabels?.fr?.trim() || input.label.trim(),
      },
      dataType: input.dataType,
      usage: input.usage,
      required: input.required ?? false,
      customerVisible: input.customerVisible ?? true,
      sortOrder,
      options: input.options ? input.options.map((o) => o.trim()).filter(Boolean) : undefined,
      defaultValue: input.defaultValue,
      placeholder: input.placeholder?.trim() || undefined,
      helpText: input.helpText?.trim() || undefined,
      active: input.active !== undefined ? input.active : true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.fields.push(newField);
    this.syncSingleServiceCount(service.id);
    this.notify();
    return structuredClone(newField);
  }

  public updateField(
    actor: AuthorizedActor | null | undefined,
    input: UpdateCustomFieldInput,
  ): ServiceCustomField {
    this.checkMutationPermission(actor);

    const index = this.fields.findIndex((f) => f.id === input.fieldId);
    if (index === -1) {
      throw new CustomFieldValidationError(`Custom field not found: "${input.fieldId}".`);
    }

    const currentField = this.fields[index];

    // Optimistic concurrency control
    if (input.expectedVersion !== undefined && currentField.version !== input.expectedVersion) {
      throw new StaleCustomFieldVersionConflictError(input.expectedVersion, currentField.version);
    }

    const candidate: ServiceCustomField = structuredClone(currentField);

    if (input.fieldKey !== undefined) {
      const fieldKey = input.fieldKey
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
        .replace(/(^_|_$)/g, "");

      if (!fieldKey) {
        throw new CustomFieldValidationError("Field key cannot be blank.");
      }

      if (
        this.fields.some(
          (f) =>
            f.id !== candidate.id && f.serviceId === candidate.serviceId && f.fieldKey === fieldKey,
        )
      ) {
        throw new CustomFieldValidationError(
          `Field key "${fieldKey}" already exists on this service.`,
        );
      }
      candidate.fieldKey = fieldKey;
    }

    if (input.label !== undefined) {
      if (!input.label.trim()) {
        throw new CustomFieldValidationError("Field label cannot be blank.");
      }
      candidate.label = input.label.trim();
    }

    if (input.localizedLabels !== undefined) {
      candidate.localizedLabels = {
        en: input.localizedLabels.en?.trim() || candidate.label,
        fr: input.localizedLabels.fr?.trim() || candidate.label,
      };
    }

    if (input.dataType !== undefined) candidate.dataType = input.dataType;
    if (input.usage !== undefined) candidate.usage = input.usage;
    if (input.required !== undefined) candidate.required = input.required;
    if (input.customerVisible !== undefined) candidate.customerVisible = input.customerVisible;
    if (input.sortOrder !== undefined) candidate.sortOrder = input.sortOrder;
    if (input.options !== undefined) {
      candidate.options = input.options.map((o) => o.trim()).filter(Boolean);
    }
    if (input.defaultValue !== undefined) candidate.defaultValue = input.defaultValue;
    if (input.placeholder !== undefined)
      candidate.placeholder = input.placeholder.trim() || undefined;
    if (input.helpText !== undefined) candidate.helpText = input.helpText.trim() || undefined;
    if (input.active !== undefined) candidate.active = input.active;

    candidate.version += 1;
    candidate.updatedAt = new Date().toISOString();

    // Atomic replacement
    this.fields[index] = candidate;
    this.notify();
    return structuredClone(candidate);
  }

  public toggleFieldActive(
    actor: AuthorizedActor | null | undefined,
    id: string,
    active?: boolean,
  ): ServiceCustomField {
    this.checkMutationPermission(actor);

    const f = this.fields.find((item) => item.id === id);
    if (!f) {
      throw new CustomFieldValidationError(`Custom field not found: "${id}".`);
    }

    f.active = active !== undefined ? active : !f.active;
    f.version += 1;
    f.updatedAt = new Date().toISOString();
    this.notify();
    return structuredClone(f);
  }
}

export const serviceCustomFieldRepository = new ServiceCustomFieldRepository();
