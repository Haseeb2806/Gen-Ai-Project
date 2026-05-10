import { useState } from "react";

import { SummaryResponse, generateExecutiveSummary } from "../api";

type ExecutiveSummaryProps = {
  datasetId: string;
};

export function ExecutiveSummary({ datasetId }: ExecutiveSummaryProps) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateExecutiveSummary(datasetId);
      setSummary(response);
    } catch (caughtError) {
      setSummary(null);
      setError(caughtError instanceof Error ? caughtError.message : "Summary request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
            Narrative insight
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Executive Summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            Generate a data-grounded summary from the saved dataset.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isLoading}
          onClick={handleGenerate}
          type="button"
        >
          {isLoading ? "Generating..." : "Generate Executive Summary"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {summary ? (
        <article className="mt-4 space-y-4 rounded-2xl border border-teal-200 bg-teal-50 p-5 shadow-sm">
          <p className="text-sm leading-6 text-slate-900">{summary.summary}</p>

          {summary.key_findings.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-teal-950">Key findings</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-900">
                {summary.key_findings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.data_quality_notes.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-teal-950">Data quality notes</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-900">
                {summary.data_quality_notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}
