import { apiClient } from "./apiClient";

export async function uploadAudioBlob(input: {
  blob: Blob;
  fileName: string;
  mimeType?: string;
  durationSeconds?: number;
}) {
  const formData = new FormData();
  formData.append("file", input.blob, input.fileName);
  if (input.durationSeconds !== undefined) {
    formData.append("durationSeconds", String(input.durationSeconds));
  }

  return apiClient<{
    id?: string;
    fileUrl: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds?: number;
  }>("/uploads/audio", {
    method: "POST",
    body: formData
  });
}
