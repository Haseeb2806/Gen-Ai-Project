import { ColumnProfile } from "../lib/api";

interface ProfileSummaryProps {
  columns: ColumnProfile[];
  rowCount: number;
}

export function ProfileSummary({ columns, rowCount }: ProfileSummaryProps) {
  return (
    <div className="mt-6 space-y-6">
      {/* Column Statistics Table */}
      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Column</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Nulls</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Unique</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Stats</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((column, idx) => (
              <tr
                className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                key={column.name}
              >
                <td className="px-4 py-3 font-medium text-slate-900">{column.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                    {column.detected_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-700">
                  {column.null_count} ({column.null_percentage}%)
                </td>
                <td className="px-4 py-3 text-center text-slate-700">
                  {column.unique_value_count}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <ColumnStats column={column} rowCount={rowCount} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Column Information */}
      <div className="space-y-4">
        {columns.map((column) => (
          <ColumnDetail key={column.name} column={column} />
        ))}
      </div>
    </div>
  );
}

function ColumnStats({ column, rowCount }: { column: ColumnProfile; rowCount: number }) {
  if (column.detected_type === "numeric" && column.stats) {
    const { min, max, mean, median } = column.stats;
    return (
      <div className="text-xs text-slate-600">
        <div>Min: {min !== null ? formatNumber(min) : "—"}</div>
        <div>Max: {max !== null ? formatNumber(max) : "—"}</div>
        <div>Mean: {mean !== null ? formatNumber(mean) : "—"}</div>
        <div>Median: {median !== null ? formatNumber(median) : "—"}</div>
      </div>
    );
  }

  if (column.detected_type === "categorical" && column.top_values && column.top_values.length > 0) {
    return (
      <div className="text-xs text-slate-600">
        <div>Top: {column.top_values[0].value}</div>
        <div>({column.top_values[0].count} × {((column.top_values[0].count / rowCount) * 100).toFixed(1)}%)</div>
      </div>
    );
  }

  return <span className="text-slate-500">—</span>;
}

function ColumnDetail({ column }: { column: ColumnProfile }) {
  if (column.detected_type === "numeric" && column.stats) {
    return (
      <div className="rounded border border-slate-200 bg-slate-50 p-4">
        <h4 className="font-semibold text-slate-900">{column.name}</h4>
        <p className="text-xs text-slate-600">
          <span className="mr-2 inline-block rounded bg-blue-100 px-2 py-1 font-medium text-blue-700">
            numeric
          </span>
          {column.null_count > 0 && (
            <span className="mr-2 inline-block text-slate-700">
              {column.null_count} nulls ({column.null_percentage}%)
            </span>
          )}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <dt className="font-medium text-slate-700">Min</dt>
            <dd className="mt-1 text-slate-900">{column.stats.min !== null ? formatNumber(column.stats.min) : "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">Max</dt>
            <dd className="mt-1 text-slate-900">{column.stats.max !== null ? formatNumber(column.stats.max) : "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">Mean</dt>
            <dd className="mt-1 text-slate-900">{column.stats.mean !== null ? formatNumber(column.stats.mean) : "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">Median</dt>
            <dd className="mt-1 text-slate-900">
              {column.stats.median !== null ? formatNumber(column.stats.median) : "—"}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  if (column.detected_type === "categorical" && column.top_values && column.top_values.length > 0) {
    return (
      <div className="rounded border border-slate-200 bg-slate-50 p-4">
        <h4 className="font-semibold text-slate-900">{column.name}</h4>
        <p className="text-xs text-slate-600">
          <span className="mr-2 inline-block rounded bg-green-100 px-2 py-1 font-medium text-green-700">
            categorical
          </span>
          <span className="inline-block text-slate-700">
            {column.unique_value_count} unique values
          </span>
          {column.null_count > 0 && (
            <span className="ml-2 inline-block text-slate-700">
              ({column.null_count} nulls, {column.null_percentage}%)
            </span>
          )}
        </p>
        <div className="mt-3">
          <p className="mb-2 text-sm font-medium text-slate-700">Top values:</p>
          <ul className="space-y-1">
            {column.top_values.map((topValue) => (
              <li key={topValue.value} className="text-sm text-slate-700">
                <span className="font-mono">{topValue.value}</span>:{" "}
                <span className="text-slate-600">{topValue.count} occurrences</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // For text and datetime columns, show basic info
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4">
      <h4 className="font-semibold text-slate-900">{column.name}</h4>
      <p className="text-xs text-slate-600">
        <span className="mr-2 inline-block rounded bg-purple-100 px-2 py-1 font-medium text-purple-700">
          {column.detected_type}
        </span>
        <span className="inline-block text-slate-700">
          {column.unique_value_count} unique values
        </span>
        {column.null_count > 0 && (
          <span className="ml-2 inline-block text-slate-700">
            ({column.null_count} nulls, {column.null_percentage}%)
          </span>
        )}
      </p>
    </div>
  );
}

function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "—";
  if (typeof value !== "number") return String(value);
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}
