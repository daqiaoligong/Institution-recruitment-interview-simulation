import type { Question, QuestionSet } from "@humian/shared";
import { CUSTOM_QUESTION_LIMIT } from "@humian/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedQuestionSets } from "../data/seedQuestions";

interface QuestionState {
  questionSets: QuestionSet[];
  selectedSetId: string;
  freeMockQuestions: Question[];
  customQuestions: Question[];
  selectSet: (id: string) => void;
  addToFreeMock: (question: Question) => void;
  removeFromFreeMock: (id: string) => void;
  updateFreeMockQuestion: (id: string, content: string) => void;
  clearFreeMock: () => void;
  addCustomQuestion: (content: string) => { ok: boolean; message?: string };
}

export const useQuestionStore = create<QuestionState>()(
  persist(
    (set, get) => ({
      questionSets: seedQuestionSets,
      selectedSetId: seedQuestionSets[0].id,
      freeMockQuestions: [],
      customQuestions: [],
      selectSet: (id) => set({ selectedSetId: id }),
      addToFreeMock: (question) =>
        set((state) => {
          if (state.freeMockQuestions.some((item) => item.id === question.id)) return state;
          return { freeMockQuestions: [...state.freeMockQuestions, question] };
        }),
      removeFromFreeMock: (id) =>
        set((state) => ({ freeMockQuestions: state.freeMockQuestions.filter((item) => item.id !== id) })),
      updateFreeMockQuestion: (id, content) =>
        set((state) => ({
          freeMockQuestions: state.freeMockQuestions.map((item) =>
            item.id === id ? { ...item, content, source: "manual" } : item
          )
        })),
      clearFreeMock: () => set({ freeMockQuestions: [] }),
      addCustomQuestion: (content) => {
        if (get().customQuestions.length >= CUSTOM_QUESTION_LIMIT) {
          return { ok: false, message: "我的专属题型最多保存 10 道题" };
        }
        const question: Question = {
          id: `custom-${Date.now()}`,
          title: "我的专属题",
          content,
          type: "jobMatching",
          source: "manual"
        };
        set((state) => ({ customQuestions: [...state.customQuestions, question] }));
        return { ok: true };
      }
    }),
    { name: "hm-questions" }
  )
);
