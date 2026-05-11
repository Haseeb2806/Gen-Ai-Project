import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UploadForm } from "../src/components/UploadForm";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UploadForm", () => {
  it("renders upload screen initially", () => {
    render(<UploadForm />);

    expect(screen.getByLabelText(/choose a csv file/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload csv/i })).toBeInTheDocument();
  });

  it("shows the selected file name", async () => {
    const user = userEvent.setup();
    render(<UploadForm />);

    const file = new File(["hotel,is_canceled\nCity Hotel,1\n"], "bookings.csv", {
      type: "text/csv",
    });

    await user.upload(screen.getByLabelText(/choose a csv file/i), file);

    expect(screen.getByText(/selected file:/i)).toHaveTextContent("bookings.csv");
  });

  it("displays analytics workspace with section navigation after upload", async () => {
    const user = userEvent.setup();
    let resolveUpload: (response: Response) => void = () => undefined;
    const uploadPromise = new Promise<Response>((resolve) => {
      resolveUpload = resolve;
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(() => uploadPromise);
    render(<UploadForm />);

    const file = new File(["hotel,is_canceled\nCity Hotel,1\n"], "bookings.csv", {
      type: "text/csv",
    });
    await user.upload(screen.getByLabelText(/choose a csv file/i), file);
    await user.click(screen.getByRole("button", { name: /upload csv/i }));

    expect(screen.getByRole("button", { name: /uploading/i })).toBeDisabled();

    await act(async () => {
      resolveUpload(
        new Response(
          JSON.stringify({
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
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });

    // Check for navigation buttons with exact labels
    expect(screen.getByRole("link", { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Trends/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Breakdown/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Data Profile/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ask Data/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Summary/i })).toBeInTheDocument();

    // Check for compact upload bar
    expect(screen.getByText("Active dataset")).toBeInTheDocument();
    expect(screen.getByText("bookings.csv")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change file/i })).toBeInTheDocument();

    // Verify profile summary is displayed
    expect(screen.getAllByText("Hotel Type").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cancellation Status").length).toBeGreaterThan(0);
  });

  it("displays human-readable column names", async () => {
    const user = userEvent.setup();
    let resolveUpload: (response: Response) => void = () => undefined;
    const uploadPromise = new Promise<Response>((resolve) => {
      resolveUpload = resolve;
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(() => uploadPromise);
    render(<UploadForm />);

    const file = new File(
      ["weekly_sales,store,holiday_flag\n1000,1,0\n"],
      "walmart.csv",
      {
        type: "text/csv",
      },
    );
    await user.upload(screen.getByLabelText(/choose a csv file/i), file);
    await user.click(screen.getByRole("button", { name: /upload csv/i }));

    await act(async () => {
      resolveUpload(
        new Response(
          JSON.stringify({
            dataset_id: "dataset-456",
            filename: "walmart.csv",
            row_count: 1,
            column_count: 3,
            column_names: ["weekly_sales", "store", "holiday_flag"],
            profile: {
              row_count: 1,
              column_count: 3,
              columns: [
                {
                  name: "weekly_sales",
                  detected_type: "numeric",
                  null_count: 0,
                  null_percentage: 0,
                  unique_value_count: 1,
                  stats: { min: 1000, max: 1000, mean: 1000, median: 1000 },
                },
                {
                  name: "store",
                  detected_type: "numeric",
                  null_count: 0,
                  null_percentage: 0,
                  unique_value_count: 1,
                  stats: { min: 1, max: 1, mean: 1, median: 1 },
                },
                {
                  name: "holiday_flag",
                  detected_type: "numeric",
                  null_count: 0,
                  null_percentage: 0,
                  unique_value_count: 2,
                  stats: { min: 0, max: 1, mean: 0.5, median: 0.5 },
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });

    // Check that the navigation appears indicating workspace is loaded
    expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
    // Check human-readable labels are used (not raw names)
    expect(screen.getAllByText("Weekly Sales").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Holiday Week").length).toBeGreaterThan(0);
  });

  it("moves a new user into an adaptive analytics workspace after upload", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(salesUploadResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<UploadForm />);

    const file = new File(["Store,Date,Weekly_Sales\n1,2020-01-01,1000\n"], "walmart.csv", {
      type: "text/csv",
    });
    await user.upload(screen.getByLabelText(/choose a csv file/i), file);
    await user.click(screen.getByRole("button", { name: /upload csv/i }));

    expect(await screen.findByRole("link", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trends" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Breakdown" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ask Data" })).toBeInTheDocument();
    expect(screen.getAllByText("Weekly Sales").length).toBeGreaterThan(0);
  });

  it("displays an error message after a failed upload", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Only CSV files are accepted." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<UploadForm />);

    // Upload a proper CSV file (browser accepts .csv files)
    const file = new File(["hotel,is_canceled\nCity Hotel,1\n"], "bookings.csv", {
      type: "text/csv",
    });
    await user.upload(screen.getByLabelText(/choose a csv file/i), file);
    expect(screen.getByText(/selected file:/i)).toHaveTextContent("bookings.csv");

    // Click upload, which will call the mocked fetch that returns an error
    await user.click(screen.getByRole("button", { name: /upload csv/i }));

    // Wait for the error alert to display the backend error message
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Only CSV files are accepted.");
    });
  });
});

const salesUploadResponse = {
  dataset_id: "sales-123",
  filename: "walmart.csv",
  row_count: 100,
  column_count: 4,
  column_names: ["Store", "Date", "Weekly_Sales", "Holiday_Flag"],
  profile: {
    row_count: 100,
    column_count: 4,
    columns: [
      {
        name: "Store",
        detected_type: "categorical",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 3,
        top_values: [{ value: "1", count: 40 }],
      },
      {
        name: "Date",
        detected_type: "datetime",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 100,
      },
      {
        name: "Weekly_Sales",
        detected_type: "numeric",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 100,
        stats: { min: 1000, max: 5000, mean: 2500, median: 2400 },
      },
      {
        name: "Holiday_Flag",
        detected_type: "numeric",
        null_count: 0,
        null_percentage: 0,
        unique_value_count: 2,
        stats: { min: 0, max: 1, mean: 0.1, median: 0 },
      },
    ],
  },
};
