export type ColumnProfile = {
  name: string;
  detected_type: "numeric" | "datetime" | "categorical" | "text";
  null_count: number;
  null_percentage: number;
  unique_value_count: number;
  stats?: {
    min: number | null;
    max: number | null;
    mean: number | null;
    median: number | null;
  };
  top_values?: Array<{
    value: string;
    count: number;
  }>;
};

export type Profile = {
  row_count: number;
  column_count: number;
  columns: ColumnProfile[];
};

export type UploadResponse = {
  dataset_id: string;
  filename: string;
  row_count: number;
  column_count: number;
  column_names: string[];
  profile: Profile;
};

export type ChatResponse = {
  dataset_id: string;
  question: string;
  answer: string;
  data?: Record<string, unknown>;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function uploadCsv(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = body?.detail;
    throw new Error(typeof detail === "string" ? detail : "Upload failed. Please try again.");
  }

  return body as UploadResponse;
}

export async function sendChatQuestion(datasetId: string, question: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dataset_id: datasetId,
      question,
    }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = body?.detail;
    throw new Error(typeof detail === "string" ? detail : "Chat request failed. Please try again.");
  }

  return body as ChatResponse;
}
