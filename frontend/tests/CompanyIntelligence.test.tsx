import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import {
  CompanyContext,
  CompanyIntelligence,
  createEmptyCompanyContext,
} from "../src/components/CompanyIntelligence";
import { UploadResponse } from "../src/api";

describe("CompanyIntelligence", () => {
  it("renders the company context form", () => {
    renderWithState(hotelDataset);

    expect(screen.getByLabelText(/company \/ organization name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/industry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country \/ region/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dataset period/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business objective/i)).toBeInTheDocument();
  });

  it("lets the user enter company name and industry", async () => {
    const user = userEvent.setup();
    renderWithState(hotelDataset);

    await user.type(screen.getByLabelText(/company \/ organization name/i), "Northstar Hotels");
    await user.type(screen.getByLabelText(/industry/i), "Hospitality");

    expect(screen.getAllByText("Northstar Hotels").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hospitality").length).toBeGreaterThan(0);
  });

  it("shows the company intelligence section", async () => {
    const user = userEvent.setup();
    renderWithState(hotelDataset);

    await user.type(screen.getByLabelText(/company \/ organization name/i), "Northstar Hotels");

    expect(screen.getByText("Company Intelligence")).toBeInTheDocument();
    expect(screen.getByText("Dataset relevance")).toBeInTheDocument();
    expect(screen.getByText(/user-provided or AI-generated context/i)).toBeInTheDocument();
  });

  it("displays a visual report card with company name and key metrics", async () => {
    const user = userEvent.setup();
    renderWithState(hotelDataset);

    await user.type(screen.getByLabelText(/company \/ organization name/i), "Northstar Hotels");

    expect(screen.getByText("Visual report card")).toBeInTheDocument();
    expect(screen.getAllByText("Northstar Hotels").length).toBeGreaterThan(0);
    expect(screen.getByText("Cancellation rate")).toBeInTheDocument();
    expect(screen.getByText("Average daily rate")).toBeInTheDocument();
    expect(screen.getByText("Top source country")).toBeInTheDocument();
    expect(screen.getByText("3 key business insights")).toBeInTheDocument();
    expect(screen.getByText("2 recommended actions")).toBeInTheDocument();
  });

  it("uses a generic CSV fallback when Hotel Booking columns are not present", async () => {
    const user = userEvent.setup();
    renderWithState(genericDataset);

    await user.type(screen.getByLabelText(/company \/ organization name/i), "Atlas Retail");
    await user.type(screen.getByLabelText(/industry/i), "Retail");

    expect(screen.getByText("Product Category leader")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Avg Revenue")).toBeInTheDocument();
    expect(screen.getByText(/adapts to the uploaded CSV structure/i)).toBeInTheDocument();
  });
});

function renderWithState(dataset: UploadResponse) {
  function Harness() {
    const [context, setContext] = useState<CompanyContext>(createEmptyCompanyContext());
    return <CompanyIntelligence context={context} dataset={dataset} onChange={setContext} />;
  }

  render(<Harness />);
}

const hotelDataset: UploadResponse = {
  dataset_id: "hotel-123",
  filename: "hotel_booking.csv",
  row_count: 1000,
  column_count: 6,
  column_names: ["hotel", "is_canceled", "country", "adr", "lead_time", "agent"],
  profile: {
    row_count: 1000,
    column_count: 6,
    columns: [
      {
        name: "hotel",
        detected_type: "categorical",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 2,
        top_values: [
          { value: "City Hotel", count: 600 },
          { value: "Resort Hotel", count: 400 },
        ],
      },
      {
        name: "is_canceled",
        detected_type: "numeric",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 2,
        stats: { min: 0, max: 1, mean: 0.37, median: 0 },
      },
      {
        name: "country",
        detected_type: "categorical",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 50,
        top_values: [{ value: "PRT", count: 430 }],
      },
      {
        name: "adr",
        detected_type: "numeric",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 400,
        stats: { min: 0, max: 500, mean: 102.34, median: 88 },
      },
      {
        name: "lead_time",
        detected_type: "numeric",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 300,
        stats: { min: 0, max: 737, mean: 104, median: 70 },
      },
      {
        name: "agent",
        detected_type: "numeric",
        null_count: 250,
        null_percentage: 25,
        unique_value_count: 80,
        stats: { min: 1, max: 500, mean: 100, median: 95 },
      },
    ],
  },
};

const genericDataset: UploadResponse = {
  dataset_id: "generic-123",
  filename: "sales.csv",
  row_count: 500,
  column_count: 3,
  column_names: ["product_category", "revenue", "owner"],
  profile: {
    row_count: 500,
    column_count: 3,
    columns: [
      {
        name: "product_category",
        detected_type: "categorical",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 3,
        top_values: [{ value: "Electronics", count: 260 }],
      },
      {
        name: "revenue",
        detected_type: "numeric",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 450,
        stats: { min: 10, max: 900, mean: 220.5, median: 180 },
      },
      {
        name: "owner",
        detected_type: "text",
        null_count: 150,
        null_percentage: 30,
        unique_value_count: 100,
      },
    ],
  },
};
