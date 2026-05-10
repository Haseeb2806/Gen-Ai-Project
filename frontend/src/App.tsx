import { UploadForm } from "./components/UploadForm";

export default function App() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700">DataLens</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-slate-950">
            CSV Upload
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            A business analytics workspace for fast profiling, filtering, summaries, and data-grounded questions.
          </p>
        </header>
        <UploadForm />
      </div>
    </main>
  );
}
