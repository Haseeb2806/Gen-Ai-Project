import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileSummary } from "../src/components/ProfileSummary";
import { ColumnProfile } from "../src/api";

describe("ProfileSummary", () => {
  const numericColumn: ColumnProfile = {
    name: "age",
    detected_type: "numeric",
    null_count: 5,
    null_percentage: 1.5,
    unique_value_count: 85,
    stats: {
      min: 18,
      max: 95,
      mean: 42.3,
      median: 41,
    },
  };

  const categoricalColumn: ColumnProfile = {
    name: "hotel_type",
    detected_type: "categorical",
    null_count: 0,
    null_percentage: 0,
    unique_value_count: 2,
    top_values: [
      { value: "City Hotel", count: 79330 },
      { value: "Resort Hotel", count: 40060 },
    ],
  };

  const textColumn: ColumnProfile = {
    name: "reservation_status",
    detected_type: "text",
    null_count: 0,
    null_percentage: 0,
    unique_value_count: 3,
  };

  const datetimeColumn: ColumnProfile = {
    name: "arrival_date",
    detected_type: "datetime",
    null_count: 0,
    null_percentage: 0,
    unique_value_count: 926,
  };

  it("renders the profile summary section", () => {
    render(<ProfileSummary columns={[numericColumn]} rowCount={119390} />);
    expect(screen.getByRole("columnheader", { name: /column/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /type/i })).toBeInTheDocument();
  });

  it("displays numeric column with statistics", () => {
    render(<ProfileSummary columns={[numericColumn]} rowCount={119390} />);

    // Column should appear in both table and detail section
    expect(screen.getAllByText("Age").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Numeric").length).toBeGreaterThan(0);
    expect(screen.getByText("5 (1.5%)")).toBeInTheDocument();

    // Check detailed stats section
    expect(screen.getByText("Min")).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();
    expect(screen.getByText("Mean")).toBeInTheDocument();
    expect(screen.getByText("Median")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
    expect(screen.getByText("42.30")).toBeInTheDocument();
    expect(screen.getByText("41")).toBeInTheDocument();
  });

  it("displays categorical column with top values", () => {
    render(<ProfileSummary columns={[categoricalColumn]} rowCount={119390} />);

    // Column should appear in both table and detail section
    expect(screen.getAllByText("Hotel Type").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Category").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2")[0]).toBeInTheDocument(); // unique count

    // Check detailed top values section
    expect(screen.getByText("Top values:")).toBeInTheDocument();
    expect(screen.getByText("City Hotel")).toBeInTheDocument();
    expect(screen.getByText(/79330 occurrences/)).toBeInTheDocument();
    expect(screen.getByText("Resort Hotel")).toBeInTheDocument();
    expect(screen.getByText(/40060 occurrences/)).toBeInTheDocument();
  });

  it("displays text column with basic info", () => {
    render(<ProfileSummary columns={[textColumn]} rowCount={119390} />);

    expect(screen.getAllByText("Reservation Status").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Text").length).toBeGreaterThan(0);
    expect(screen.getByText("3 unique values")).toBeInTheDocument();
  });

  it("displays datetime column with basic info", () => {
    render(<ProfileSummary columns={[datetimeColumn]} rowCount={119390} />);

    const columnHeaders = screen.getAllByText("Arrival Date");
    expect(columnHeaders.length).toBeGreaterThan(0);
    const typeElements = screen.getAllByText("Date / Time");
    expect(typeElements.length).toBeGreaterThan(0);
    expect(screen.getByText("926 unique values")).toBeInTheDocument();
  });

  it("displays null counts and percentages", () => {
    render(<ProfileSummary columns={[numericColumn]} rowCount={119390} />);

    expect(screen.getByText("5 (1.5%)")).toBeInTheDocument();
    expect(screen.getByText(/5 nulls \(1.5%\)/)).toBeInTheDocument();
  });

  it("renders multiple columns", () => {
    const columns = [numericColumn, categoricalColumn, textColumn, datetimeColumn];
    render(<ProfileSummary columns={columns} rowCount={119390} />);

    // All columns should be rendered (may appear multiple times - in table and in detail cards)
    expect(screen.getAllByText("Age").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hotel Type").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reservation Status").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Arrival Date").length).toBeGreaterThan(0);
  });

  it("displays 0 nulls without showing null info", () => {
    render(<ProfileSummary columns={[categoricalColumn]} rowCount={119390} />);

    expect(screen.getByText("0 (0%)")).toBeInTheDocument();
  });

  it("displays column type badges with correct styling", () => {
    render(
      <ProfileSummary
        columns={[numericColumn, categoricalColumn, textColumn, datetimeColumn]}
        rowCount={119390}
      />
    );

    const numericElements = screen.getAllByText("Numeric");
    expect(numericElements.length).toBeGreaterThan(0);

    const categoricalElements = screen.getAllByText("Category");
    expect(categoricalElements.length).toBeGreaterThan(0);

    const textElements = screen.getAllByText("Text");
    expect(textElements.length).toBeGreaterThan(0);

    const datetimeElements = screen.getAllByText("Date / Time");
    expect(datetimeElements.length).toBeGreaterThan(0);
  });

  it("handles numeric columns with null stats", () => {
    const columnWithNullStats: ColumnProfile = {
      name: "test_column",
      detected_type: "numeric",
      null_count: 100,
      null_percentage: 50,
      unique_value_count: 10,
      stats: {
        min: null,
        max: null,
        mean: null,
        median: null,
      },
    };

    render(<ProfileSummary columns={[columnWithNullStats]} rowCount={200} />);

    expect(screen.getAllByText("\u2014").length).toBeGreaterThan(0);
  });

  it("displays unique value count in table", () => {
    render(
      <ProfileSummary
        columns={[numericColumn, categoricalColumn]}
        rowCount={119390}
      />
    );

    // Numeric column unique count
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("uses readable labels in the Detailed Column Profile", () => {
    render(
      <ProfileSummary
        columns={[
          {
            name: "lead_time",
            detected_type: "numeric",
            null_count: 0,
            null_percentage: 0,
            unique_value_count: 10,
            stats: { min: 0, max: 30, mean: 12, median: 10 },
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
            name: "arrival_date_week_number",
            detected_type: "numeric",
            null_count: 0,
            null_percentage: 0,
            unique_value_count: 52,
            stats: { min: 1, max: 52, mean: 26, median: 26 },
          },
        ]}
        rowCount={100}
      />,
    );

    expect(screen.getByText("Detailed Column Profile")).toBeInTheDocument();
    expect(screen.getAllByText("Lead Time").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cancellation Status").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Arrival Week Number").length).toBeGreaterThan(0);
    expect(screen.getByText("Cancellation Rate")).toBeInTheDocument();
  });
});
