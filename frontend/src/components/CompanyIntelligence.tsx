import { FormEvent, useMemo, useRef, useState } from "react";

import { ColumnProfile, UploadResponse } from "../api";

export type CompanyContext = {
  companyName: string;
  industry: string;
  region: string;
  datasetPeriod: string;
  businessObjective: string;
  backgroundNotes: string;
};

type CompanyIntelligenceProps = {
  context: CompanyContext;
  dataset: UploadResponse;
  onChange: (context: CompanyContext) => void;
};

const EMPTY_CONTEXT: CompanyContext = {
  companyName: "",
  industry: "",
  region: "",
  datasetPeriod: "",
  businessObjective: "",
  backgroundNotes: "",
};

export function createEmptyCompanyContext(): CompanyContext {
  return { ...EMPTY_CONTEXT };
}

export function CompanyIntelligence({ context, dataset, onChange }: CompanyIntelligenceProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const report = useMemo(() => buildReportModel(context, dataset), [context, dataset]);
  const reportText = useMemo(() => buildReportText(report), [report]);
  const reportRef = useRef<HTMLDivElement>(null);

  function updateField(field: keyof CompanyContext, value: string) {
    onChange({ ...context, [field]: value });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard?.writeText(reportText);
      setCopyStatus("Report text copied.");
    } catch {
      setCopyStatus("Copy is not available in this browser.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
        <form
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
              Business context
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Company Context</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add the operating context that turns this CSV profile into a business intelligence brief.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ContextField
              label="Company / Organization Name"
              onChange={(value) => updateField("companyName", value)}
              placeholder="Acme Hospitality"
              value={context.companyName}
            />
            <ContextField
              label="Industry"
              onChange={(value) => updateField("industry", value)}
              placeholder="Hospitality, retail, SaaS..."
              value={context.industry}
            />
            <ContextField
              label="Country / Region"
              onChange={(value) => updateField("region", value)}
              placeholder="Portugal, EMEA, North America..."
              value={context.region}
            />
            <ContextField
              label="Dataset Period"
              onChange={(value) => updateField("datasetPeriod", value)}
              placeholder="2015-2017, Q1 2026..."
              value={context.datasetPeriod}
            />
          </div>

          <div className="mt-4 space-y-4">
            <ContextField
              label="Business Objective"
              onChange={(value) => updateField("businessObjective", value)}
              placeholder="Reduce cancellations, understand revenue mix..."
              value={context.businessObjective}
            />
            <label className="block text-sm font-medium text-slate-700">
              Optional Company Background Notes
              <textarea
                className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                onChange={(event) => updateField("backgroundNotes", event.target.value)}
                placeholder="Paste verified context, internal notes, or a short business description."
                value={context.backgroundNotes}
              />
            </label>
          </div>

          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            Company history in this view is user-provided or AI-generated context. DataLens does not
            verify external company facts in this slice.
          </p>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
            Company Intelligence
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <IdentityTile label="Company name" value={report.companyName} />
            <IdentityTile label="Industry" value={report.industry} />
            <IdentityTile label="Region" value={report.region} />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <NarrativeBlock title="Dataset purpose" text={report.datasetPurpose} />
            <NarrativeBlock title="Business context" text={report.contextParagraph} />
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-950">Dataset relevance</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{report.datasetRelevance}</p>
          </div>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
        ref={reportRef}
      >
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 p-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">
                Visual report card
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{report.companyName}</h2>
              <p className="mt-2 text-sm text-slate-200">
                {report.datasetName} | {report.datasetPeriod}
              </p>
            </div>
            <button
              className="w-fit rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-100"
              onClick={handleCopy}
              type="button"
            >
              Copy Report Text
            </button>
          </div>
          {copyStatus ? <p className="mt-3 text-sm text-teal-100">{copyStatus}</p> : null}
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {report.keyMetrics.map((metric) => (
              <ReportMetric key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ReportList title="3 key business insights" items={report.businessInsights.slice(0, 3)} />
            <ReportList title="2 recommended actions" items={report.recommendedActions.slice(0, 2)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ContextField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function IdentityTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function NarrativeBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm"
            key={item}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

type ReportModel = {
  businessInsights: string[];
  companyName: string;
  contextParagraph: string;
  datasetName: string;
  datasetPeriod: string;
  datasetPurpose: string;
  datasetRelevance: string;
  industry: string;
  keyMetrics: Array<{ label: string; value: string }>;
  recommendedActions: string[];
  region: string;
};

export function buildReportModel(context: CompanyContext, dataset: UploadResponse): ReportModel {
  const profile = dataset.profile;
  const totalNulls = profile.columns.reduce((sum, column) => sum + column.null_count, 0);
  const totalCells = Math.max(dataset.row_count * dataset.column_count, 1);
  const dataQualityScore = ((totalCells - totalNulls) / totalCells) * 100;
  const columns = new Map(profile.columns.map((column) => [column.name.toLowerCase(), column]));
  const isHotelBooking =
    columns.has("hotel") || columns.has("is_canceled") || columns.has("adr") || columns.has("lead_time");

  const companyName = context.companyName.trim() || "Your organization";
  const industry = context.industry.trim() || "General business";
  const region = context.region.trim() || "Not specified";
  const datasetPeriod = context.datasetPeriod.trim() || "Uploaded dataset period";
  const objective = context.businessObjective.trim() || "Explore operational patterns and decision signals";
  const background = context.backgroundNotes.trim();

  const metrics = [
    { label: "Total rows", value: dataset.row_count.toLocaleString() },
    { label: "Total columns", value: dataset.column_count.toLocaleString() },
    { label: "Data quality score", value: `${dataQualityScore.toFixed(1)}%` },
    ...buildDomainMetrics(profile, isHotelBooking),
  ].slice(0, 8);

  return {
    businessInsights: buildBusinessInsights(profile, dataset.row_count, isHotelBooking),
    companyName,
    contextParagraph: background
      ? `${background} This is treated as user-provided or AI-generated context and has not been independently verified.`
      : `${companyName} is analyzed here using user-provided business context only. No external company history has been verified or assumed.`,
    datasetName: dataset.filename,
    datasetPeriod,
    datasetPurpose: objective,
    datasetRelevance: buildDatasetRelevance(industry, objective, dataset.filename, isHotelBooking),
    industry,
    keyMetrics: metrics,
    recommendedActions: buildRecommendedActions(profile, isHotelBooking),
    region,
  };
}

function buildDomainMetrics(profile: { columns: ColumnProfile[] }, isHotelBooking: boolean) {
  if (isHotelBooking) {
    const canceled = findColumn(profile.columns, "is_canceled");
    const country = findColumn(profile.columns, "country");
    const adr = findColumn(profile.columns, "adr");
    const leadTime = findColumn(profile.columns, "lead_time");
    const qualityWarning = findHighMissingColumn(profile.columns);

    return [
      canceled?.stats?.mean !== null && canceled?.stats?.mean !== undefined
        ? { label: "Cancellation rate", value: `${(canceled.stats.mean * 100).toFixed(1)}%` }
        : null,
      country?.top_values?.[0]
        ? { label: "Top source country", value: country.top_values[0].value }
        : null,
      adr?.stats?.mean !== null && adr?.stats?.mean !== undefined
        ? { label: "Average daily rate", value: formatNumber(adr.stats.mean) }
        : null,
      leadTime?.stats?.mean !== null && leadTime?.stats?.mean !== undefined
        ? { label: "Average lead time", value: `${leadTime.stats.mean.toFixed(0)} days` }
        : null,
      qualityWarning
        ? { label: "Quality warning", value: humanizeColumnName(qualityWarning.name) }
        : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }

  const dominantCategory = profile.columns.find(
    (column) => column.detected_type === "categorical" && column.top_values?.[0],
  );
  const numericColumn = profile.columns.find(
    (column) => column.detected_type === "numeric" && column.stats?.mean !== null && column.stats?.mean !== undefined,
  );
  const highMissing = findHighMissingColumn(profile.columns);

  return [
    dominantCategory?.top_values?.[0]
      ? {
          label: `${humanizeColumnName(dominantCategory.name)} leader`,
          value: dominantCategory.top_values[0].value,
        }
      : null,
    numericColumn?.stats?.mean !== null && numericColumn?.stats?.mean !== undefined
      ? {
          label: `Avg ${humanizeColumnName(numericColumn.name)}`,
          value: formatNumber(numericColumn.stats.mean),
        }
      : null,
    highMissing
      ? { label: "Quality warning", value: humanizeColumnName(highMissing.name) }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
}

function buildBusinessInsights(profile: { columns: ColumnProfile[] }, rowCount: number, isHotelBooking: boolean) {
  if (isHotelBooking) {
    const canceled = findColumn(profile.columns, "is_canceled");
    const country = findColumn(profile.columns, "country");
    const adr = findColumn(profile.columns, "adr");
    const leadTime = findColumn(profile.columns, "lead_time");
    const warning = findHighMissingColumn(profile.columns);

    return [
      canceled?.stats?.mean !== null && canceled?.stats?.mean !== undefined
        ? `Cancellation rate is ${(canceled.stats.mean * 100).toFixed(1)}%, making booking retention a primary operating signal.`
        : "Cancellation performance cannot be calculated from the available profile fields.",
      country?.top_values?.[0]
        ? `${country.top_values[0].value} is the top source country with ${country.top_values[0].count.toLocaleString()} rows, or ${((country.top_values[0].count / rowCount) * 100).toFixed(1)}% of the dataset.`
        : "Source market concentration cannot be inferred without a country field.",
      adr?.stats?.mean !== null && adr?.stats?.mean !== undefined && leadTime?.stats?.mean !== null && leadTime?.stats?.mean !== undefined
        ? `Average daily rate is ${formatNumber(adr.stats.mean)} and average lead time is ${leadTime.stats.mean.toFixed(0)} days, useful for revenue and demand-planning review.`
        : "Rate and lead-time signals are only shown when ADR and lead time fields are present.",
      warning
        ? `${humanizeColumnName(warning.name)} has ${warning.null_percentage}% missing values and should be treated carefully in reporting.`
        : "No high-missing Hotel Booking context field was detected in the profile.",
    ];
  }

  const categorical = profile.columns.find(
    (column) => column.detected_type === "categorical" && column.top_values?.[0],
  );
  const numeric = profile.columns.find(
    (column) => column.detected_type === "numeric" && column.stats?.mean !== null && column.stats?.mean !== undefined,
  );
  const missing = findHighMissingColumn(profile.columns);

  return [
    categorical?.top_values?.[0]
      ? `${humanizeColumnName(categorical.name)} is led by ${categorical.top_values[0].value}, giving the dashboard a clear segmentation starting point.`
      : "No low-cardinality category field was available for a dominant segment insight.",
    numeric?.stats?.mean !== null && numeric?.stats?.mean !== undefined
      ? `${humanizeColumnName(numeric.name)} averages ${formatNumber(numeric.stats.mean)}, making it a useful numeric performance indicator.`
      : "No numeric average was available for a metric-style business signal.",
    missing
      ? `${humanizeColumnName(missing.name)} has ${missing.null_percentage}% missing values, so any decision using that field should include quality caveats.`
      : "The profile does not show a column above the high-missing threshold.",
  ];
}

function buildRecommendedActions(profile: { columns: ColumnProfile[] }, isHotelBooking: boolean) {
  const warning = findHighMissingColumn(profile.columns);

  if (isHotelBooking) {
    return [
      "Review cancellation patterns by hotel type, source market, and lead-time band before changing pricing or deposit policies.",
      warning
        ? `Validate ${humanizeColumnName(warning.name)} before using it for targeting, attribution, or partner performance reporting.`
        : "Use the cleanest fields first for executive reporting, then add deeper cuts once row-level validation is complete.",
    ];
  }

  return [
    "Start with the dominant categorical segment and strongest numeric measure to define the first dashboard view.",
    warning
      ? `Resolve or explain missing values in ${humanizeColumnName(warning.name)} before presenting the field to stakeholders.`
      : "Confirm field definitions with a business owner so generic CSV columns are interpreted consistently.",
  ];
}

function buildDatasetRelevance(
  industry: string,
  objective: string,
  filename: string,
  isHotelBooking: boolean,
) {
  if (isHotelBooking) {
    return `${filename} is relevant because it connects reservations, cancellations, source markets, lead time, and ADR into one operating view for ${industry}. The analysis supports the stated objective: ${objective}.`;
  }

  return `${filename} is relevant because its profile reveals the available measures, segments, and quality constraints for ${industry}. The analysis stays generic and adapts to the uploaded CSV structure.`;
}

function findColumn(columns: ColumnProfile[], name: string) {
  return columns.find((column) => column.name.toLowerCase() === name);
}

function findHighMissingColumn(columns: ColumnProfile[]) {
  return columns.find((column) => column.null_percentage >= 20);
}

function humanizeColumnName(name: string) {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
}

function buildReportText(report: ReportModel) {
  return [
    `${report.companyName} - DataLens Report`,
    `Dataset: ${report.datasetName}`,
    `Industry: ${report.industry}`,
    `Region: ${report.region}`,
    `Period: ${report.datasetPeriod}`,
    `Purpose: ${report.datasetPurpose}`,
    "",
    "Key metrics:",
    ...report.keyMetrics.map((metric) => `- ${metric.label}: ${metric.value}`),
    "",
    "Business insights:",
    ...report.businessInsights.slice(0, 3).map((insight) => `- ${insight}`),
    "",
    "Recommended actions:",
    ...report.recommendedActions.slice(0, 2).map((action) => `- ${action}`),
  ].join("\n");
}
