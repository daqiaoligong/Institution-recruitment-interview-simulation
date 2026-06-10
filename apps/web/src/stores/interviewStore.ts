import type { Interview, InterviewAnswer, InterviewMode, Question } from "@humian/shared";
import { DEFAULT_ANSWER_SECONDS } from "@humian/shared";
import { create } from "zustand";
import { reviewAnswers, createMockReport } from "../services/mockAiService";

type AnswerDraft = {
  transcript?: string;
  durationSeconds?: number;
  audioBlobId?: string;
  audioMimeType?: string;
  audioSizeBytes?: number;
};

interface InterviewState {
  current?: Interview;
  isQuestionVisible: boolean;
  startInterview: (params: {
    userId: string;
    mode: InterviewMode;
    questions: Question[];
    secondsPerQuestion?: number;
    sourceType: Interview["sourceType"];
  }) => Interview;
  tick: () => void;
  setStatus: (status: Interview["status"]) => void;
  toggleQuestionVisible: () => void;
  saveCurrentAnswer: (answer?: AnswerDraft) => void;
  nextQuestion: () => void;
  finishInterview: () => Interview | undefined;
  resetInterview: () => void;
}

function createAnswer(question: Question, index: number, answer: AnswerDraft = {}): InterviewAnswer {
  return {
    id: `answer-${Date.now()}-${index}`,
    questionId: question.id,
    questionTitle: question.title,
    questionContentSnapshot: question.content,
    transcript: answer.transcript ?? "",
    durationSeconds: answer.durationSeconds,
    audioBlobId: answer.audioBlobId,
    audioMimeType: answer.audioMimeType,
    audioSizeBytes: answer.audioSizeBytes,
    sortOrder: index + 1
  };
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  current: undefined,
  isQuestionVisible: true,
  startInterview: ({ userId, mode, questions, secondsPerQuestion = DEFAULT_ANSWER_SECONDS, sourceType }) => {
    const session: Interview = {
      id: `session-${Date.now()}`,
      userId,
      mode,
      sourceType,
      totalSeconds: questions.length * secondsPerQuestion,
      remainingSeconds: questions.length * secondsPerQuestion,
      status: mode === "listen" ? "reading" : "answering",
      questions,
      answers: [],
      startedAt: new Date().toISOString()
    };
    set({ current: session, isQuestionVisible: mode === "read" });
    return session;
  },
  tick: () =>
    set((state) => {
      if (!state.current || state.current.status === "finished" || state.current.status === "paused") return state;
      const remainingSeconds = Math.max(0, state.current.remainingSeconds - 1);
      return {
        current: {
          ...state.current,
          remainingSeconds
        }
      };
    }),
  setStatus: (status) =>
    set((state) => (state.current ? { current: { ...state.current, status } } : state)),
  toggleQuestionVisible: () => set((state) => ({ isQuestionVisible: !state.isQuestionVisible })),
  saveCurrentAnswer: (answer = {}) =>
    set((state) => {
      if (!state.current) return state;
      const index = state.current.answers.length;
      const question = state.current.questions[index];
      if (!question || state.current.answers[index]) return state;
      return {
        current: {
          ...state.current,
          answers: [...state.current.answers, createAnswer(question, index, answer)]
        }
      };
    }),
  nextQuestion: () =>
    set((state) => {
      if (!state.current) return state;
      const nextIndex = state.current.answers.length;
      const isDone = nextIndex >= state.current.questions.length;
      return {
        current: {
          ...state.current,
          status: isDone ? "finished" : state.current.mode === "listen" ? "reading" : "answering"
        },
        isQuestionVisible: state.current.mode === "read" ? state.isQuestionVisible : false
      };
    }),
  finishInterview: () => {
    const current = get().current;
    if (!current) return undefined;
    const answers = reviewAnswers(current.answers);
    const finished = {
      ...current,
      status: "finished" as const,
      answers,
      endedAt: new Date().toISOString(),
      report: createMockReport(answers)
    };
    set({ current: finished });
    return finished;
  },
  resetInterview: () =>
    set((state) =>
      state.current
        ? {
            current: {
              ...state.current,
              answers: [],
              remainingSeconds: state.current.totalSeconds,
              status: state.current.mode === "listen" ? "reading" : "answering",
              startedAt: new Date().toISOString(),
              endedAt: undefined
            },
            isQuestionVisible: state.current.mode === "read"
          }
        : state
    )
}));
