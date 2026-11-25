export type AssetStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";
export type AssetOwnerType = "XTREME" | "VENDOR";

export const APPROVED_DESTINATIONS = [
  "Nice / Cannes / Monaco",
  "Geneva / Alps",
  "Saint-Tropez / Monaco",
  "Cannes / Antibes",
  "Paris Metropolitan",
  "Monaco / Nice Heliport",
  "London / Mayfair",
  "Paris Le Bourget / Nice",
  "Zürich / St. Moritz",
  "Milan / Lake Como",
] as const;

export interface Asset {
  id: string;
  name: string;
  code: string;
  category: string;
  destination: string;
  capacity: number;
  status: AssetStatus;
  ownerType: AssetOwnerType;
  vendorId?: string;
  vendorName?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetParams {
  name: string;
  code: string;
  category: string;
  destination: string;
  capacity: number;
  status?: AssetStatus;
  ownerType: AssetOwnerType;
  vendorId?: string;
  description?: string;
}

export interface UpdateAssetParams {
  name?: string;
  code?: string;
  category?: string;
  destination?: string;
  capacity?: number;
  status?: AssetStatus;
  ownerType?: AssetOwnerType;
  vendorId?: string;
  description?: string;
}
