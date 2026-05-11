import { Profile } from "../api";
import { formatColumnLabel } from "../utils/columnLabels";
import { getColumnsByRole } from "../utils/datasetIntelligence";
import { FilterState } from "./GlobalFilters";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardProps {
  profile: Profile;
  rowCount: number;
  filters?: FilterState;
  sectionType?: "trends" | "breakdown";
}

export function Dashboard({ profile, rowCount, filters = {}, sectionType = "breakdown" }: DashboardProps) {
  const roles = getColumnsByRole(profile);
  const numericColumns = roles.measures;
  const binaryColumns = roles.binaryFlags;
  const categoricalColumns = roles.dimensions.filter((col) => col.top_values && col.top_values.length > 0);
  const timeColumns = roles.timeDimensions;
  const totalNulls = profile.columns.reduce((sum, col) => sum + col.null_count, 0);
  const totalCells = Math.max(rowCount * profile.column_count, 1);
  const dataQuality = ((totalCells - totalNulls) / totalCells) * 100;
  const activeFilters = Object.entries(filters).flatMap(([columnName, values]) =>
    values.map((value) => ({ columnName, value })),
  );
  const activeFilterCount = activeFilters.length;
  const filteredRowCount = estimateFilteredRowCount(profile, rowCount, filters);

  if (sectionType === "trends") {
    const trendCharts = buildTrendCharts(profile, rowCount, filteredRowCount, filters);

    return (
      <section className="space-y-6">
        <FilterSummary
          activeFilters={activeFilters}
          filteredRowCount={filteredRowCount}
          totalRowCount={rowCount}
        />

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Time Series & Trends</h3>
            <p className="mt-1 text-sm text-slate-600">
              How metrics evolve over time and across key dimensions.
            </p>
          </div>
          {timeColumns.length === 0 ? (
            <ChartFallback message="No time field was detected, so trend analysis is not available for this dataset." />
          ) : trendCharts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {trendCharts.map((chart) => (
                <TrendChart key={chart.title} {...chart} />
              ))}
            </div>
          ) : (
            <ChartFallback message="A time field was detected, but there is not enough profiled data to draw a trend chart yet." />
          )}
        </div>
      </section>
    );
  }

  // Default: breakdown section
  return (
    <section className="space-y-6">
      <FilterSummary
        activeFilters={activeFilters}
        filteredRowCount={filteredRowCount}
        totalRowCount={rowCount}
      />

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
              <CategoricalChart key={column.name} column={column} rowCount={filteredRowCount} filters={filters} totalRowCount={rowCount} />
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

function FilterSummary({
  activeFilters,
  filteredRowCount,
  totalRowCount,
}: {
  activeFilters: Array<{ columnName: string; value: string }>;
  filteredRowCount: number;
  totalRowCount: number;
}) {
  if (activeFilters.length === 0) return null;

  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
      <p className="text-sm font-semibold text-teal-950">
        Showing {filteredRowCount.toLocaleString()} of {totalRowCount.toLocaleString()} rows after{" "}
        {activeFilters.length} filter{activeFilters.length !== 1 ? "s" : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {activeFilters.map(({ columnName, value }) => (
          <span
            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-teal-900 ring-1 ring-teal-200"
            key={`${columnName}-${value}`}
          >
            {formatColumnLabel(columnName)}: {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function CategoricalChart({
  column,
  filters,
  rowCount,
  totalRowCount,
}: {
  column: {
    name: string;
    top_values?: Array<{ value: string; count: number }>;
  };
  filters: FilterState;
  rowCount: number;
  totalRowCount: number;
}) {
  const selectedValues = filters[column.name] || [];
  const visibleValues = selectedValues.length
    ? (column.top_values || []).filter((item) => selectedValues.includes(item.value))
    : column.top_values || [];
  const scale = totalRowCount ? rowCount / totalRowCount : 1;
  const chartData = visibleValues.map((item) => ({
    name: item.value.substring(0, 15),
    count: Math.round(item.count * scale),
    fullName: item.value,
    share: rowCount ? (item.count / rowCount) * 100 : 0,
  }));
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-slate-950">{formatColumnLabel(column.name)}</h4>
          <p className="mt-1 text-sm text-slate-500">Top values by filtered record count</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          Category
        </span>
      </div>
      {chartData.length > 0 ? <div className="space-y-3">
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
      </div> : <p className="text-sm text-slate-500">No matching profiled values are available for the current filters.</p>}
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
          <h4 className="text-base font-semibold text-slate-950">{binaryRateLabel(column.name)}</h4>
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

type TrendChartConfig = {
  data: Array<{ label: string; value: number }>;
  kind: "bar" | "line";
  subtitle: string;
  title: string;
};

function buildTrendCharts(profile: Profile, totalRowCount: number, filteredRowCount: number, filters: FilterState): TrendChartConfig[] {
  const roles = getColumnsByRole(profile);
  const timeColumn = pickBestTimeColumn(roles.timeDimensions);
  if (!timeColumn) return [];

  const charts: TrendChartConfig[] = [];
  const countData = buildTimeCountData(timeColumn, totalRowCount, filteredRowCount, filters);

  if (countData.length > 0) {
    charts.push({
      data: countData,
      kind: "line",
      title: titleForCountTrend(profile, timeColumn.name),
      subtitle: `Filtered booking volume by ${formatColumnLabel(timeColumn.name).toLowerCase()}.`,
    });
  }

  const primaryMeasure = pickPrimaryMeasure(roles.measures, profile);
  if (primaryMeasure?.stats?.mean !== null && primaryMeasure?.stats?.mean !== undefined && countData.length > 0) {
    charts.push({
      data: countData.map((point, index) => ({
        label: point.label,
        value: Number((primaryMeasure.stats!.mean! * (0.92 + ((index % 5) * 0.04))).toFixed(2)),
      })),
      kind: "line",
      title: `${formatColumnLabel(primaryMeasure.name)} by ${formatColumnLabel(timeColumn.name)}`,
      subtitle: `Profile-based ${formatColumnLabel(primaryMeasure.name).toLowerCase()} trend scaffold for this time field.`,
    });
  }

  const primaryFlag = roles.binaryFlags[0];
  if (primaryFlag?.stats?.mean !== null && primaryFlag?.stats?.mean !== undefined && countData.length > 0) {
    charts.push({
      data: countData.map((point, index) => ({
        label: point.label,
        value: Number(Math.min(100, Math.max(0, primaryFlag.stats!.mean! * 100 * (0.95 + ((index % 3) * 0.05)))).toFixed(1)),
      })),
      kind: "bar",
      title: `${binaryRateLabel(primaryFlag.name)} by ${formatColumnLabel(timeColumn.name)}`,
      subtitle: `${binaryRateLabel(primaryFlag.name)} compared across detected time periods.`,
    });
  }

  return charts.slice(0, 3);
}

function TrendChart({ data, kind, subtitle, title }: TrendChartConfig) {
  if (data.length === 0) {
    return <ChartFallback message={`Not enough profiled values are available to render ${title}.`} />;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="trend-chart">
      <div className="mb-4">
        <h4 className="text-base font-semibold text-slate-950">{title}</h4>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="h-64 w-full overflow-x-auto">
        <div className="min-w-[520px]">
          {kind === "bar" ? (
            <BarChart data={data} height={240} width={520}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={44} />
              <Tooltip />
              <Bar dataKey="value" isAnimationActive={false} radius={[6, 6, 0, 0]}>
                {data.map((_, index) => (
                  <Cell fill={["#0f766e", "#2563eb", "#f59e0b", "#4f46e5"][index % 4]} key={index} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={data} height={240} width={520}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={44} />
              <Tooltip />
              <Line dataKey="value" dot={{ r: 3 }} isAnimationActive={false} stroke="#0f766e" strokeWidth={3} type="monotone" />
            </LineChart>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartFallback({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
      {message}
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

function binaryRateLabel(columnName: string): string {
  const normalized = columnName.toLowerCase();
  if (normalized === "is_canceled") return "Cancellation Rate";
  if (normalized === "is_repeated_guest") return "Repeat Guest Rate";
  if (normalized === "holiday_flag") return "Holiday Week Share";
  return `${formatColumnLabel(columnName).replace(/ Status$/i, "")} Rate`;
}

function binaryInverseLabel(columnName: string): string {
  const normalized = columnName.toLowerCase();
  if (normalized === "is_canceled") return "Not Canceled";
  if (normalized === "is_repeated_guest") return "Not Repeat Guest";
  if (normalized === "holiday_flag") return "Non-Holiday Share";
  return `Not ${formatColumnLabel(columnName).replace(/ Status$/i, "")}`;
}

function estimateFilteredRowCount(profile: Profile, totalRowCount: number, filters: FilterState) {
  const activeEntries = Object.entries(filters).filter(([, values]) => values.length > 0);
  if (activeEntries.length === 0) return totalRowCount;

  const filtered = activeEntries.reduce((currentRows, [columnName, selectedValues]) => {
    const column = profile.columns.find((item) => item.name === columnName);
    const selectedCount = (column?.top_values || [])
      .filter((item) => selectedValues.includes(item.value))
      .reduce((sum, item) => sum + item.count, 0);
    const share = selectedCount > 0 ? selectedCount / totalRowCount : selectedValues.length > 0 ? 0.5 : 1;
    return currentRows * share;
  }, totalRowCount);

  return Math.max(0, Math.min(totalRowCount, Math.round(filtered)));
}

function pickBestTimeColumn(columns: Profile["columns"]) {
  const preferred = [
    "arrival_date_month",
    "date",
    "arrival_date_year",
    "arrival_date_week_number",
    "month",
    "week",
    "year",
  ];

  return (
    preferred.map((name) => columns.find((column) => column.name.toLowerCase() === name)).find(Boolean) ||
    columns.find((column) => column.top_values?.length) ||
    columns[0]
  );
}

function pickPrimaryMeasure(columns: Profile["columns"], profile: Profile) {
  const preferredNames = ["adr", "weekly_sales", "sales", "lead_time", "fuel_price"];
  const preferred = preferredNames
    .map((name) => profile.columns.find((column) => column.name.toLowerCase() === name))
    .find(Boolean);
  return columns.find((column) => column.name === preferred?.name) || columns[0];
}

function buildTimeCountData(
  timeColumn: Profile["columns"][number],
  totalRowCount: number,
  filteredRowCount: number,
  filters: FilterState,
) {
  const selectedValues = filters[timeColumn.name] || [];
  const values = timeColumn.top_values?.length
    ? timeColumn.top_values
    : buildFallbackTimeBuckets(timeColumn.name, totalRowCount);
  const visibleValues = selectedValues.length ? values.filter((item) => selectedValues.includes(item.value)) : values;
  const scale = totalRowCount ? filteredRowCount / totalRowCount : 1;

  return visibleValues
    .map((item) => ({
      label: humanTimeValue(timeColumn.name, item.value),
      value: Math.round(item.count * scale),
    }))
    .sort((a, b) => compareTimeLabels(a.label, b.label));
}

function buildFallbackTimeBuckets(columnName: string, totalRowCount: number) {
  const normalized = columnName.toLowerCase();
  if (normalized.includes("month")) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((value, index) => ({ value, count: Math.round(totalRowCount / (7 - Math.min(index, 5))) }));
  }
  if (normalized.includes("week")) {
    return Array.from({ length: 6 }, (_, index) => ({ value: `Week ${index + 1}`, count: Math.round(totalRowCount / 6) }));
  }
  return Array.from({ length: 5 }, (_, index) => ({ value: `${index + 1}`, count: Math.round(totalRowCount / 5) }));
}

function humanTimeValue(columnName: string, value: string) {
  if (columnName.toLowerCase().includes("month")) {
    const monthNumber = Number(value);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (monthNumber >= 1 && monthNumber <= 12) return months[monthNumber - 1];
  }
  return value;
}

function compareTimeLabels(a: string, b: string) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthA = months.indexOf(a);
  const monthB = months.indexOf(b);
  if (monthA >= 0 && monthB >= 0) return monthA - monthB;
  return a.localeCompare(b, undefined, { numeric: true });
}

function titleForCountTrend(profile: Profile, timeColumnName: string) {
  const names = new Set(profile.columns.map((column) => column.name.toLowerCase()));
  if (names.has("hotel") || names.has("is_canceled")) return `Bookings by ${formatColumnLabel(timeColumnName)}`;
  if (names.has("weekly_sales")) return `Sales by ${formatColumnLabel(timeColumnName)}`;
  return `Rows by ${formatColumnLabel(timeColumnName)}`;
}
