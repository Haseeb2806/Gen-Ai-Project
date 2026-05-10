import { UploadForm } from "./components/UploadForm";

export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">DataLens</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            CSV Upload
          </h1>
        </header>
        <UploadForm />
      </div>
    </main>
  );
}
