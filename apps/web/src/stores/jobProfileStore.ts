import type { JobProfile } from "@humian/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "../services/apiClient";

interface JobProfileState {
  profile?: JobProfile;
  loadProfile: () => Promise<void>;
  saveProfile: (profile: Omit<JobProfile, "updatedAt">) => Promise<{ ok: boolean; message?: string }>;
}

export const useJobProfileStore = create<JobProfileState>()(
  persist(
    (set) => ({
      profile: {
        userId: "local",
        jobTitle: "重大项目协调岗",
        unitName: "上海某区事业单位",
        requirements: "负责跨部门协调、材料撰写、项目推进与群众沟通。",
        extraInfo: "注重服务意识、执行能力和结构化表达。",
        updatedAt: new Date().toISOString()
      },
      loadProfile: async () => {
        try {
          const profile = await apiClient<JobProfile | null>("/job-profile");
          if (profile) set({ profile });
        } catch {
          // 后端不可用时保留本地缓存，保证原型仍可演示。
        }
      },
      saveProfile: async (profile) => {
        const localProfile = { ...profile, updatedAt: new Date().toISOString() };
        set({ profile: localProfile });

        try {
          const saved = await apiClient<JobProfile>("/job-profile", {
            method: "POST",
            body: JSON.stringify(profile)
          });
          set({ profile: saved });
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? `已本地保存，后端同步失败：${error.message}` : "已本地保存，后端同步失败"
          };
        }
      }
    }),
    { name: "hm-job-profile" }
  )
);
