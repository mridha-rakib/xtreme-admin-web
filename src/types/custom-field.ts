export type CustomFieldDataType =
  | "TEXT"
  | "NUMBER"
  | "BOOLEAN"
  | "SELECT"
  | "MULTI_SELECT"
  | "DATE"
  | "DATETIME"
  | "TEXTAREA";

export type CustomFieldUsage = "BOOKING_FORM" | "INTERNAL_OPS" | "INVOICE";

export interface ServiceCustomField {
  id: string;
  serviceId: string;
  fieldKey: string;
  label: string;
  localizedLabels: {
    en: string;
    fr: string;
  };
  dataType: CustomFieldDataType;
  usage: CustomFieldUsage;
  required: boolean;
  customerVisible: boolean;
  sortOrder: number;
  options?: string[];
  defaultValue?: string | number | boolean;
  placeholder?: string;
  helpText?: string;
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldFilterOptions {
  search?: string;
  usage?: CustomFieldUsage | "ALL";
  dataType?: CustomFieldDataType | "ALL";
  active?: boolean | "ALL";
}

export interface CreateCustomFieldInput {
  serviceId: string;
  fieldKey: string;
  label: string;
  localizedLabels?: {
    en: string;
    fr: string;
  };
  dataType: CustomFieldDataType;
  usage: CustomFieldUsage;
  required?: boolean;
  customerVisible?: boolean;
  sortOrder?: number;
  options?: string[];
  defaultValue?: string | number | boolean;
  placeholder?: string;
  helpText?: string;
  active?: boolean;
}

export interface UpdateCustomFieldInput {
  fieldId: string;
  fieldKey?: string;
  label?: string;
  localizedLabels?: {
    en: string;
    fr: string;
  };
  dataType?: CustomFieldDataType;
  usage?: CustomFieldUsage;
  required?: boolean;
  customerVisible?: boolean;
  sortOrder?: number;
  options?: string[];
  defaultValue?: string | number | boolean;
  placeholder?: string;
  helpText?: string;
  active?: boolean;
  expectedVersion?: number;
}
