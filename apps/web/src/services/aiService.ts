import type { AiReport, AiReview, JobProfile } from "@humian/shared";
import { apiClient } from "./apiClient";

export async function generateJobQuestions(profile: Partial<JobProfile>) {
  return apiClient<{ questions: Array<{ content: string; type?: string }> }>("/ai/generate-questions", {
    method: "POST",
    body: JSON.stringify({
      jobTitle: profile.jobTitle,
      unitName: profile.unitName,
      requirements: profile.requirements,
      extraInfo: profile.extraInfo
    })
  });
}

export async function reviewAnswer(input: {
  interviewAnswerId?: string;
  question: string;
  transcript?: string;
  questionType?: string;
  jobProfile?: Partial<JobProfile>;
}) {
  return apiClient<AiReview>("/ai/review-answer", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function generateInterviewReport(input: {
  interviewId?: string;
  answers: Array<{ question: string; transcript?: string; aiReview?: AiReview }>;
  jobProfile?: Partial<JobProfile>;
}) {
  return apiClient<AiReport>("/ai/generate-report", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function transcribeAudio(input: {
  fileUrl?: string;
  audioData?: string;
  mimeType?: string;
  durationSeconds?: number;
}) {
  return apiClient<{
    transcript: string;
    status: "completed" | "unavailable" | "failed";
    message?: string;
  }>("/ai/transcribe-audio", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
