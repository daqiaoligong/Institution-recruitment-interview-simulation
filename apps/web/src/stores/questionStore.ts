import type { Question, QuestionSet } from "@humian/shared";
import { CUSTOM_QUESTION_LIMIT } from "@humian/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedQuestionSets } from "../data/seedQuestions";
import { apiClient } from "../services/apiClient";

interface TreeNode {
  id: string;
  label: string;
  children?: Array<{ id: string; label: string }>;
}

interface QuestionState {
  questionSets: QuestionSet[];
  questionTree: TreeNode[];
  selectedSetId: string;
  freeMockQuestions: Question[];
  customQuestions: Question[];
  loadQuestionSets: () => Promise<void>;
  selectSet: (id: string) => void;
  addToFreeMock: (question: Question) => void;
  removeFromFreeMock: (id: string) => void;
  updateFreeMockQuestion: (id: string, content: string) => void;
  clearFreeMock: () => void;
  loadCustomQuestions: () => Promise<void>;
  addCustomQuestion: (content: string) => Promise<{ ok: boolean; message?: string; question?: Question }>;
}

export const useQuestionStore = create<QuestionState>()(
  persist(
    (set, get) => ({
      questionSets: seedQuestionSets,
      questionTree: [],
      selectedSetId: seedQuestionSets[0].id,
      freeMockQuestions: [],
      customQuestions: [],
      loadQuestionSets: async () => {
        try {
          const tree = await apiClient<TreeNode[]>("/questions/tree");
          const setIds = tree.flatMap((node) => node.children?.map((child) => child.id) ?? []);
          const questionSets = await Promise.all(setIds.map((id) => apiClient<QuestionSet>(`/question-sets/${id}`)));
          if (questionSets.length) {
            set((state) => ({
              questionTree: tree,
              questionSets,
              selectedSetId: questionSets.some((item) => item.id === state.selectedSetId)
                ? state.selectedSetId
                : questionSets[0].id
            }));
          }
        } catch {
          set({ questionSets: seedQuestionSets, selectedSetId: get().selectedSetId || seedQuestionSets[0].id });
        }
      },
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
      loadCustomQuestions: async () => {
        try {
          const questions = await apiClient<Question[]>("/questions/custom");
          set({ customQuestions: questions });
        } catch {
          // Keep local persisted custom questions available when the backend is unavailable.
        }
      },
      addCustomQuestion: async (content) => {
        if (get().customQuestions.length >= CUSTOM_QUESTION_LIMIT) {
          return { ok: false, message: "我的专属题型最多保存 10 道题" };
        }
        try {
          const question = await apiClient<Question>("/questions/custom", {
            method: "POST",
            body: JSON.stringify({ content, type: "jobMatching" })
          });
          set((state) => ({ customQuestions: [question, ...state.customQuestions] }));
          return { ok: true, question };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : "加入题库失败"
          };
        }
      }
    }),
    { name: "hm-questions" }
  )
);
