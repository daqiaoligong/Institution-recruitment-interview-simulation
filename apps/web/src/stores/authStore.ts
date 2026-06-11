import type { User } from "@humian/shared";
import { EMAIL_PATTERN } from "@humian/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "../services/apiClient";

interface AuthResponse extends User {
  token: string;
}

interface AuthState {
  currentUser?: User;
  token?: string;
  login: (username: string, email: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
}

type PersistedAuthState = Partial<Pick<AuthState, "currentUser" | "token">>;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: undefined,
      token: undefined,
      login: async (username, email) => {
        const trimmedName = username.trim();
        const trimmedEmail = email.trim();
        if (!trimmedName) return { ok: false, message: "请输入用户名" };
        if (!EMAIL_PATTERN.test(trimmedEmail)) return { ok: false, message: "请输入正确的邮箱" };

        try {
          const result = await apiClient<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ username: trimmedName, email: trimmedEmail })
          });
          const { token, ...user } = result;
          set({ currentUser: user, token });
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? `登录失败：${error.message}` : "登录失败，请确认后端服务是否启动"
          };
        }
      },
      logout: () => set({ currentUser: undefined, token: undefined })
    }),
    {
      name: "hm-auth",
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as PersistedAuthState;
        if (state.currentUser && !state.token) {
          return { currentUser: undefined, token: undefined };
        }
        return state;
      }
    }
  )
);
