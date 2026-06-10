import type { User } from "@humian/shared";
import { EMAIL_PATTERN } from "@humian/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  currentUser?: User;
  login: (username: string, email: string) => { ok: boolean; message?: string };
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: undefined,
      login: (username, email) => {
        const trimmedName = username.trim();
        const trimmedEmail = email.trim();
        if (!trimmedName) return { ok: false, message: "请输入用户名" };
        if (!EMAIL_PATTERN.test(trimmedEmail)) return { ok: false, message: "请输入正确的邮箱" };
        set({
          currentUser: {
            id: `user-${trimmedEmail}`,
            username: trimmedName,
            email: trimmedEmail,
            createdAt: new Date().toISOString()
          }
        });
        return { ok: true };
      },
      logout: () => set({ currentUser: undefined })
    }),
    { name: "hm-auth" }
  )
);
