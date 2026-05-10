import { useMemo, useState } from "react";

import { ColumnProfile } from "../api";
import { formatColumnLabel } from "../utils/columnLabels";

const EMPTY_VALUE = "\u2014";

interface ProfileSummaryProps {
  columns: ColumnProfile[];
  rowCount: number;
}

export function ProfileSummary({ columns, rowCount }: ProfileSummaryProps) {
  const [query, setQuery] = useState("");
  const filteredColumns = useMemo(
    () =>
      columns.filter((column) => {
        const searchText = `${column.name} ${formatColumnLabel(column.name)}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      }),
    [columns, query],
  );

  return (
    <section className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
            Schema profile
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Profile Summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            Compact scan of column types, completeness, uniqueness, and useful statistics.
          </p>
        </div>
        <label className="w-full max-w-sm text-sm font-medium text-slate-700">
          Search columns
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by field label or raw name"
            type="search"
            value={query}
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-900 text-white">
              <th className="px-4 py-3 text-left font-semibold">Column</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-center font-semibold">Nulls</th>
              <th className="px-4 py-3 text-center font-semibold">Unique</th>
              <th className="px-4 py-3 text-left font-semibold">Stats</th>
            </tr>
          </thead>
          <tbody>
            {filteredColumns.map((column, idx) => (
              <tr
                className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                key={column.name}
              >
                <td className="px-4 py-3 font-medium text-slate-900">
                  {formatColumnLabel(column.name)}
                </td>
                <td className="px-4 py-3">
                  <TypeBadge type={column.detected_type} />
                </td>
                <td className="px-4 py-3 text-center text-slate-700">
                  {column.null_count} ({column.null_percentage}%)
                </td>
                <td className="px-4 py-3 text-center text-slate-700">
                  {column.unique_value_count}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <ColumnStats column={column} rowCount={rowCount} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="rounded-xl border border-slate-200 bg-slate-50 p-4" open>
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
          Detailed Column Profile
        </summary>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredColumns.map((column) => (
            <ColumnDetail key={column.name} column={column} />
          ))}
        </div>
      </details>
    </section>
  );
}

function TypeBadge({ type }: { type: ColumnProfile["detected_type"] }) {
  const classes = {
    categorical: "bg-blue-50 text-blue-700 ring-blue-200",
    datetime: "bg-purple-50 text-purple-700 ring-purple-200",
    numeric: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    text: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  const labels = {
    categorical: "Category",
    datetime: "Date / Time",
    numeric: "Numeric",
    text: "Text",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${classes[type]}`}>
      {labels[type]}
    </span>
  );
}

function ColumnStats({ column, rowCount }: { column: ColumnProfile; rowCount: number }) {
  if (column.detected_type === "numeric" && column.stats) {
    if (isBinaryColumn(column)) {
      return (
        <div className="text-xs text-slate-600">
          <div>{binaryRateLabel(column.name)}: {formatRate(column.stats.mean)}</div>
          <div>{binaryInverseLabel(column.name)}: {formatRate(1 - (column.stats.mean ?? 0))}</div>
        </div>
      );
    }

    const { min, max, mean, median } = column.stats;
    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
        <div>Min: {min !== null ? formatNumber(min) : EMPTY_VALUE}</div>
        <div>Max: {max !== null ? formatNumber(max) : EMPTY_VALUE}</div>
        <div>Mean: {mean !== null ? formatNumber(mean) : EMPTY_VALUE}</div>
        <div>Median: {median !== null ? formatNumber(median) : EMPTY_VALUE}</div>
      </div>
    );
  }

  if (column.detected_type === "categorical" && column.top_values && column.top_values.length > 0) {
    return (
      <div className="text-xs text-slate-600">
        <div>Top: {column.top_values[0].value}</div>
        <div>({column.top_values[0].count} x {((column.top_values[0].count / rowCount) * 100).toFixed(1)}%)</div>
      </div>
    );
  }

  return <span className="text-slate-500">{EMPTY_VALUE}</span>;
}

function ColumnDetail({ column }: { column: ColumnProfile }) {
  if (column.detected_type === "numeric" && column.stats) {
    if (isBinaryColumn(column)) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <ColumnDetailHeader column={column} />
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Metric label={binaryRateLabel(column.name)} value={formatRate(column.stats.mean)} />
            <Metric label={binaryInverseLabel(column.name)} value={formatRate(1 - (column.stats.mean ?? 0))} />
          </dl>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <ColumnDetailHeader column={column} />
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Metric label="Min" value={column.stats.min !== null ? formatNumber(column.stats.min) : EMPTY_VALUE} />
          <Metric label="Max" value={column.stats.max !== null ? formatNumber(column.stats.max) : EMPTY_VALUE} />
          <Metric label="Mean" value={column.stats.mean !== null ? formatNumber(column.stats.mean) : EMPTY_VALUE} />
          <Metric label="Median" value={column.stats.median !== null ? formatNumber(column.stats.median) : EMPTY_VALUE} />
        </dl>
      </div>
    );
  }

  if (column.detected_type === "categorical" && column.top_values && column.top_values.length > 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <ColumnDetailHeader column={column} />
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Top values:</p>
          <ul className="space-y-2">
            {column.top_values.map((topValue) => (
              <li key={topValue.value} className="flex justify-between gap-3 text-sm text-slate-700">
                <span className="font-mono">{topValue.value}</span>
                <span className="text-slate-600">{topValue.count} occurrences</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <ColumnDetailHeader column={column} />
    </div>
  );
}

function ColumnDetailHeader({ column }: { column: ColumnProfile }) {
  return (
    <div>
      <h4 className="font-semibold text-slate-900">{formatColumnLabel(column.name)}</h4>
      <p className="mt-1 text-xs text-slate-500">
        Raw column: <span className="font-mono">{column.name}</span>
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <TypeBadge type={column.detected_type} />
        <span>{column.unique_value_count} unique values</span>
        {column.null_count > 0 ? (
          <span>
            {column.null_count} nulls ({column.null_percentage}%)
          </span>
        ) : null}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-slate-600">{label}</dt>
      <dd className="mt-1 text-slate-950">{value}</dd>
    </div>
  );
}

function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return EMPTY_VALUE;
  if (typeof value !== "number") return String(value);
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

function isBinaryColumn(column: ColumnProfile): boolean {
  const stats = column.stats;
  return (
    column.detected_type === "numeric" &&
    !!stats &&
    stats.min === 0 &&
    stats.max === 1 &&
    column.unique_value_count <= 2 &&
    stats.mean !== null &&
    stats.mean !== undefined
  );
}

function binaryRateLabel(columnName: string): string {
  if (columnName.toLowerCase() === "is_canceled") return "Cancellation Rate";
  if (columnName.toLowerCase() === "is_repeated_guest") return "Repeat Guest Rate";
  const label = formatColumnLabel(columnName).replace(/ Status$/i, "");
  return `${label} Rate`;
}

function binaryInverseLabel(columnName: string): string {
  if (columnName.toLowerCase() === "is_canceled") return "Not Canceled";
  if (columnName.toLowerCase() === "is_repeated_guest") return "Not Repeat Guest";
  return `Not ${formatColumnLabel(columnName).replace(/ Status$/i, "")}`;
}

function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return EMPTY_VALUE;
  return `${(value * 100).toFixed(1)}%`;
}
