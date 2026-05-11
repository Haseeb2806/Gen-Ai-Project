import { FormEvent, useRef, useState } from "react";

import { UploadResponse, uploadCsv } from "../api";
import { formatColumnLabel } from "../utils/columnLabels";
import { buildDatasetIntelligence } from "../utils/datasetIntelligence";
import { ChatPanel } from "./ChatPanel";
import { CompactUploadBar } from "./CompactUploadBar";
import { Dashboard } from "./Dashboard";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { FilterState, GlobalFilters } from "./GlobalFilters";
import { ProfileSummary } from "./ProfileSummary";

const SECTION_NAV = [
  { id: "overview", label: "Overview" },
  { id: "trends", label: "Trends" },
  { id: "breakdown", label: "Breakdown" },
  { id: "profile", label: "Data Profile" },
  { id: "chat", label: "Ask Data" },
  { id: "summary", label: "Summary" },
];

export function UploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intelligence = uploadResult ? buildDatasetIntelligence(uploadResult.profile, uploadResult.filename) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setError("Select a CSV file before uploading.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadCsv(selectedFile);
      setUploadResult(response);
      window.setTimeout(() => {
        document.getElementById("overview")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      }, 0);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleChangeFile() {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
    setFilters({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (!uploadResult) {
    return (
      <section className="w-full space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-xl">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">
                Get started
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                Upload your CSV file
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                DataLens will automatically detect your dataset type, profile the data, and build an 
                interactive analytics workspace with smart visualizations, filters, and insights.
              </p>
            </div>
          </div>

          <form className="space-y-5 bg-white p-5 sm:p-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-800" htmlFor="csv-file">
                Choose a CSV file
              </label>
              <input
                accept=".csv,text/csv"
                className="mt-2 block w-full cursor-pointer rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-800 file:mr-4 file:border-0 file:bg-teal-700 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                id="csv-file"
                name="csv-file"
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] ?? null);
                  setError(null);
                }}
                ref={fileInputRef}
                type="file"
              />
            </div>

            {selectedFile ? (
              <p className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                Selected file: <span className="font-medium">{selectedFile.name}</span>
              </p>
            ) : null}

            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isUploading || !selectedFile}
              type="submit"
            >
              {isUploading ? "Uploading..." : "Upload CSV"}
            </button>
          </form>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm" role="alert">
            {error}
          </div>
        ) : null}
      </section>
    );
  }

  // Render analytics workspace
  return (
    <section className="w-full space-y-6">
      <CompactUploadBar uploadResult={uploadResult} onChangeFile={handleChangeFile} />

      {/* Navigation */}
      <nav className="sticky top-12 z-30 border-b border-slate-200 bg-white shadow-sm" aria-label="Section navigation">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-0 px-4 sm:px-6 lg:px-8">
          {SECTION_NAV.map((section) => (
            <a
              className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-600 hover:border-teal-500 hover:text-teal-700"
              href={`#${section.id}`}
              key={section.id}
            >
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Overview Section */}
      <div id="overview" className="pt-4">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-lg sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
                Overview
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                {intelligence?.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {intelligence?.description}
              </p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {intelligence?.kpis.slice(0, 4).map((kpi) => (
                <KPICard key={kpi.label} {...kpi} />
              ))}
            </div>

            {/* Data Quality Card */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-950">What We Found</h3>
              <ul className="mt-3 space-y-2">
                {intelligence?.dataQualityNotes.map((note) => (
                  <li className="flex gap-2 text-sm text-slate-700" key={note}>
                    <span className="text-teal-600">✓</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Trends Section */}
      <div id="trends" className="pt-4">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
              Visualization
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Trends</h2>
            <p className="mt-2 text-sm text-slate-600">
              Time-based and performance trends across your dataset.
            </p>
          </div>
          
          <GlobalFilters
            columns={uploadResult.profile.columns}
            filters={filters}
            onFilterChange={setFilters}
          />
          
          <Dashboard profile={uploadResult.profile} rowCount={uploadResult.row_count} filters={filters} sectionType="trends" />
        </section>
      </div>

      {/* Breakdown Section */}
      <div id="breakdown" className="pt-4">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
              Composition
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Breakdown</h2>
            <p className="mt-2 text-sm text-slate-600">
              Category distributions and segmentation analysis.
            </p>
          </div>
          
          <GlobalFilters
            columns={uploadResult.profile.columns}
            filters={filters}
            onFilterChange={setFilters}
          />
          
          <Dashboard profile={uploadResult.profile} rowCount={uploadResult.row_count} filters={filters} sectionType="breakdown" />
        </section>
      </div>

      {/* Data Profile Section */}
      <div id="profile" className="pt-4">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
              Schema
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Data Profile</h2>
            <p className="mt-2 text-sm text-slate-600">
              Complete column inventory with types, completeness, and statistics.
            </p>
          </div>
          
          <ProfileSummary columns={uploadResult.profile.columns} rowCount={uploadResult.row_count} />
        </section>
      </div>

      {/* Ask Data Section */}
      <div id="chat" className="pt-4">
        <section className="space-y-6">
          <ChatPanel datasetId={uploadResult.dataset_id} profile={uploadResult.profile} />
        </section>
      </div>

      {/* Summary Section */}
      <div id="summary" className="pt-4">
        <section className="space-y-6">
          <ExecutiveSummary
            datasetId={uploadResult.dataset_id}
            filename={uploadResult.filename}
            profile={uploadResult.profile}
          />
        </section>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm" role="alert">
          {error}
        </div>
      ) : null}
    </section>
  );
}

function KPICard({
  label,
  subtitle,
  tone = "slate",
  value,
}: {
  label: string;
  subtitle: string;
  tone?: "teal" | "blue" | "amber" | "rose" | "slate" | "indigo" | "cyan" | "purple";
  value: string;
}) {
  const bgGradients = {
    teal: "from-teal-600 to-cyan-600",
    blue: "from-blue-600 to-cyan-600",
    amber: "from-amber-600 to-orange-600",
    rose: "from-rose-600 to-red-600",
    slate: "from-slate-700 to-slate-600",
    indigo: "from-indigo-600 to-purple-600",
    cyan: "from-cyan-600 to-blue-600",
    purple: "from-purple-600 to-indigo-600",
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${bgGradients[tone]} p-5 text-white shadow-lg`}>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] opacity-80">{label}</p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xs opacity-70">{subtitle}</p>
    </div>
  );
}
