import React, { useState } from "react";
import { ColumnProfile } from "../api";

export interface FilterState {
  [columnName: string]: string[];
}

interface GlobalFiltersProps {
  columns: ColumnProfile[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

// Hotel Booking dataset preferred filter columns
const HOTEL_BOOKING_FILTERS = [
  "hotel",
  "arrival_date_year",
  "arrival_date_month",
  "country",
  "market_segment",
  "customer_type",
  "is_canceled",
];

export function GlobalFilters({ columns, filters, onFilterChange }: GlobalFiltersProps) {
  // Get categorical columns suitable for filtering
  // Prioritize Hotel Booking columns if they exist
  const getCategoricalColumnsForFilters = () => {
    const categoricalCols = columns.filter(
      (col) =>
        col.detected_type === "categorical" &&
        col.top_values &&
        col.top_values.length > 0 &&
        col.unique_value_count <= 100 // Reasonable threshold
    );

    // Check if this is Hotel Booking dataset (has hotel column)
    const hasHotelColumn = categoricalCols.some((col) => col.name === "hotel");

    if (hasHotelColumn) {
      // For Hotel Booking, prioritize HOTEL_BOOKING_FILTERS
      const prioritized = categoricalCols.sort((a, b) => {
        const aIndex = HOTEL_BOOKING_FILTERS.indexOf(a.name);
        const bIndex = HOTEL_BOOKING_FILTERS.indexOf(b.name);

        // If both in priority list or both not, maintain original order
        if ((aIndex >= 0 && bIndex >= 0) || (aIndex === -1 && bIndex === -1)) {
          return categoricalCols.indexOf(a) - categoricalCols.indexOf(b);
        }

        // If only a is in priority list, it comes first
        if (aIndex >= 0) return -1;
        // Otherwise b is in priority list, it comes first
        return 1;
      });

      // Return at most 6 columns for display
      return prioritized.slice(0, 6);
    }

    // For generic CSV, return first 6 categorical columns
    return categoricalCols.slice(0, 6);
  };

  const filterableColumns = getCategoricalColumnsForFilters();

  if (filterableColumns.length === 0) {
    return null;
  }

  const handleToggleValue = (columnName: string, value: string) => {
    const currentValues = filters[columnName] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFilterChange({
      ...filters,
      [columnName]: newValues,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some((values) => values.length > 0);

  return (
    <div className="mt-6 rounded border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Global Filters</h3>
        {hasActiveFilters && (
          <button
            className="text-sm font-medium text-teal-700 hover:text-teal-800"
            onClick={handleClearFilters}
            type="button"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filterableColumns.map((column) => (
          <FilterDropdown
            key={column.name}
            column={column}
            selectedValues={filters[column.name] || []}
            onToggleValue={(value) => handleToggleValue(column.name, value)}
          />
        ))}
      </div>
    </div>
  );
}

interface FilterDropdownProps {
  column: ColumnProfile;
  selectedValues: string[];
  onToggleValue: (value: string) => void;
}

function FilterDropdown({ column, selectedValues, onToggleValue }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const topValues = column.top_values || [];
  const displayLimit = 10; // Show top 10 values

  return (
    <div className="relative">
      <button
        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-left text-sm font-medium text-slate-900 hover:border-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-0"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className="flex items-center justify-between">
          <span className="truncate">
            {selectedValues.length > 0 ? `${column.name} (${selectedValues.length})` : column.name}
          </span>
          <span className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded border border-slate-300 bg-white shadow-lg">
          <div className="space-y-1 p-2">
            {topValues.slice(0, displayLimit).map(({ value }) => (
              <label key={value} className="flex items-center space-x-2 px-2 py-1 hover:bg-slate-100">
                <input
                  checked={selectedValues.includes(value)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300"
                  onChange={() => onToggleValue(value)}
                  type="checkbox"
                />
                <span className="text-sm text-slate-700">{value}</span>
              </label>
            ))}
            {topValues.length > displayLimit && (
              <div className="px-2 py-1 text-xs text-slate-500">
                +{topValues.length - displayLimit} more values
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
