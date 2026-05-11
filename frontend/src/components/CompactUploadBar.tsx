import { UploadResponse } from "../api";
import { formatColumnLabel } from "../utils/columnLabels";

interface CompactUploadBarProps {
  uploadResult: UploadResponse;
  onChangeFile: () => void;
}

export function CompactUploadBar({ uploadResult, onChangeFile }: CompactUploadBarProps) {
  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-700">
              Active dataset
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {uploadResult.filename}
            </p>
          </div>
          <div className="hidden gap-4 border-l border-slate-200 pl-4 sm:flex">
            <div className="text-center">
              <p className="text-xs text-slate-500">Rows</p>
              <p className="text-sm font-semibold text-slate-900">
                {uploadResult.row_count.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Columns</p>
              <p className="text-sm font-semibold text-slate-900">
                {uploadResult.column_count}
              </p>
            </div>
          </div>
        </div>
        <button
          className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-100"
          onClick={onChangeFile}
          type="button"
        >
          Change file
        </button>
      </div>
    </div>
  );
}
