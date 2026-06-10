import type { InterviewMode, InterviewStatus, QuestionSource, QuestionType } from "../enums";

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface JobProfile {
  userId: string;
  jobTitle: string;
  unitName: string;
  requirements: string;
  extraInfo: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  type: QuestionType;
  source: QuestionSource;
  region?: string;
  unitName?: string;
  examDate?: string;
  rules?: string;
}

export interface QuestionSet {
  id: string;
  title: string;
  source: QuestionSource;
  region?: string;
  unitName?: string;
  examDate?: string;
  rules?: string;
  questions: Question[];
}

export interface InterviewAnswer {
  id: string;
  questionId?: string;
  questionTitle: string;
  questionContentSnapshot: string;
  transcript: string;
  durationSeconds?: number;
  audioBlobId?: string;
  audioUrl?: string;
  audioMimeType?: string;
  audioSizeBytes?: number;
  sortOrder: number;
  aiReview?: AiReview;
}

export interface AiReview {
  score?: number;
  comment: string;
  thinking: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface AiReport {
  totalScore?: number;
  matchScore?: number;
  stabilityScore?: number;
  summary: string;
  details: Record<string, unknown>;
}

export interface Interview {
  id: string;
  userId: string;
  mode: InterviewMode;
  sourceType: "question_set" | "free_mock" | "custom" | "ai";
  totalSeconds: number;
  remainingSeconds: number;
  status: InterviewStatus;
  questions: Question[];
  answers: InterviewAnswer[];
  startedAt: string;
  endedAt?: string;
  report?: AiReport;
}
