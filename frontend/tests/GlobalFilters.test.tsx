import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlobalFilters, FilterState } from "../src/components/GlobalFilters";
import { ColumnProfile } from "../src/lib/api";

const mockCategoricalColumn: ColumnProfile = {
  name: "hotel",
  detected_type: "categorical",
  null_count: 0,
  null_percentage: 0,
  unique_value_count: 2,
  top_values: [
    { value: "City Hotel", count: 79330 },
    { value: "Resort Hotel", count: 40060 },
  ],
};

const mockCategoricalColumn2: ColumnProfile = {
  name: "country",
  detected_type: "categorical",
  null_count: 0,
  null_percentage: 0,
  unique_value_count: 50,
  top_values: [
    { value: "PRT", count: 48590 },
    { value: "GBR", count: 12129 },
    { value: "FRA", count: 8994 },
    { value: "DEU", count: 7287 },
    { value: "USA", count: 5814 },
  ],
};

const mockNumericColumn: ColumnProfile = {
  name: "lead_time",
  detected_type: "numeric",
  null_count: 0,
  null_percentage: 0,
  unique_value_count: 476,
  stats: {
    min: 0,
    max: 737,
    mean: 104.01,
    median: 69,
  },
};

describe("GlobalFilters", () => {
  it("renders filters section with categorical columns", () => {
    const columns = [mockCategoricalColumn, mockCategoricalColumn2, mockNumericColumn];
    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters columns={columns} filters={{}} onFilterChange={mockFilterChange} />
    );

    expect(screen.getByText("Global Filters")).toBeInTheDocument();
    expect(screen.getByText("hotel")).toBeInTheDocument();
    expect(screen.getByText("country")).toBeInTheDocument();
  });

  it("does not render when no categorical columns available", () => {
    const columns = [mockNumericColumn];
    const mockFilterChange = vi.fn();

    const { container } = render(
      <GlobalFilters columns={columns} filters={{}} onFilterChange={mockFilterChange} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("displays filter options for categorical columns", () => {
    const columns = [mockCategoricalColumn];
    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters columns={columns} filters={{}} onFilterChange={mockFilterChange} />
    );

    const filterButton = screen.getByText("hotel");
    fireEvent.click(filterButton);

    expect(screen.getByText("City Hotel")).toBeInTheDocument();
    expect(screen.getByText("Resort Hotel")).toBeInTheDocument();
  });

  it("applies a filter when checkbox is clicked", () => {
    const columns = [mockCategoricalColumn];
    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters columns={columns} filters={{}} onFilterChange={mockFilterChange} />
    );

    const filterButton = screen.getByText("hotel");
    fireEvent.click(filterButton);

    const checkbox = screen.getByRole("checkbox", { name: /City Hotel/i });
    fireEvent.click(checkbox);

    expect(mockFilterChange).toHaveBeenCalledWith({
      hotel: ["City Hotel"],
    });
  });

  it("handles multiple filter selections for same column", () => {
    const columns = [mockCategoricalColumn];
    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters
        columns={columns}
        filters={{ hotel: ["City Hotel"] }}
        onFilterChange={mockFilterChange}
      />
    );

    const filterButton = screen.getByText("hotel (1)");
    fireEvent.click(filterButton);

    const checkbox = screen.getByRole("checkbox", { name: /Resort Hotel/i });
    fireEvent.click(checkbox);

    expect(mockFilterChange).toHaveBeenCalledWith({
      hotel: ["City Hotel", "Resort Hotel"],
    });
  });

  it("removes filter when checkbox is unchecked", () => {
    const columns = [mockCategoricalColumn];
    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters
        columns={columns}
        filters={{ hotel: ["City Hotel", "Resort Hotel"] }}
        onFilterChange={mockFilterChange}
      />
    );

    const filterButton = screen.getByText("hotel (2)");
    fireEvent.click(filterButton);

    const checkbox = screen.getByRole("checkbox", { name: /City Hotel/i });
    fireEvent.click(checkbox);

    expect(mockFilterChange).toHaveBeenCalledWith({
      hotel: ["Resort Hotel"],
    });
  });

  it("clears all filters when Clear filters button is clicked", () => {
    const columns = [mockCategoricalColumn, mockCategoricalColumn2];
    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters
        columns={columns}
        filters={{
          hotel: ["City Hotel"],
          country: ["PRT"],
        }}
        onFilterChange={mockFilterChange}
      />
    );

    const clearButton = screen.getByText("Clear filters");
    fireEvent.click(clearButton);

    expect(mockFilterChange).toHaveBeenCalledWith({});
  });

  it("does not show Clear filters button when no filters applied", () => {
    const columns = [mockCategoricalColumn];
    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters columns={columns} filters={{}} onFilterChange={mockFilterChange} />
    );

    expect(screen.queryByText("Clear filters")).not.toBeInTheDocument();
  });

  it("shows filter count badge when filters are applied", () => {
    const columns = [mockCategoricalColumn];
    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters
        columns={columns}
        filters={{ hotel: ["City Hotel", "Resort Hotel"] }}
        onFilterChange={mockFilterChange}
      />
    );

    expect(screen.getByText("hotel (2)")).toBeInTheDocument();
  });

  it("prioritizes Hotel Booking columns when hotel column exists", () => {
    const hotelColumn: ColumnProfile = {
      name: "hotel",
      detected_type: "categorical",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 2,
      top_values: [{ value: "City Hotel", count: 100 }],
    };

    const canceledColumn: ColumnProfile = {
      name: "is_canceled",
      detected_type: "categorical",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 2,
      top_values: [{ value: "0", count: 100 }],
    };

    const otherColumn: ColumnProfile = {
      name: "random_col",
      detected_type: "categorical",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 5,
      top_values: [{ value: "A", count: 100 }],
    };

    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters
        columns={[otherColumn, canceledColumn, hotelColumn]}
        filters={{}}
        onFilterChange={mockFilterChange}
      />
    );

    // Hotel should appear before other columns
    const hotelButton = screen.getByText("hotel");
    const randomButton = screen.getByText("random_col");

    // Check that hotel comes first in the DOM
    expect(hotelButton.compareDocumentPosition(randomButton)).toBe(4);
  });

  it("handles dropdown open/close toggling", () => {
    const columns = [mockCategoricalColumn];
    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters columns={columns} filters={{}} onFilterChange={mockFilterChange} />
    );

    const filterButton = screen.getByText("hotel");

    // Initially closed, options not visible
    expect(screen.queryByText("City Hotel")).not.toBeInTheDocument();

    // Open dropdown
    fireEvent.click(filterButton);
    expect(screen.getByText("City Hotel")).toBeInTheDocument();

    // Close dropdown
    fireEvent.click(filterButton);
    expect(screen.queryByText("City Hotel")).not.toBeInTheDocument();
  });

  it("shows +N more values indicator when column has many values", () => {
    const manyValuesColumn: ColumnProfile = {
      name: "test",
      detected_type: "categorical",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 50,
      top_values: Array.from({ length: 20 }, (_, i) => ({
        value: `value_${i}`,
        count: 100 - i,
      })),
    };

    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters columns={[manyValuesColumn]} filters={{}} onFilterChange={mockFilterChange} />
    );

    const filterButton = screen.getByText("test");
    fireEvent.click(filterButton);

    expect(screen.getByText("+10 more values")).toBeInTheDocument();
  });

  it("limits displayed columns to 6 for generic CSV", () => {
    const columns = Array.from({ length: 10 }, (_, i) => ({
      name: `col_${i}`,
      detected_type: "categorical" as const,
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 5,
      top_values: [{ value: "A", count: 100 }],
    }));

    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters columns={columns} filters={{}} onFilterChange={mockFilterChange} />
    );

    // Should show only first 6
    expect(screen.getByText("col_0")).toBeInTheDocument();
    expect(screen.getByText("col_5")).toBeInTheDocument();
    expect(screen.queryByText("col_6")).not.toBeInTheDocument();
  });

  it("skips numeric columns when building filters", () => {
    const columns = [
      mockCategoricalColumn,
      mockNumericColumn,
      mockCategoricalColumn2,
    ];
    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters columns={columns} filters={{}} onFilterChange={mockFilterChange} />
    );

    expect(screen.getByText("hotel")).toBeInTheDocument();
    expect(screen.getByText("country")).toBeInTheDocument();
    expect(screen.queryByText("lead_time")).not.toBeInTheDocument();
  });

  it("skips categorical columns with too many unique values", () => {
    const tooManyValuesColumn: ColumnProfile = {
      name: "high_cardinality",
      detected_type: "categorical",
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 150,
      top_values: [{ value: "A", count: 100 }],
    };

    const columns = [mockCategoricalColumn, tooManyValuesColumn];
    const mockFilterChange = vi.fn();

    render(
      <GlobalFilters columns={columns} filters={{}} onFilterChange={mockFilterChange} />
    );

    expect(screen.getByText("hotel")).toBeInTheDocument();
    expect(screen.queryByText("high_cardinality")).not.toBeInTheDocument();
  });
});
