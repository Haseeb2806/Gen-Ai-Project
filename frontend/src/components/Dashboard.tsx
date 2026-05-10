import { Profile } from "../api";
import { formatColumnLabel } from "../utils/columnLabels";
import { buildDatasetIntelligence } from "../utils/datasetIntelligence";
import { FilterState } from "./GlobalFilters";

interface DashboardProps {
  profile: Profile;
  rowCount: number;
  filters?: FilterState;
}

export function Dashboard({ profile, rowCount, filters = {} }: DashboardProps) {
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

  return (
    <section className="mt-8 space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
              Analytics workspace
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">{intelligence.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {intelligence.description}
            </p>
          </div>
          {activeFilterCount > 0 ? (
            <span className="inline-flex w-fit rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
              Filters applied - dashboard is showing filtered data
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {intelligence.kpis.slice(0, 4).map((kpi) => (
            <SummaryCard
              accent={summaryAccent(kpi.tone)}
              key={kpi.label}
              label={kpi.label}
              subtitle={kpi.subtitle}
              value={kpi.value}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Important Insights</h3>
          <p className="mt-1 text-sm text-slate-600">
            Automatically selected for the detected {intelligence.typeLabel} dataset.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {intelligence.insights.map((insight) => (
            <InsightCard key={insight.label} {...insight} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeading
          eyebrow="Recommendations"
          title="Recommended Charts"
          subtitle="Suggested views based on detected fields and dataset type."
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {intelligence.chartRecommendations.map((chart) => (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700" key={chart}>
              {chart}
            </span>
          ))}
        </div>
      </div>

      {categoricalColumns.length > 0 && (
        <div className="space-y-4">
          <SectionHeading
            eyebrow="Composition"
            title="Category Breakdown"
            subtitle="Largest category shares across the most useful low-cardinality fields."
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {categoricalColumns.slice(0, 3).map((column) => (
              <CategoricalChart key={column.name} column={column} rowCount={rowCount} />
            ))}
          </div>
        </div>
      )}

      {(numericColumns.length > 0 || binaryColumns.length > 0) && (
        <div className="space-y-4">
          <SectionHeading
            eyebrow="Measures"
            title="Key Numeric Measures"
            subtitle="Core range and central tendency for the highest-signal numeric fields."
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {binaryColumns.slice(0, 2).map((column) => (
              <BinaryRateChart key={column.name} column={column} />
            ))}
            {numericColumns.slice(0, 2).map((column) => (
              <NumericChart key={column.name} column={column} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <SectionHeading
          eyebrow="Completeness"
          title="Column Completeness"
          subtitle="Columns with missing values are highlighted first for review."
        />
        <DataQualityChart columns={profile.columns} rowCount={rowCount} />
      </div>
    </section>
  );
}

function SummaryCard({
  accent,
  label,
  subtitle,
  value,
}: {
  accent: string;
  label: string;
  subtitle: string;
  value: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`h-1.5 bg-gradient-to-r ${accent}`} />
      <div className="p-5">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function summaryAccent(tone: "teal" | "blue" | "amber" | "rose" | "slate" = "slate") {
  const accents = {
    amber: "from-amber-600 to-orange-500",
    blue: "from-blue-700 to-cyan-600",
    rose: "from-rose-700 to-red-500",
    slate: "from-slate-900 to-slate-700",
    teal: "from-cyan-700 to-teal-600",
  };
  return accents[tone];
}

function InsightCard({
  detail,
  label,
  subtitle,
  tone = "teal",
  value,
}: {
  detail?: string;
  label: string;
  subtitle?: string;
  tone?: "teal" | "slate" | "amber" | "rose" | "blue";
  value: string;
}) {
  const toneClasses = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
    slate: "border-slate-200 bg-slate-50 text-slate-900",
    teal: "border-teal-200 bg-teal-50 text-teal-900",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-6 opacity-80">{detail ?? subtitle}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">{eyebrow}</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
    </div>
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
