import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatPanel } from "../src/components/ChatPanel";
import { UploadForm } from "../src/components/UploadForm";

const uploadResponse = {
  dataset_id: "dataset-123",
  filename: "bookings.csv",
  row_count: 2,
  column_count: 2,
  column_names: ["hotel", "is_canceled"],
  profile: {
    row_count: 2,
    column_count: 2,
    columns: [
      {
        name: "hotel",
        detected_type: "categorical",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 2,
        top_values: [
          { value: "City Hotel", count: 1 },
          { value: "Resort Hotel", count: 1 },
        ],
      },
      {
        name: "is_canceled",
        detected_type: "numeric",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 2,
        stats: { min: 0, max: 1, mean: 0.5, median: 0.5 },
      },
    ],
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ChatPanel", () => {
  it("renders after upload succeeds", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(uploadResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<UploadForm />);

    await uploadCsv(user);

    expect(await screen.findByRole("heading", { name: /ask a question/i })).toBeInTheDocument();
    expect(screen.getAllByText(/dataset-123/i).length).toBeGreaterThan(0);
  });

  it("shows suggested questions", () => {
    render(<ChatPanel datasetId="dataset-123" />);

    expect(
      screen.getByRole("button", {
        name: /overall cancellation rate/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /top 10 source markets/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lead time correlate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /average daily rate by month/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /repeat guest rates/i })).toBeInTheDocument();
  });

  it("shows adaptive suggested questions for sales datasets", () => {
    render(<ChatPanel datasetId="dataset-123" profile={salesProfile} />);

    expect(screen.getByText("Suggested Retail / Sales questions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /total weekly sales/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /holiday and non-holiday sales/i })).toBeInTheDocument();
  });

  it("lets the user type and submit a question", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          dataset_id: "dataset-123",
          question: "What is the cancellation rate?",
          answer: "The overall cancellation rate is 37%.",
          data: {},
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<ChatPanel datasetId="dataset-123" />);

    await user.type(screen.getByLabelText(/question/i), "What is the cancellation rate?");
    await user.click(screen.getByRole("button", { name: /send question/i }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/chat",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            dataset_id: "dataset-123",
            question: "What is the cancellation rate?",
          }),
        }),
      );
    });
  });

  it("displays a successful chat response answer", async () => {
    const user = userEvent.setup();
    let resolveChat: (response: Response) => void = () => undefined;
    const chatPromise = new Promise<Response>((resolve) => {
      resolveChat = resolve;
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(() => chatPromise);
    render(<ChatPanel datasetId="dataset-123" />);

    await user.type(screen.getByLabelText(/question/i), "Which countries are the top markets?");
    await user.click(screen.getByRole("button", { name: /send question/i }));

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    await act(async () => {
      resolveChat(
        new Response(
          JSON.stringify({
            dataset_id: "dataset-123",
            question: "Which countries are the top markets?",
            answer: "Portugal, Great Britain, and France are the top source markets.",
            data: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });

    expect(
      await screen.findByText("Portugal, Great Britain, and France are the top source markets."),
    ).toBeInTheDocument();
  });

  it("displays an error after a failed chat request", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Could not answer this question" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<ChatPanel datasetId="dataset-123" />);

    await user.type(screen.getByLabelText(/question/i), "Tell me something unclear.");
    await user.click(screen.getByRole("button", { name: /send question/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not answer this question");
  });
});

const salesProfile = {
  row_count: 100,
  column_count: 4,
  columns: [
    {
      name: "Store",
      detected_type: "categorical" as const,
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 3,
      top_values: [{ value: "1", count: 40 }],
    },
    {
      name: "Date",
      detected_type: "datetime" as const,
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 100,
    },
    {
      name: "Weekly_Sales",
      detected_type: "numeric" as const,
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 100,
      stats: { min: 1000, max: 5000, mean: 2500, median: 2400 },
    },
    {
      name: "Holiday_Flag",
      detected_type: "numeric" as const,
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 2,
      stats: { min: 0, max: 1, mean: 0.1, median: 0 },
    },
  ],
};

async function uploadCsv(user: ReturnType<typeof userEvent.setup>) {
  const file = new File(["hotel,is_canceled\nCity Hotel,1\n"], "bookings.csv", {
    type: "text/csv",
  });

  await user.upload(screen.getByLabelText(/csv file/i), file);
  await user.click(screen.getByRole("button", { name: /upload csv/i }));
}
