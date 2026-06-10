export type InterviewMode = "listen" | "read";

export type InterviewStatus =
  | "preparing"
  | "reading"
  | "answering"
  | "paused"
  | "finished"
  | "canceled";

export type QuestionType =
  | "comprehensive"
  | "interpersonal"
  | "emergency"
  | "organization"
  | "jobMatching"
  | "professional";

export type QuestionSource = "real" | "manual" | "ai";
