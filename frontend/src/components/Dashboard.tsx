import { Profile } from "../api";
import { FilterState } from "./GlobalFilters";

interface DashboardProps {
  profile: Profile;
  rowCount: number;
  filters?: FilterState;
}

export function Dashboard({ profile, rowCount, filters = {} }: DashboardProps) {
  const numericColumns = profile.columns.filter((col) => col.detected_type === "numeric");
  const categoricalColumns = profile.columns.filter(
    (col) => col.detected_type === "categorical" && col.top_values && col.top_values.length > 0
  );
  const datetimeColumns = profile.columns.filter((col) => col.detected_type === "datetime");

  return (
    <div className="mt-8 space-y-8">
      <div>
        <h2 className="mb-4 text-2xl font-semibold text-slate-950">Dashboard</h2>
        {Object.values(filters).some((values) => values.length > 0) && (
          <p className="text-sm text-teal-700">
            Filters applied - dashboard is showing filtered data
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Rows" value={rowCount.toLocaleString()} />
        <SummaryCard label="Total Columns" value={profile.column_count.toLocaleString()} />
        <SummaryCard
          label="Missing Values"
          value={profile.columns.reduce((sum, col) => sum + col.null_count, 0).toLocaleString()}
        />
        <SummaryCard
          label="Data Quality"
          value={`${(
            ((rowCount * profile.column_count -
              profile.columns.reduce((sum, col) => sum + col.null_count, 0)) /
              (rowCount * profile.column_count)) *
            100
          ).toFixed(1)}%`}
        />
      </div>

      {/* Categorical Charts */}
      {categoricalColumns.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Categorical Distributions</h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {categoricalColumns.slice(0, 3).map((column) => (
              <CategoricalChart key={column.name} column={column} />
            ))}
          </div>
        </div>
      )}

      {/* Numeric Distributions */}
      {numericColumns.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Numeric Distributions</h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {numericColumns.slice(0, 2).map((column) => (
              <NumericChart key={column.name} column={column} />
            ))}
          </div>
        </div>
      )}

      {/* Data Quality Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Data Quality by Column</h3>
        <DataQualityChart columns={profile.columns} rowCount={rowCount} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function CategoricalChart({
  column,
}: {
  column: {
    name: string;
    top_values?: Array<{ value: string; count: number }>;
  };
}) {
  const chartData = (column.top_values || []).map((item) => ({
    name: item.value.substring(0, 15),
    count: item.count,
    fullName: item.value,
  }));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-4 text-sm font-semibold text-slate-900">{column.name}</h4>
      <div className="h-48">
        <div className="flex h-full items-end gap-2">
          {chartData.map((item, idx) => {
            const maxCount = Math.max(...chartData.map((d) => d.count), 1);
            const height = (item.count / maxCount) * 100;
            return (
              <div key={idx} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-blue-500"
                  style={{ height: `${height}%` }}
                  title={`${item.fullName}: ${item.count}`}
                />
                <span className="truncate text-xs text-slate-600">{item.name}</span>
                <span className="text-xs font-medium text-slate-700">{item.count}</span>
              </div>
            );
          })}
        </div>
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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-4 text-sm font-semibold text-slate-900">{column.name}</h4>
      <div className="space-y-3">
        <StatRow label="Min" value={stats.min} />
        <StatRow label="Median" value={stats.median} />
        <StatRow label="Mean" value={stats.mean} />
        <StatRow label="Max" value={stats.max} />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number | null }) {
  const percentage =
    value !== null && value !== undefined
      ? Math.min(Math.max((value as number) / 100, 0), 100)
      : 0;

  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-mono text-slate-900">{value !== null ? value.toFixed(2) : "—"}</span>
      </div>
      <div className="mt-1 h-1 w-full rounded-full bg-slate-200">
        <div className="h-1 rounded-full bg-green-500" style={{ width: `${percentage}%` }} />
      </div>
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
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        {columns.slice(0, 6).map((column) => {
          const completeness = ((rowCount - column.null_count) / rowCount) * 100;
          return (
            <div key={column.name}>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600">{column.name}</span>
                <span className="text-slate-700">
                  {completeness.toFixed(1)}% complete
                </span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-teal-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
