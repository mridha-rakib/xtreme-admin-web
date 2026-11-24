import type { Customer, CustomerFilterParams, PaginatedCustomersResult } from "@/types/customer";

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cus_001",
    firstName: "Olivia",
    lastName: "Carter",
    email: "olivia.carter@demo.com",
    phone: "+1 212-555-0148",
    verificationStatus: "Verified",
    preferredLanguage: "English",
    membershipTier: "Platinum",
    location: "New York, US",
    lastBookingDate: "Feb 14, 2025",
    totalBookings: 12,
    status: "Active",
  },
  {
    id: "cus_002",
    firstName: "Ethan",
    lastName: "Mitchell",
    email: "ethan.mitchell@demo.com",
    phone: "+1 310-555-0192",
    verificationStatus: "Verified",
    preferredLanguage: "English",
    membershipTier: "Gold",
    location: "Los Angeles, US",
    lastBookingDate: "Feb 10, 2025",
    totalBookings: 8,
    status: "Active",
  },
  {
    id: "cus_003",
    firstName: "Sophia",
    lastName: "Reed",
    email: "sophia.reed@demo.com",
    phone: "+44 20 7946 0912",
    verificationStatus: "Verified",
    preferredLanguage: "English",
    membershipTier: "Platinum",
    location: "London, UK",
    lastBookingDate: "Feb 7, 2025",
    totalBookings: 15,
    status: "Active",
  },
  {
    id: "cus_004",
    firstName: "Alexander",
    lastName: "Hayes",
    email: "alex.hayes@demo.com",
    phone: "+33 1 42 68 55 00",
    verificationStatus: "Verified",
    preferredLanguage: "French",
    membershipTier: "VIP Black",
    location: "Paris, FR",
    lastBookingDate: "Jan 29, 2025",
    totalBookings: 24,
    status: "Active",
  },
  {
    id: "cus_005",
    firstName: "Charlotte",
    lastName: "Vance",
    email: "c.vance@demo.com",
    phone: "+41 44 215 55 00",
    verificationStatus: "Verified",
    preferredLanguage: "German",
    membershipTier: "Silver",
    location: "Zurich, CH",
    lastBookingDate: "Jan 15, 2025",
    totalBookings: 4,
    status: "Inactive",
  },
  {
    id: "cus_006",
    firstName: "Kenji",
    lastName: "Sato",
    email: "kenji.sato@demo.com",
    phone: "+81 3 5555 0143",
    verificationStatus: "Verified",
    preferredLanguage: "Japanese",
    membershipTier: "Gold",
    location: "Tokyo, JP",
    lastBookingDate: "Jan 12, 2025",
    totalBookings: 9,
    status: "Active",
  },
  {
    id: "cus_007",
    firstName: "Tariq",
    lastName: "Al-Mansoor",
    email: "tariq.mansoor@demo.com",
    phone: "+971 4 321 0000",
    verificationStatus: "Verified",
    preferredLanguage: "Arabic",
    membershipTier: "VIP Black",
    location: "Dubai, UAE",
    lastBookingDate: "Jan 8, 2025",
    totalBookings: 31,
    status: "Active",
  },
  {
    id: "cus_008",
    firstName: "Isabella",
    lastName: "Rossi",
    email: "isabella.rossi@demo.com",
    phone: "+1 212-555-0189",
    verificationStatus: "Verified",
    preferredLanguage: "Italian",
    membershipTier: "Platinum",
    location: "New York, US",
    lastBookingDate: "Dec 28, 2024",
    totalBookings: 18,
    status: "Active",
  },
];

class CustomerRepository {
  private customers: Customer[] = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
  private listeners: Set<() => void> = new Set();
  private simulateFailure = false;

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public setSimulateFailure(fail: boolean): void {
    this.simulateFailure = fail;
  }

  public resetToDefaults(): void {
    this.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
    this.simulateFailure = false;
    this.notify();
  }

  public listCustomers(params: CustomerFilterParams = {}): PaginatedCustomersResult {
    if (this.simulateFailure) {
      throw new Error("Simulated query failure in CustomerRepository");
    }

    const {
      search = "",
      membershipTier = "All",
      status = "All",
      region = "All",
      page = 1,
      pageSize = 10,
    } = params;

    let filtered = [...this.customers];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q),
      );
    }

    if (membershipTier !== "All") {
      filtered = filtered.filter((c) => c.membershipTier === membershipTier);
    }

    if (status !== "All") {
      filtered = filtered.filter((c) => c.status === status);
    }

    if (region !== "All") {
      filtered = filtered.filter((c) => c.location === region);
    }

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const validPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (validPage - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      currentPage: validPage,
      totalPages,
    };
  }

  public getCustomerById(id: string): Customer | undefined {
    if (this.simulateFailure) {
      throw new Error("Simulated query failure in CustomerRepository");
    }
    // Also support lookup by name slug (e.g. olivia-carter) for clean navigation
    return this.customers.find(
      (c) =>
        c.id.toLowerCase() === id.toLowerCase() ||
        `${c.firstName}-${c.lastName}`.toLowerCase() === id.toLowerCase(),
    );
  }

  public updateCustomerBasicProfile(
    id: string,
    updates: {
      firstName: string;
      lastName: string;
      email: string;
      preferredLanguage: string;
    },
  ): Customer {
    const customer = this.getCustomerById(id);
    if (!customer) {
      throw new Error(`Customer with ID ${id} not found.`);
    }

    if (!updates.firstName.trim() || !updates.lastName.trim() || !updates.email.trim()) {
      throw new Error("First name, last name, and email are required fields.");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updates.email.trim())) {
      throw new Error("Invalid email address format.");
    }

    customer.firstName = updates.firstName.trim();
    customer.lastName = updates.lastName.trim();
    customer.email = updates.email.trim();
    customer.preferredLanguage = updates.preferredLanguage.trim() || "English";

    this.notify();
    return { ...customer };
  }
}

export const customerRepository = new CustomerRepository();
