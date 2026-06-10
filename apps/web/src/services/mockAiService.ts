import type { AiReport, InterviewAnswer } from "@humian/shared";
import { createMockReview } from "../data/mockReports";

export function reviewAnswers(answers: InterviewAnswer[]): InterviewAnswer[] {
  return answers.map((answer) => ({
    ...answer,
    aiReview: createMockReview(answer.questionContentSnapshot, answer.transcript)
  }));
}

export function createMockReport(answers: InterviewAnswer[]): AiReport {
  const answered = answers.filter((answer) => answer.transcript.trim()).length;
  return {
    totalScore: answered ? 82 : 60,
    matchScore: answered ? 84 : 62,
    stabilityScore: answered ? 78 : 58,
    summary: answered
      ? "本场作答具备基本结构，能围绕题目展开。后续应强化案例、岗位意识和对策落地性。"
      : "本场有效作答较少，建议先完成完整表达训练，再进入 AI 精细化复盘。",
    details: { answeredCount: answered }
  };
}
