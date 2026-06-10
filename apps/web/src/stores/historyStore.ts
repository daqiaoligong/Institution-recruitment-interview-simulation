import type { Interview } from "@humian/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HistoryState {
  sessions: Interview[];
  saveSession: (session: Interview) => void;
  updateAnswerTranscript: (sessionId: string, answerId: string, transcript: string) => void;
  getSession: (id: string) => Interview | undefined;
  listSessions: () => Interview[];
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],
      saveSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions.filter((item) => item.id !== session.id)]
        })),
      updateAnswerTranscript: (sessionId, answerId, transcript) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  answers: session.answers.map((answer) =>
                    answer.id === answerId ? { ...answer, transcript } : answer
                  )
                }
              : session
          )
        })),
      getSession: (id) => get().sessions.find((session) => session.id === id),
      listSessions: () =>
        [...get().sessions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    }),
    { name: "hm-history" }
  )
);
