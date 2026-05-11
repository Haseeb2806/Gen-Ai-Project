import { Profile } from "../api";
import { formatColumnLabel } from "../utils/columnLabels";
import { buildDatasetIntelligence } from "../utils/datasetIntelligence";
import { FilterState } from "./GlobalFilters";

interface DashboardProps {
  profile: Profile;
  rowCount: number;
  filters?: FilterState;
  sectionType?: "trends" | "breakdown";
}

export function Dashboard({ profile, rowCount, filters = {}, sectionType = "breakdown" }: DashboardProps) {
  const numericColumns = profile.columns.filter((col) => col.detected_type === "numeric" && !isBinaryColumn(col));
  const binaryColumns = profile.columns.filter((col) => col.detected_type === "numeric" && isBinaryColumn(col));
  const categoricalColumns = profile.columns.filter(
    (col) => col.detected_type === "categorical" && col.top_values && col.top_values.length > 0,
  );
  const totalNulls = profile.columns.reduce((sum, col) => sum + col.null_count, 0);
  const totalCells = Math.max(rowCount * profile.column_count, 1);
  const dataQuality = ((totalCells - totalNulls) / totalCells) * 100;
  const activeFilterCount = Object.values(filters).reduce((sum, values) => sum + values.length, 0);
  const intelligence = buildDatasetIntelligence(profile);

  if (sectionType === "trends") {
    return (
      <section className="space-y-6">
        {activeFilterCount > 0 ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-sm font-medium text-teal-900">
              Showing filtered data ({activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} applied)
            </p>
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Time Series & Trends</h3>
            <p className="mt-1 text-sm text-slate-600">
              How metrics evolve over time and across key dimensions.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {numericColumns.slice(0, 3).map((column) => (
              <NumericChart key={column.name} column={column} />
            ))}
            {binaryColumns.slice(0, 1).map((column) => (
              <BinaryRateChart key={column.name} column={column} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default: breakdown section
  return (
    <section className="space-y-6">
      {activeFilterCount > 0 ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
          <p className="text-sm font-medium text-teal-900">
            Showing filtered data ({activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} applied)
          </p>
        </div>
      ) : null}

      {categoricalColumns.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Category Distribution</h3>
            <p className="mt-1 text-sm text-slate-600">
              How data breaks down by key categories and segments.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {categoricalColumns.slice(0, 3).map((column) => (
              <CategoricalChart key={column.name} column={column} rowCount={rowCount} />
            ))}
          </div>
        </div>
      )}

      {(numericColumns.length > 0 || binaryColumns.length > 0) && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Key Measures</h3>
            <p className="mt-1 text-sm text-slate-600">
              Distribution and statistics for numeric fields.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {numericColumns.slice(0, 2).map((column) => (
              <NumericChart key={column.name} column={column} />
            ))}
            {binaryColumns.slice(0, 2).map((column) => (
              <BinaryRateChart key={column.name} column={column} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Data Quality</h3>
          <p className="mt-1 text-sm text-slate-600">
            Column completeness and missing value status.
          </p>
        </div>
        <DataQualityChart columns={profile.columns} rowCount={rowCount} />
      </div>
    </section>
  );
}

function CategoricalChart({
  column,
  rowCount,
}: {
  column: {
    name: string;
    top_values?: Array<{ value: string; count: number }>;
  };
  rowCount: number;
}) {
  const chartData = (column.top_values || []).map((item) => ({
    name: item.value.substring(0, 15),
    count: item.count,
    fullName: item.value,
    share: rowCount ? (item.count / rowCount) * 100 : 0,
  }));
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-slate-950">{formatColumnLabel(column.name)}</h4>
          <p className="mt-1 text-sm text-slate-500">Top values by record count</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          Category
        </span>
      </div>
      <div className="space-y-3">
        {chartData.map((item, idx) => (
          <div key={item.fullName}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-medium text-slate-700">{item.fullName}</span>
              <span className="font-semibold text-slate-900">{item.count}</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${barColor(idx)}`}
                style={{ width: `${Math.max((item.count / maxCount) * 100, 4)}%` }}
                title={`${item.fullName}: ${item.count} (${item.share.toFixed(1)}%)`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumericChart({
  column,
}: {
  column: {
    name: string;
    stats?: {
      min: number | null;
      max: number | null;
      mean: number | null;
      median: number | null;
    };
  };
}) {
  const stats = column.stats;
  if (!stats) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-slate-950">{formatColumnLabel(column.name)}</h4>
          <p className="mt-1 text-sm text-slate-500">Range and midpoint statistics</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          Numeric Indicator
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Min" value={stats.min} />
        <StatTile label="Median" value={stats.median} />
        <StatTile label="Mean" value={stats.mean} />
        <StatTile label="Max" value={stats.max} />
      </div>
    </div>
  );
}

function BinaryRateChart({
  column,
}: {
  column: {
    name: string;
    stats?: {
      mean: number | null;
    };
  };
}) {
  const mean = column.stats?.mean;
  if (mean === null || mean === undefined) return null;
  const inverse = 1 - mean;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-slate-950">{formatColumnLabel(column.name)}</h4>
          <p className="mt-1 text-sm text-slate-500">Binary outcome summarized as a rate</p>
        </div>
        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
          Rate Indicator
        </span>
      </div>
      <div className="space-y-3">
        <RateBar label={binaryRateLabel(column.name)} value={mean} />
        <RateBar label={binaryInverseLabel(column.name)} value={inverse} />
      </div>
    </div>
  );
}

function RateBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.max(value * 100, 4)}%` }} />
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">
        {value !== null ? formatNumber(value) : "-"}
      </p>
    </div>
  );
}

function DataQualityChart({
  columns,
  rowCount,
}: {
  columns: Array<{ name: string; null_count: number }>;
  rowCount: number;
}) {
  const sortedColumns = [...columns].sort((a, b) => b.null_count - a.null_count).slice(0, 6);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-4">
        {sortedColumns.map((column) => {
          const completeness = rowCount ? ((rowCount - column.null_count) / rowCount) * 100 : 100;
          return (
            <div key={column.name}>
              <div className="flex justify-between gap-3 text-xs">
                <span className="font-medium text-slate-700">{formatColumnLabel(column.name)}</span>
                <span className="text-slate-600">{completeness.toFixed(1)}% complete</span>
              </div>
              <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className={`h-2.5 rounded-full ${completeness < 95 ? "bg-amber-500" : "bg-teal-600"}`}
                  style={{ width: `${Math.max(completeness, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function barColor(index: number) {
  return ["bg-teal-600", "bg-blue-600", "bg-amber-500", "bg-indigo-500", "bg-emerald-500"][
    index % 5
  ];
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
}

function isBinaryColumn(column: {
  detected_type: string;
  name: string;
  stats?: { min: number | null; max: number | null; mean: number | null };
  unique_value_count: number;
}): boolean {
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
  return `${formatColumnLabel(columnName).replace(/ Status$/i, "")} Rate`;
}

function binaryInverseLabel(columnName: string): string {
  if (columnName.toLowerCase() === "is_canceled") return "Not Canceled";
  if (columnName.toLowerCase() === "is_repeated_guest") return "Not Repeat Guest";
  return `Not ${formatColumnLabel(columnName).replace(/ Status$/i, "")}`;
}
