import { useState } from "react";

import { ColumnProfile } from "../api";
import { formatColumnLabel } from "../utils/columnLabels";
import { classifyColumnRole } from "../utils/datasetIntelligence";

export interface FilterState {
  [columnName: string]: string[];
}

interface GlobalFiltersProps {
  columns: ColumnProfile[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

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
  const filterableColumns = getCategoricalColumnsForFilters(columns);

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

  const hasActiveFilters = Object.values(filters).some((values) => values.length > 0);

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Controls</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">Global Filters</h3>
          {hasActiveFilters ? (
            <p className="mt-1 text-sm text-slate-600">
              {Object.values(filters).reduce((sum, values) => sum + values.length, 0)} applied filter
              {Object.values(filters).reduce((sum, values) => sum + values.length, 0) !== 1 ? "s" : ""}
            </p>
          ) : null}
        </div>
        {hasActiveFilters ? (
          <button
            className="w-fit rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-100"
            onClick={() => onFilterChange({})}
            type="button"
          >
            Clear filters
          </button>
        ) : null}
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

      {hasActiveFilters ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(filters).flatMap(([columnName, values]) =>
            values.map((value) => (
              <span
                className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                key={`${columnName}-${value}`}
              >
                {formatColumnLabel(columnName)}: {value}
              </span>
            )),
          )}
        </div>
      ) : null}
    </section>
  );
}

function getCategoricalColumnsForFilters(columns: ColumnProfile[]) {
  const categoricalCols = columns.filter((col) => {
    const role = classifyColumnRole(col);
    return (
      (role === "dimension" || role === "timeDimension" || role === "binaryFlag") &&
      col.top_values &&
      col.top_values.length > 0 &&
      col.unique_value_count <= 100
    );
  });
  const hasHotelColumn = categoricalCols.some((col) => col.name === "hotel");

  if (hasHotelColumn) {
    return categoricalCols
      .sort((a, b) => {
        const aIndex = HOTEL_BOOKING_FILTERS.indexOf(a.name);
        const bIndex = HOTEL_BOOKING_FILTERS.indexOf(b.name);

        if ((aIndex >= 0 && bIndex >= 0) || (aIndex === -1 && bIndex === -1)) {
          return categoricalCols.indexOf(a) - categoricalCols.indexOf(b);
        }

        return aIndex >= 0 ? -1 : 1;
      })
      .slice(0, 6);
  }

  return categoricalCols.slice(0, 6);
}

interface FilterDropdownProps {
  column: ColumnProfile;
  selectedValues: string[];
  onToggleValue: (value: string) => void;
}

function FilterDropdown({ column, selectedValues, onToggleValue }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const topValues = column.top_values || [];
  const displayLimit = 10;
  const label = formatColumnLabel(column.name);
  const buttonText =
    selectedValues.length > 0 ? `${label} (${selectedValues.length})` : label;

  return (
    <div className="relative">
      <button
        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-left text-sm font-medium text-slate-900 shadow-sm hover:border-teal-400 hover:bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-0"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className="flex items-center justify-between">
          <span className="truncate">{buttonText}</span>
          <span className={`ml-2 text-xs text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}>
            v
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="space-y-1 p-2">
            {topValues.slice(0, displayLimit).map(({ value }) => (
              <label key={value} className="flex items-center space-x-2 rounded-lg px-2 py-1.5 hover:bg-slate-100">
                <input
                  checked={selectedValues.includes(value)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-teal-700"
                  onChange={() => onToggleValue(value)}
                  type="checkbox"
                />
                <span className="text-sm text-slate-700">{value}</span>
              </label>
            ))}
            {topValues.length > displayLimit ? (
              <div className="px-2 py-1 text-xs text-slate-500">
                +{topValues.length - displayLimit} more values
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
