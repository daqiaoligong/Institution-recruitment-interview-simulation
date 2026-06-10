import type { JobProfile } from "@humian/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface JobProfileState {
  profile?: JobProfile;
  saveProfile: (profile: Omit<JobProfile, "updatedAt">) => void;
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
      saveProfile: (profile) => set({ profile: { ...profile, updatedAt: new Date().toISOString() } })
    }),
    { name: "hm-job-profile" }
  )
);
