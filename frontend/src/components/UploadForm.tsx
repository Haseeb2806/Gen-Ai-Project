import { FormEvent, useState } from "react";

import { UploadResponse, uploadCsv } from "../api";
import { ProfileSummary } from "./ProfileSummary";
import { Dashboard } from "./Dashboard";
import { GlobalFilters, FilterState } from "./GlobalFilters";
import { ChatPanel } from "./ChatPanel";

export function UploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});

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
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="w-full max-w-3xl rounded border border-slate-200 bg-white p-5 shadow-sm">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-800" htmlFor="csv-file">
            CSV file
          </label>
          <input
            accept=".csv,text/csv"
            className="mt-2 block w-full cursor-pointer rounded border border-slate-300 bg-white text-sm text-slate-800 file:mr-4 file:border-0 file:bg-teal-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-teal-800"
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
          <p className="text-sm text-slate-700">
            Selected file: <span className="font-medium">{selectedFile.name}</span>
          </p>
        ) : null}

        <button
          className="inline-flex min-h-10 items-center justify-center rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isUploading}
          type="submit"
        >
          {isUploading ? "Uploading..." : "Upload CSV"}
        </button>
      </form>

      {error ? (
        <div className="mt-5 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {uploadResult ? (
        <div className="mt-6 space-y-4">
          <div className="rounded border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-semibold text-slate-950">Dataset summary</h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <SummaryItem label="Dataset ID" value={uploadResult.dataset_id} />
              <SummaryItem label="Filename" value={uploadResult.filename} />
              <SummaryItem label="Rows" value={uploadResult.row_count.toLocaleString()} />
              <SummaryItem label="Columns" value={uploadResult.column_count.toLocaleString()} />
            </dl>
          </div>
          <GlobalFilters
            columns={uploadResult.profile.columns}
            filters={filters}
            onFilterChange={setFilters}
          />
          <ProfileSummary columns={uploadResult.profile.columns} rowCount={uploadResult.row_count} />
          <Dashboard profile={uploadResult.profile} rowCount={uploadResult.row_count} filters={filters} />
          <ChatPanel datasetId={uploadResult.dataset_id} />
        </div>
      ) : null}
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-slate-600">{label}</dt>
      <dd className="mt-1 break-words text-slate-950">{value}</dd>
    </div>
  );
}
