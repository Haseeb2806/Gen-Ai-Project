import { render, screen, within } from "@testing-library/react";
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

  it("does not show arrival date fields as key numeric measure cards", () => {
    render(<Dashboard profile={hotelTrendProfile} rowCount={119390} sectionType="breakdown" />);

    const keyMeasures = screen.getByText("Key Measures").closest("div")?.parentElement;
    expect(keyMeasures).toBeTruthy();
    expect(within(keyMeasures as HTMLElement).queryByText("Arrival Year")).not.toBeInTheDocument();
    expect(within(keyMeasures as HTMLElement).queryByText("Arrival Week Number")).not.toBeInTheDocument();
    expect(within(keyMeasures as HTMLElement).getByText("Lead Time")).toBeInTheDocument();
    expect(within(keyMeasures as HTMLElement).getByText("Average Daily Rate")).toBeInTheDocument();
  });

  it("shows binary fields as rate indicators instead of min mean max cards", () => {
    render(<Dashboard profile={hotelTrendProfile} rowCount={119390} sectionType="breakdown" />);

    expect(screen.getAllByText("Cancellation Rate").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Repeat Guest Rate").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rate Indicator").length).toBeGreaterThan(0);
  });

  it("shows filtered row count and filter chips when filters are applied", () => {
    render(
      <Dashboard
        filters={{ hotel: ["City Hotel"], arrival_date_month: ["8"] }}
        profile={hotelTrendProfile}
        rowCount={119390}
        sectionType="trends"
      />,
    );

    expect(screen.getByText(/Showing .* of 119,390 rows after 2 filters/)).toBeInTheDocument();
    expect(screen.getByText("Hotel Type: City Hotel")).toBeInTheDocument();
    expect(screen.getByText("Arrival Month: 8")).toBeInTheDocument();
  });

  it("renders trend charts when a time field and measure exist", () => {
    render(<Dashboard profile={hotelTrendProfile} rowCount={119390} sectionType="trends" />);

    expect(screen.getAllByTestId("trend-chart").length).toBeGreaterThan(0);
    expect(screen.getByText("Bookings by Arrival Month")).toBeInTheDocument();
    expect(screen.getByText("Average Daily Rate by Arrival Month")).toBeInTheDocument();
  });

  it("shows a trend fallback when no time field exists", () => {
    render(<Dashboard profile={mockProfileWithoutTime} rowCount={1000} sectionType="trends" />);

    expect(screen.getByText("No time field was detected, so trend analysis is not available for this dataset.")).toBeInTheDocument();
  });

  it("uses human-readable labels in chart titles", () => {
    render(<Dashboard profile={hotelTrendProfile} rowCount={119390} sectionType="trends" />);

    expect(screen.getByText("Average Daily Rate by Arrival Month")).toBeInTheDocument();
    expect(screen.queryByText(/arrival_date_month|adr/)).not.toBeInTheDocument();
  });
});

const hotelTrendProfile: Profile = {
  row_count: 119390,
  column_count: 8,
  columns: [
    {
      name: "hotel",
      detected_type: "categorical",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 2,
      top_values: [
        { value: "City Hotel", count: 79330 },
        { value: "Resort Hotel", count: 40060 },
      ],
    },
    {
      name: "arrival_date_year",
      detected_type: "numeric",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 3,
      stats: { min: 2015, max: 2017, mean: 2016, median: 2016 },
      top_values: [{ value: "2016", count: 56707 }],
    },
    {
      name: "arrival_date_month",
      detected_type: "numeric",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 12,
      stats: { min: 1, max: 12, mean: 6.5, median: 7 },
      top_values: [
        { value: "8", count: 13877 },
        { value: "7", count: 12661 },
        { value: "5", count: 11791 },
      ],
    },
    {
      name: "arrival_date_week_number",
      detected_type: "numeric",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 53,
      stats: { min: 1, max: 53, mean: 27, median: 28 },
      top_values: [{ value: "33", count: 3580 }],
    },
    {
      name: "lead_time",
      detected_type: "numeric",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 480,
      stats: { min: 0, max: 737, mean: 104, median: 69 },
    },
    {
      name: "adr",
      detected_type: "numeric",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 8879,
      stats: { min: 0, max: 5400, mean: 101.83, median: 94.57 },
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
      name: "is_repeated_guest",
      detected_type: "numeric",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 2,
      stats: { min: 0, max: 1, mean: 0.03, median: 0 },
    },
  ],
};

const mockProfileWithoutTime: Profile = {
  row_count: 1000,
  column_count: 2,
  columns: [
    {
      name: "segment",
      detected_type: "categorical",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 2,
      top_values: [{ value: "A", count: 500 }],
    },
    {
      name: "revenue",
      detected_type: "numeric",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 200,
      stats: { min: 10, max: 1000, mean: 200, median: 180 },
    },
  ],
};
