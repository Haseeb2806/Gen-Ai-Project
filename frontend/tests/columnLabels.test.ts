import { describe, expect, it } from "vitest";

import { formatColumnLabel, humanizeColumnName } from "../src/utils/columnLabels";

describe("column label utilities", () => {
  it("humanizes generic technical column names", () => {
    expect(humanizeColumnName("customer_lifetime_value")).toBe("Customer Lifetime Value");
    expect(humanizeColumnName("monthly_revenue")).toBe("Monthly Revenue");
    expect(humanizeColumnName("orderDate")).toBe("Order Date");
    expect(humanizeColumnName("product-category")).toBe("Product Category");
  });

  it("uses known common and hotel labels when available", () => {
    expect(formatColumnLabel("hotel")).toBe("Hotel Type");
    expect(formatColumnLabel("is_canceled")).toBe("Cancellation Status");
    expect(formatColumnLabel("arrival_date_week_number")).toBe("Arrival Week Number");
    expect(formatColumnLabel("adr")).toBe("Average Daily Rate");
  });
});
