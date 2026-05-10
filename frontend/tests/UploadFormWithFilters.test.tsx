import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UploadForm } from "../src/components/UploadForm";

describe("UploadForm with Filters Integration", () => {
  it("renders global filters section after successful upload", async () => {
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("CSV file");
    const uploadButton = screen.getByText("Upload CSV");

    // Create mock CSV file
    const mockFile = new File(
      ["hotel,country\nCity Hotel,PRT\nResort Hotel,GBR"],
      "test.csv",
      { type: "text/csv" }
    );

    // Mock fetch for upload
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        dataset_id: "test-id",
        filename: "test.csv",
        row_count: 2,
        column_count: 2,
        column_names: ["hotel", "country"],
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
              name: "country",
              detected_type: "categorical",
              null_count: 0,
              null_percentage: 0,
              unique_value_count: 2,
              top_values: [
                { value: "PRT", count: 1 },
                { value: "GBR", count: 1 },
              ],
            },
          ],
        },
      }),
    });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText("Global Filters")).toBeInTheDocument();
    });
  });

  it("displays filter options for categorical columns after upload", async () => {
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("CSV file");
    const uploadButton = screen.getByText("Upload CSV");

    const mockFile = new File(
      ["hotel,country\nCity Hotel,PRT"],
      "test.csv",
      { type: "text/csv" }
    );

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        dataset_id: "test-id",
        filename: "test.csv",
        row_count: 1,
        column_count: 2,
        column_names: ["hotel", "country"],
        profile: {
          row_count: 1,
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
              name: "country",
              detected_type: "categorical",
              null_count: 0,
              null_percentage: 0,
              unique_value_count: 1,
              top_values: [{ value: "PRT", count: 1 }],
            },
          ],
        },
      }),
    });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText("Global Filters")).toBeInTheDocument();
    });

    // Check that filter buttons exist
    const filterButtons = screen.getAllByRole("button");
    const hotelFilterButton = filterButtons.find((btn) => btn.textContent?.includes("hotel"));
    expect(hotelFilterButton).toBeInTheDocument();
  });

  it("clears filters when new file is selected", async () => {
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("CSV file");
    const uploadButton = screen.getByText("Upload CSV");

    const mockFile1 = new File(
      ["hotel,country\nCity Hotel,PRT"],
      "test1.csv",
      { type: "text/csv" }
    );

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        dataset_id: "test-id-1",
        filename: "test1.csv",
        row_count: 1,
        column_count: 2,
        column_names: ["hotel", "country"],
        profile: {
          row_count: 1,
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
              name: "country",
              detected_type: "categorical",
              null_count: 0,
              null_percentage: 0,
              unique_value_count: 1,
              top_values: [{ value: "PRT", count: 1 }],
            },
          ],
        },
      }),
    });

    fireEvent.change(fileInput, { target: { files: [mockFile1] } });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText("Global Filters")).toBeInTheDocument();
    });

    // Get first hotel filter button (the one in GlobalFilters)
    const filterButtons = screen.getAllByRole("button");
    const hotelFilterButton = filterButtons.find((btn) => btn.textContent?.includes("hotel"));
    
    if (hotelFilterButton) {
      fireEvent.click(hotelFilterButton);
      const checkbox = screen.getByRole("checkbox", { name: /City Hotel/i });
      fireEvent.click(checkbox);

      // Verify filter was applied (button shows count)
      await waitFor(() => {
        expect(screen.getByText(/hotel \(1\)/)).toBeInTheDocument();
      });
    }

    // Select a new file - this should reset filters
    const mockFile2 = new File(
      ["different,data\nvalue1,value2"],
      "test2.csv",
      { type: "text/csv" }
    );

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        dataset_id: "test-id-2",
        filename: "test2.csv",
        row_count: 1,
        column_count: 2,
        column_names: ["different", "data"],
        profile: {
          row_count: 1,
          column_count: 2,
          columns: [
            {
              name: "different",
              detected_type: "categorical",
              null_count: 0,
              null_percentage: 0,
              unique_value_count: 1,
              top_values: [{ value: "value1", count: 1 }],
            },
            {
              name: "data",
              detected_type: "categorical",
              null_count: 0,
              null_percentage: 0,
              unique_value_count: 1,
              top_values: [{ value: "value2", count: 1 }],
            },
          ],
        },
      }),
    });

    fireEvent.change(fileInput, { target: { files: [mockFile2] } });

    // Verify filter count badge disappears (filters cleared)
    await waitFor(() => {
      expect(screen.queryByText(/hotel \(1\)/)).not.toBeInTheDocument();
    });
  });

  it("shows filter applied indicator in dashboard when filters are active", async () => {
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("CSV file");
    const uploadButton = screen.getByText("Upload CSV");

    const mockFile = new File(
      ["hotel,country\nCity Hotel,PRT"],
      "test.csv",
      { type: "text/csv" }
    );

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        dataset_id: "test-id",
        filename: "test.csv",
        row_count: 1,
        column_count: 2,
        column_names: ["hotel", "country"],
        profile: {
          row_count: 1,
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
              name: "country",
              detected_type: "categorical",
              null_count: 0,
              null_percentage: 0,
              unique_value_count: 1,
              top_values: [{ value: "PRT", count: 1 }],
            },
          ],
        },
      }),
    });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText("Global Filters")).toBeInTheDocument();
    });

    // Get all buttons and find the hotel filter button (not the dashboard charts button)
    const filterButtons = screen.getAllByRole("button");
    const hotelFilterButton = filterButtons.find((btn) => btn.textContent?.match(/^hotel\s*▼$/));
    
    if (hotelFilterButton) {
      fireEvent.click(hotelFilterButton);
      const checkbox = screen.getByRole("checkbox", { name: /City Hotel/i });
      fireEvent.click(checkbox);
    }

    // Check that dashboard shows filter applied message
    await waitFor(() => {
      expect(screen.getByText("Filters applied - dashboard is showing filtered data")).toBeInTheDocument();
    });
  });
});
