import { FormEvent, useState } from "react";

import { UploadResponse, uploadCsv } from "../api";
import { formatColumnLabel } from "../utils/columnLabels";
import { buildDatasetIntelligence } from "../utils/datasetIntelligence";
import { ChatPanel } from "./ChatPanel";
import { Dashboard } from "./Dashboard";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { FilterState, GlobalFilters } from "./GlobalFilters";
import { ProfileSummary } from "./ProfileSummary";

export function UploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const intelligence = uploadResult ? buildDatasetIntelligence(uploadResult.profile, uploadResult.filename) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setError("Select a CSV file before uploading.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

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

  return (
    <section className="w-full space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-xl">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">
                DataLens command center
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                Upload, profile, and explore a CSV
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                Start with any CSV. DataLens detects the dataset shape and builds the analytics
                workspace, filters, chat prompts, and summary structure automatically.
              </p>
            </div>
            {uploadResult ? (
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-teal-100">Active dataset</p>
                <p className="mt-1 max-w-xs truncate text-lg font-semibold">{uploadResult.filename}</p>
              </div>
            ) : null}
          </div>
        </div>

        <form className="space-y-5 bg-white p-5 sm:p-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-800" htmlFor="csv-file">
              CSV file
            </label>
            <input
              accept=".csv,text/csv"
              className="mt-2 block w-full cursor-pointer rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-800 file:mr-4 file:border-0 file:bg-teal-700 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              id="csv-file"
              name="csv-file"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                setError(null);
                setUploadResult(null);
                setFilters({});
              }}
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
            disabled={isUploading}
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

      {uploadResult ? (
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg" id="overview">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
                  Analytics Workspace
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                  {intelligence?.title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {intelligence?.description}
                </p>
              </div>
              <span className="w-fit rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800">
                Detected: {intelligence?.typeLabel}
              </span>
            </div>
            <nav className="mt-5 flex flex-wrap gap-2" aria-label="Analytics workspace sections">
              {["Overview", "Insights", "Dashboard", "Profile", "Chat", "Executive Summary"].map((item) => (
                <a
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800"
                  href={`#${sectionId(item)}`}
                  key={item}
                >
                  {item}
                </a>
              ))}
            </nav>
          </section>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                  Dataset summary
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Dataset summary</h2>
              </div>
              <span className="w-fit rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                {uploadResult.column_count.toLocaleString()} fields
              </span>
            </div>
            <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <SummaryItem label="Dataset ID" value={uploadResult.dataset_id} />
              <SummaryItem label="Filename" value={uploadResult.filename} />
              <SummaryItem label="Rows" value={uploadResult.row_count.toLocaleString()} />
              <SummaryItem label="Columns" value={uploadResult.column_count.toLocaleString()} />
            </dl>
            <div className="mt-5">
              <p className="text-sm font-medium text-slate-700">Detected fields</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {uploadResult.column_names.slice(0, 12).map((columnName) => (
                  <span
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    key={columnName}
                  >
                    {formatColumnLabel(columnName)}
                  </span>
                ))}
                {uploadResult.column_names.length > 12 ? (
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                    +{uploadResult.column_names.length - 12} more
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <GlobalFilters
            columns={uploadResult.profile.columns}
            filters={filters}
            onFilterChange={setFilters}
          />
          <section id="insights">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                Analyst brief
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Auto-Generated Insights</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                {intelligence?.insights.slice(0, 3).map((insight) => (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={insight.label}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {insight.label}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">{insight.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{insight.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section id="dashboard">
            <Dashboard profile={uploadResult.profile} rowCount={uploadResult.row_count} filters={filters} />
          </section>
          <section id="profile">
            <ProfileSummary columns={uploadResult.profile.columns} rowCount={uploadResult.row_count} />
          </section>
          <section id="chat">
            <ChatPanel datasetId={uploadResult.dataset_id} profile={uploadResult.profile} />
          </section>
          <section id="executive-summary">
            <ExecutiveSummary
              datasetId={uploadResult.dataset_id}
              filename={uploadResult.filename}
              profile={uploadResult.profile}
            />
          </section>
        </div>
      ) : null}
    </section>
  );
}

function sectionId(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "-");
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <dt className="font-medium text-slate-600">{label}</dt>
      <dd className="mt-1 break-words text-lg font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
