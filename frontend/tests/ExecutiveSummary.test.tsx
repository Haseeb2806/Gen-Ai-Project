import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExecutiveSummary } from "../src/components/ExecutiveSummary";
import { UploadForm } from "../src/components/UploadForm";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ExecutiveSummary", () => {
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

    expect(
      await screen.findByRole("button", { name: /generate executive summary/i }),
    ).toBeInTheDocument();
  });

  it("shows loading state while generating", async () => {
    const user = userEvent.setup();
    let resolveSummary: (response: Response) => void = () => undefined;
    const summaryPromise = new Promise<Response>((resolve) => {
      resolveSummary = resolve;
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(() => summaryPromise);
    render(<ExecutiveSummary datasetId="dataset-123" />);

    await user.click(screen.getByRole("button", { name: /generate executive summary/i }));

    expect(screen.getByRole("button", { name: /generating/i })).toBeDisabled();

    await act(async () => {
      resolveSummary(createSummaryResponse());
    });
  });

  it("displays a successful summary response", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(createSummaryResponse());
    render(<ExecutiveSummary datasetId="dataset-123" />);

    await user.click(screen.getByRole("button", { name: /generate executive summary/i }));

    expect((await screen.findAllByText(/overall cancellation rate is 40%/i)).length).toBeGreaterThan(0);
    expect(screen.getByText("Key findings")).toBeInTheDocument();
    expect(screen.getByText("Data quality notes")).toBeInTheDocument();
  });

  it("displays an error when summary generation fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Dataset missing-id not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<ExecutiveSummary datasetId="missing-id" />);

    await user.click(screen.getByRole("button", { name: /generate executive summary/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Dataset missing-id not found");
  });

  it("sends dataset_id to the summary endpoint", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(createSummaryResponse());
    render(<ExecutiveSummary datasetId="dataset-123" />);

    await user.click(screen.getByRole("button", { name: /generate executive summary/i }));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/summary",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ dataset_id: "dataset-123" }),
      }),
    );
  });

  it("shows detected dataset summary structure when profile is provided", () => {
    render(<ExecutiveSummary datasetId="sales-123" filename="walmart.csv" profile={salesProfile} />);

    expect(screen.getByText(/detected Retail \/ Sales dataset/i)).toBeInTheDocument();
    expect(screen.getByText("Executive summary structure")).toBeInTheDocument();
    expect(screen.getByText("Sales volume and average sales")).toBeInTheDocument();
    expect(screen.getAllByText("Data quality notes").length).toBeGreaterThan(0);
  });
});

function createSummaryResponse() {
  return new Response(
    JSON.stringify({
      dataset_id: "dataset-123",
      summary: "Overall cancellation rate is 40%. Top source countries are PRT and GBR.",
      key_findings: ["Overall cancellation rate is 40%."],
      data_quality_notes: ["No missing values were detected in saved rows."],
      data: {},
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

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
        unique_value_count: 1,
        top_values: [{ value: "City Hotel", count: 1 }],
      },
      {
        name: "is_canceled",
        detected_type: "numeric",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 1,
        stats: { min: 1, max: 1, mean: 1, median: 1 },
      },
    ],
  },
};

const salesProfile = {
  row_count: 100,
  column_count: 3,
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
      name: "Weekly_Sales",
      detected_type: "numeric" as const,
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 100,
      stats: { min: 1000, max: 5000, mean: 2500, median: 2400 },
    },
    {
      name: "Date",
      detected_type: "datetime" as const,
      null_count: 0,
      null_percentage: 0,
      unique_value_count: 100,
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
