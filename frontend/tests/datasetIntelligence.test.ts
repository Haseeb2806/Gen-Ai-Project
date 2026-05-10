import { describe, expect, it } from "vitest";

import { buildDatasetIntelligence, detectDatasetType } from "../src/utils/datasetIntelligence";
import { Profile } from "../src/api";

describe("dataset intelligence", () => {
  it("detects retail sales datasets", () => {
    const intelligence = buildDatasetIntelligence(salesProfile, "walmart_sales.csv");

    expect(detectDatasetType(salesProfile)).toBe("sales");
    expect(intelligence.title).toBe("Retail Sales Analytics Workspace");
    expect(intelligence.kpis.map((kpi) => kpi.label)).toContain("Total Sales");
    expect(intelligence.chartRecommendations).toContain("Weekly Sales Trend Over Time");
  });

  it("detects Hotel Booking datasets", () => {
    const intelligence = buildDatasetIntelligence(hotelProfile, "hotel_booking.csv");

    expect(detectDatasetType(hotelProfile)).toBe("hotel");
    expect(intelligence.title).toBe("Hotel Booking Analytics Workspace");
    expect(intelligence.kpis.map((kpi) => kpi.label)).toContain("Cancellation Rate");
    expect(intelligence.suggestedQuestions.join(" ")).toMatch(/source markets/i);
  });

  it("falls back to a generic CSV workspace", () => {
    const intelligence = buildDatasetIntelligence(genericProfile, "customers.csv");

    expect(detectDatasetType(genericProfile)).toBe("generic");
    expect(intelligence.title).toBe("Generic CSV Analytics Workspace");
    expect(intelligence.kpis.map((kpi) => kpi.label)).toContain("Total Rows");
    expect(intelligence.suggestedQuestions.join(" ")).toMatch(/missing values/i);
  });
});

const salesProfile: Profile = {
  row_count: 100,
  column_count: 8,
  columns: [
    { name: "Store", detected_type: "categorical", null_count: 0, null_percentage: 0, unique_value_count: 3, top_values: [{ value: "1", count: 40 }] },
    { name: "Date", detected_type: "datetime", null_count: 0, null_percentage: 0, unique_value_count: 100 },
    { name: "Weekly_Sales", detected_type: "numeric", null_count: 0, null_percentage: 0, unique_value_count: 100, stats: { min: 1000, max: 5000, mean: 2500, median: 2400 } },
    { name: "Holiday_Flag", detected_type: "numeric", null_count: 0, null_percentage: 0, unique_value_count: 2, stats: { min: 0, max: 1, mean: 0.1, median: 0 } },
    { name: "Temperature", detected_type: "numeric", null_count: 0, null_percentage: 0, unique_value_count: 80, stats: { min: 20, max: 90, mean: 65, median: 66 } },
    { name: "Fuel_Price", detected_type: "numeric", null_count: 0, null_percentage: 0, unique_value_count: 50, stats: { min: 2, max: 4, mean: 3.2, median: 3.1 } },
    { name: "CPI", detected_type: "numeric", null_count: 0, null_percentage: 0, unique_value_count: 50, stats: { min: 120, max: 220, mean: 180, median: 181 } },
    { name: "Unemployment", detected_type: "numeric", null_count: 0, null_percentage: 0, unique_value_count: 50, stats: { min: 3, max: 10, mean: 7, median: 7 } },
  ],
};

const hotelProfile: Profile = {
  row_count: 100,
  column_count: 6,
  columns: [
    { name: "hotel", detected_type: "categorical", null_count: 0, null_percentage: 0, unique_value_count: 2, top_values: [{ value: "City Hotel", count: 60 }] },
    { name: "is_canceled", detected_type: "numeric", null_count: 0, null_percentage: 0, unique_value_count: 2, stats: { min: 0, max: 1, mean: 0.37, median: 0 } },
    { name: "lead_time", detected_type: "numeric", null_count: 0, null_percentage: 0, unique_value_count: 20, stats: { min: 0, max: 300, mean: 90, median: 60 } },
    { name: "adr", detected_type: "numeric", null_count: 0, null_percentage: 0, unique_value_count: 40, stats: { min: 0, max: 500, mean: 120, median: 100 } },
    { name: "country", detected_type: "categorical", null_count: 0, null_percentage: 0, unique_value_count: 3, top_values: [{ value: "PRT", count: 40 }] },
    { name: "market_segment", detected_type: "categorical", null_count: 0, null_percentage: 0, unique_value_count: 2, top_values: [{ value: "Online TA", count: 70 }] },
  ],
};

const genericProfile: Profile = {
  row_count: 50,
  column_count: 3,
  columns: [
    { name: "customer_segment", detected_type: "categorical", null_count: 0, null_percentage: 0, unique_value_count: 2, top_values: [{ value: "Enterprise", count: 30 }] },
    { name: "customer_lifetime_value", detected_type: "numeric", null_count: 0, null_percentage: 0, unique_value_count: 50, stats: { min: 100, max: 1000, mean: 400, median: 350 } },
    { name: "notes", detected_type: "text", null_count: 20, null_percentage: 40, unique_value_count: 20 },
  ],
};
