import { UploadForm } from "./components/UploadForm";

export default function App() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-950">
      <div className="mx-auto w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700">DataLens</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-slate-950">
            Analytics Workspace
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Upload any CSV file and DataLens automatically creates a modern analytics workspace with 
            interactive visuals, smart filters, natural language chat, and executive insights.
          </p>
        </header>
        <UploadForm />
      </div>
    </main>
  );
}
