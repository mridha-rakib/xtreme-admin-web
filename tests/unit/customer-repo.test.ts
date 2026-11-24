import { customerRepository } from "@/lib/mock/customers";
import { beforeEach, describe, expect, it } from "vitest";

describe("CustomerRepository", () => {
  beforeEach(() => {
    customerRepository.resetToDefaults();
  });

  it("lists all default customers", () => {
    const result = customerRepository.listCustomers();
    expect(result.totalCount).toBe(8);
    expect(result.items.length).toBe(8);
    expect(result.items[0].firstName).toBe("Olivia");
  });

  it("filters customers by membership tier", () => {
    const platinum = customerRepository.listCustomers({ membershipTier: "Platinum" });
    expect(platinum.items.every((c) => c.membershipTier === "Platinum")).toBe(true);

    const gold = customerRepository.listCustomers({ membershipTier: "Gold" });
    expect(gold.items.every((c) => c.membershipTier === "Gold")).toBe(true);
  });

  it("filters customers by status and region", () => {
    const ny = customerRepository.listCustomers({ region: "New York, US" });
    expect(ny.items.every((c) => c.location === "New York, US")).toBe(true);

    const active = customerRepository.listCustomers({ status: "Active" });
    expect(active.items.every((c) => c.status === "Active")).toBe(true);
  });

  it("searches customers by name, email or location", () => {
    const search = customerRepository.listCustomers({ search: "olivia" });
    expect(search.items.length).toBe(1);
    expect(search.items[0].id).toBe("cus_001");
  });

  it("retrieves a customer by ID or name slug", () => {
    const byId = customerRepository.getCustomerById("cus_001");
    expect(byId).toBeDefined();
    expect(byId?.firstName).toBe("Olivia");

    const bySlug = customerRepository.getCustomerById("olivia-carter");
    expect(bySlug).toBeDefined();
    expect(bySlug?.id).toBe("cus_001");
  });

  it("updates customer basic profile and notifies subscribers", () => {
    let notified = false;
    const unsub = customerRepository.subscribe(() => {
      notified = true;
    });

    const updated = customerRepository.updateCustomerBasicProfile("cus_001", {
      firstName: "Olivia Updated",
      lastName: "Carter Updated",
      email: "olivia.updated@demo.com",
      preferredLanguage: "French",
    });

    expect(updated.firstName).toBe("Olivia Updated");
    expect(updated.preferredLanguage).toBe("French");
    expect(notified).toBe(true);

    const fetched = customerRepository.getCustomerById("cus_001");
    expect(fetched?.firstName).toBe("Olivia Updated");

    unsub();
  });

  it("rejects invalid email formats or empty fields", () => {
    expect(() =>
      customerRepository.updateCustomerBasicProfile("cus_001", {
        firstName: "",
        lastName: "Carter",
        email: "olivia@demo.com",
        preferredLanguage: "English",
      }),
    ).toThrow("First name, last name, and email are required fields.");

    expect(() =>
      customerRepository.updateCustomerBasicProfile("cus_001", {
        firstName: "Olivia",
        lastName: "Carter",
        email: "not-an-email",
        preferredLanguage: "English",
      }),
    ).toThrow("Invalid email address format.");
  });

  it("simulates failure when failure flag is active", () => {
    customerRepository.setSimulateFailure(true);
    expect(() => customerRepository.listCustomers()).toThrow("Simulated query failure");
    expect(() => customerRepository.getCustomerById("cus_001")).toThrow("Simulated query failure");
    customerRepository.setSimulateFailure(false);
  });
});
