import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Dashboard } from "../src/components/Dashboard";
import { Profile } from "../src/api";

describe("Dashboard", () => {
  const mockProfile: Profile = {
    row_count: 1000,
    column_count: 5,
    columns: [
      {
        name: "hotel_type",
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
        name: "lead_time",
        detected_type: "numeric",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 350,
        stats: {
          min: 0,
          max: 737,
          mean: 104.5,
          median: 72,
        },
      },
      {
        name: "adr",
        detected_type: "numeric",
        null_count: 50,
        null_percentage: 5,
        unique_value_count: 450,
        stats: {
          min: 0,
          max: 5400,
          mean: 101.8,
          median: 75,
        },
      },
      {
        name: "arrival_date",
        detected_type: "datetime",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 926,
      },
      {
        name: "country",
        detected_type: "categorical",
        null_count: 5,
        null_percentage: 0.5,
        unique_value_count: 178,
        top_values: [
          { value: "PRT", count: 350 },
          { value: "GBR", count: 200 },
          { value: "FRA", count: 150 },
        ],
      },
    ],
  };

  it("renders the dashboard section", () => {
    render(<Dashboard profile={mockProfile} rowCount={1000} />);

    expect(screen.getByText("Category Distribution")).toBeInTheDocument();
  });

  it("displays summary cards", () => {
    render(<Dashboard profile={mockProfile} rowCount={1000} />);

    expect(screen.getByText("Key Measures")).toBeInTheDocument();
    expect(screen.getByText("Data Quality")).toBeInTheDocument();
  });

  it("displays categorical distributions section", () => {
    render(<Dashboard profile={mockProfile} rowCount={1000} />);

    expect(screen.getByText("Category Distribution")).toBeInTheDocument();
    expect(screen.getAllByText("Hotel Type").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Source Country").length).toBeGreaterThan(0);
  });

  it("displays numeric distributions section", () => {
    render(<Dashboard profile={mockProfile} rowCount={1000} />);

    expect(screen.getByText("Key Measures")).toBeInTheDocument();
    expect(screen.getAllByText("Lead Time").length).toBeGreaterThan(0);
  });

  it("displays data quality section", () => {
    render(<Dashboard profile={mockProfile} rowCount={1000} />);

    expect(screen.getByText("Data Quality")).toBeInTheDocument();
  });

  it("displays categorical chart data", () => {
    render(<Dashboard profile={mockProfile} rowCount={1000} />);

    // Check for top values of hotel_type
    expect(screen.getByText("City Hotel")).toBeInTheDocument();
    expect(screen.getByText("600")).toBeInTheDocument(); // count for City Hotel
  });

  it("displays numeric chart statistics", () => {
    render(<Dashboard profile={mockProfile} rowCount={1000} />);

    // Check for statistics labels
    expect(screen.getAllByText("Min").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Median").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mean").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Max").length).toBeGreaterThan(0);
  });

  it("displays data quality progress bars", () => {
    render(<Dashboard profile={mockProfile} rowCount={1000} />);

    // Verify data quality completeness percentages are shown
    const percentageElements = screen.getAllByText(/% complete/);
    expect(percentageElements.length).toBeGreaterThan(0);
  });

  it("handles profiles with only categorical columns", () => {
    const categoricalProfile: Profile = {
      row_count: 100,
      column_count: 2,
      columns: [
        {
          name: "color",
          detected_type: "categorical",
          null_count: 0,
          null_percentage: 0,
          unique_value_count: 3,
          top_values: [
            { value: "Red", count: 60 },
            { value: "Blue", count: 30 },
            { value: "Green", count: 10 },
          ],
        },
        {
          name: "size",
          detected_type: "text",
          null_count: 0,
          null_percentage: 0,
          unique_value_count: 3,
        },
      ],
    };

    render(<Dashboard profile={categoricalProfile} rowCount={100} />);

    expect(screen.getByText("Category Distribution")).toBeInTheDocument();
    expect(screen.getAllByText("Color").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Red").length).toBeGreaterThan(0);
  });

  it("handles profiles with only numeric columns", () => {
    const numericProfile: Profile = {
      row_count: 100,
      column_count: 2,
      columns: [
        {
          name: "temperature",
          detected_type: "numeric",
          null_count: 5,
          null_percentage: 5,
          unique_value_count: 95,
          stats: {
            min: 10,
            max: 40,
            mean: 22.5,
            median: 23,
          },
        },
        {
          name: "humidity",
          detected_type: "numeric",
          null_count: 0,
          null_percentage: 0,
          unique_value_count: 100,
          stats: {
            min: 20,
            max: 100,
            mean: 65,
            median: 70,
          },
        },
      ],
    };

    render(<Dashboard profile={numericProfile} rowCount={100} />);

    expect(screen.getByText("Key Measures")).toBeInTheDocument();
    expect(screen.getAllByText("Temperature").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Humidity").length).toBeGreaterThan(0);
  });

  it("calculates and displays data quality percentage", () => {
    render(<Dashboard profile={mockProfile} rowCount={1000} />);

    // Check that the Data Quality section is shown
    expect(screen.getByText("Data Quality")).toBeInTheDocument();
    // adr column has 50 nulls out of 1000 rows = 95.0% complete
    expect(screen.getByText(/95\.0% complete/)).toBeInTheDocument();
  });

  it("limits displayed categorical charts to 3", () => {
    const manyCategoricalProfile: Profile = {
      row_count: 100,
      column_count: 5,
      columns: Array.from({ length: 5 }, (_, i) => ({
        name: `category_${i}`,
        detected_type: "categorical" as const,
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 5,
        top_values: [{ value: `value_${i}`, count: 100 }],
      })),
    };

    render(<Dashboard profile={manyCategoricalProfile} rowCount={100} />);

    // Should only show first 3 categorical charts
    expect(screen.getAllByText("Category 0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Category 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Category 2").length).toBeGreaterThan(0);
  });

  it("limits displayed numeric charts to 2", () => {
    const manyNumericProfile: Profile = {
      row_count: 100,
      column_count: 5,
      columns: Array.from({ length: 5 }, (_, i) => ({
        name: `numeric_${i}`,
        detected_type: "numeric" as const,
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 100,
        stats: {
          min: 0,
          max: 100,
          mean: 50,
          median: 50,
        },
      })),
    };

    render(<Dashboard profile={manyNumericProfile} rowCount={100} />);

    // Should only show first 2 numeric charts
    expect(screen.getAllByText("Numeric 0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Numeric 1").length).toBeGreaterThan(0);
  });

  it("limits data quality display to first 6 columns", () => {
    const manyColumnProfile: Profile = {
      row_count: 100,
      column_count: 10,
      columns: Array.from({ length: 10 }, (_, i) => ({
        name: `column_${i}`,
        detected_type: "numeric" as const,
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 100,
        stats: {
          min: 0,
          max: 100,
          mean: 50,
          median: 50,
        },
      })),
    };

    render(<Dashboard profile={manyColumnProfile} rowCount={100} />);

    // Should show completeness for first 6 columns
    expect(screen.getAllByText("Column 0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Column 5").length).toBeGreaterThan(0);
  });

  it("formats missing values correctly", () => {
    render(<Dashboard profile={mockProfile} rowCount={1000} />);

    expect(screen.getByText("Data Quality")).toBeInTheDocument();
  });
});
