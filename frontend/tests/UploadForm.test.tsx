import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UploadForm } from "../src/components/UploadForm";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UploadForm", () => {
  it("renders the upload component", () => {
    render(<UploadForm />);

    expect(screen.getByLabelText(/csv file/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload csv/i })).toBeInTheDocument();
  });

  it("shows the selected file name", async () => {
    const user = userEvent.setup();
    render(<UploadForm />);

    const file = new File(["hotel,is_canceled\nCity Hotel,1\n"], "bookings.csv", {
      type: "text/csv",
    });

    await user.upload(screen.getByLabelText(/csv file/i), file);

    expect(screen.getByText(/selected file:/i)).toHaveTextContent("bookings.csv");
  });

  it("displays summary after a successful upload", async () => {
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
    await user.upload(screen.getByLabelText(/csv file/i), file);
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

    expect(await screen.findByText("dataset-123")).toBeInTheDocument();
    expect(screen.getAllByText("bookings.csv").length).toBeGreaterThan(0);
    expect(screen.getByText("Rows")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    // Column names may appear multiple times (in table + detail cards)
    expect(screen.getAllByText("hotel").length).toBeGreaterThan(0);
    expect(screen.getAllByText("is_canceled").length).toBeGreaterThan(0);
    // Verify profile summary is displayed (categorical and numeric may appear in multiple elements)
    expect(screen.getAllByText("categorical").length).toBeGreaterThan(0);
    expect(screen.getAllByText("numeric").length).toBeGreaterThan(0);
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
    await user.upload(screen.getByLabelText(/csv file/i), file);
    expect(screen.getByText(/selected file:/i)).toHaveTextContent("bookings.csv");

    // Click upload, which will call the mocked fetch that returns an error
    await user.click(screen.getByRole("button", { name: /upload csv/i }));

    // Wait for the error alert to display the backend error message
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Only CSV files are accepted.");
    });
  });
});
