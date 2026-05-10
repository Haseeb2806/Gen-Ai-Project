import { FormEvent, useState } from "react";

import { Profile, sendChatQuestion } from "../api";
import { buildDatasetIntelligence } from "../utils/datasetIntelligence";

const SUGGESTED_QUESTIONS = [
  "What is the overall cancellation rate and how does it differ between City Hotel and Resort Hotel?",
  "Which countries are the top 10 source markets?",
  "How does lead time correlate with cancellation probability?",
  "What is the average daily rate by month?",
  "Which market segments have the highest repeat guest rates?",
];

type ChatPanelProps = {
  datasetId: string;
  profile?: Profile;
};

export function ChatPanel({ datasetId, profile }: ChatPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const intelligence = profile ? buildDatasetIntelligence(profile) : null;
  const suggestedQuestions = intelligence?.suggestedQuestions ?? SUGGESTED_QUESTIONS;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Type a question before sending.");
      return;
    }

    setIsSending(true);
    setAnswer(null);
    setError(null);

    try {
      const response = await sendChatQuestion(datasetId, trimmedQuestion);
      setAnswer(response.answer);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Chat request failed.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
          Conversational analytics
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">Ask a question</h2>
        <p className="mt-1 text-sm text-slate-600">
          Dataset ID: <span className="font-medium text-slate-800">{datasetId}</span>
        </p>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-slate-800">
          Suggested {intelligence?.typeLabel ?? "Hotel Booking"} questions
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestedQuestions.map((suggestedQuestion) => (
            <button
              className="rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-left text-sm text-slate-800 shadow-sm hover:border-teal-600 hover:bg-teal-50"
              key={suggestedQuestion}
              onClick={() => {
                setQuestion(suggestedQuestion);
                setError(null);
              }}
              type="button"
            >
              {suggestedQuestion}
            </button>
          ))}
        </div>
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-800" htmlFor="chat-question">
          Question
        </label>
        <textarea
          className="min-h-24 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
          id="chat-question"
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={intelligence ? `Ask about ${intelligence.typeLabel.toLowerCase()} metrics, segments, quality, or trends.` : "Ask about cancellations, source markets, lead time, ADR, or repeat guests."}
          value={question}
        />
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isSending}
          type="submit"
        >
          {isSending ? "Sending..." : "Send question"}
        </button>
      </form>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {answer ? (
        <article className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-teal-950">Answer</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-900">{answer}</p>
        </article>
      ) : null}
    </section>
  );
}
