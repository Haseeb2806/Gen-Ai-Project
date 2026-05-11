import { useState } from "react";

import { Profile, SummaryResponse, generateExecutiveSummary } from "../api";
import { buildDatasetIntelligence } from "../utils/datasetIntelligence";

type ExecutiveSummaryProps = {
  datasetId: string;
  filename?: string;
  profile?: Profile;
};

export function ExecutiveSummary({ datasetId, filename, profile }: ExecutiveSummaryProps) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const intelligence = profile ? buildDatasetIntelligence(profile, filename) : null;

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

  function handleExport() {
    if (!summary) return;
    const content = `
${intelligence?.typeLabel || "Dataset"} Summary Report
Generated: ${new Date().toLocaleDateString()}

Dataset: ${filename || datasetId}

EXECUTIVE SUMMARY
${summary.summary}

KEY FINDINGS
${summary.key_findings.map((f) => `• ${f}`).join("\n")}

DATA QUALITY NOTES
${summary.data_quality_notes.map((n) => `• ${n}`).join("\n")}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DataLens-Summary-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
            Insights
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Executive Summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            {intelligence
              ? `Data-driven summary for your ${intelligence.typeLabel.toLowerCase()} dataset.`
              : "Generate a data-grounded summary from the saved dataset."}
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isLoading}
          onClick={handleGenerate}
          type="button"
        >
          {isLoading ? "Generating..." : "Generate Summary"}
        </button>
      </div>

      {intelligence ? (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-950">Expected Structure</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {intelligence.summaryStructure.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-950">Data Quality Notes</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {intelligence.dataQualityNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {summary ? (
        <article className="mt-4 space-y-5 rounded-2xl border border-gradient-to-r from-teal-200 to-blue-200 bg-gradient-to-br from-teal-50 to-blue-50 p-5 shadow-lg">
          {/* Main Summary */}
          <div className="border-b border-teal-200 pb-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-900">Summary</h3>
            <p className="mt-3 leading-relaxed text-slate-900">{summary.summary}</p>
          </div>

          {/* Key Findings */}
          {summary.key_findings.length > 0 ? (
            <div className="border-b border-teal-200 pb-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-900">Key Findings</h3>
              <div className="mt-3 space-y-2">
                {summary.key_findings.map((finding, idx) => (
                  <div className="flex gap-3" key={idx}>
                    <div className="mt-1 h-6 w-6 flex-shrink-0 rounded-full bg-teal-600 text-center text-xs font-bold text-white">
                      {idx + 1}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-900">{finding}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Data Quality Notes */}
          {summary.data_quality_notes.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-900">Data Quality Notes</h3>
              <ul className="mt-3 space-y-2">
                {summary.data_quality_notes.map((note, idx) => (
                  <li className="flex gap-2 text-sm text-slate-900" key={idx}>
                    <span className="mt-1 text-teal-600">✓</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Export Button */}
          <div className="flex gap-2 border-t border-teal-200 pt-4">
            <button
              className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              onClick={handleExport}
              type="button"
            >
              ↓ Download Summary
            </button>
          </div>
        </article>
      ) : null}
    </section>
  );
}
