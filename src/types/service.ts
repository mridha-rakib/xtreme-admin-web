export type ServiceTemplate =
  | "AIR_CHARTER"
  | "YACHT_CHARTER"
  | "CHAUFFEUR_TRANSFER"
  | "FINE_DINING"
  | "SECURITY_DETAIL"
  | "CUSTOM";

export type ServiceBookingMode = "INSTANT_CONFIRMATION" | "QUOTE_REQUIRED" | "MANUAL_APPROVAL";

export type AvailabilityModel = "SCHEDULED_SLOTS" | "DURATION_BASED" | "PER_DIEM" | "ON_DEMAND";

export type PaymentMode = "PREPAYMENT" | "DEPOSIT_AND_BALANCE" | "INVOICE_AFTER_COMPLETION";

export interface CatalogService {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  template: ServiceTemplate;
  bookingMode: ServiceBookingMode;
  availabilityModel: AvailabilityModel;
  paymentMode: PaymentMode;
  description?: string;
  localizedDescriptions: {
    en: string;
    fr: string;
  };
  active: boolean;
  customFieldCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceFilterOptions {
  search?: string;
  categoryId?: string | "ALL";
  template?: ServiceTemplate | "ALL";
  bookingMode?: ServiceBookingMode | "ALL";
  active?: boolean | "ALL";
  sort?: "name" | "category" | "updated";
}

export interface CreateServiceInput {
  categoryId: string;
  name: string;
  slug?: string;
  template: ServiceTemplate;
  bookingMode: ServiceBookingMode;
  availabilityModel: AvailabilityModel;
  paymentMode: PaymentMode;
  description?: string;
  localizedDescriptions?: {
    en: string;
    fr: string;
  };
  active?: boolean;
}

export interface UpdateServiceInput {
  serviceId: string;
  categoryId?: string;
  name?: string;
  slug?: string;
  template?: ServiceTemplate;
  bookingMode?: ServiceBookingMode;
  availabilityModel?: AvailabilityModel;
  paymentMode?: PaymentMode;
  description?: string;
  localizedDescriptions?: {
    en: string;
    fr: string;
  };
  active?: boolean;
  expectedVersion?: number;
}
