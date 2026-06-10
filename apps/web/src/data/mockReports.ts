import type { AiReview } from "@humian/shared";

export function createMockReview(question: string, transcript: string): AiReview {
  const hasAnswer = transcript.trim().length > 0;
  return {
    score: hasAnswer ? 82 : 58,
    comment: hasAnswer
      ? "作答能够围绕题目展开，结构基本清晰，能体现一定的公共服务意识。建议进一步补充上海本地治理案例，让观点更具体。"
      : "本题未识别到有效作答。建议先用“表态-分析-对策-总结”的结构完成基础表达。",
    thinking: `建议从三个层次展开：一是准确回应题目核心；二是结合岗位职责和上海事业单位场景分析原因；三是提出可执行、可落地的解决措施。题目：${question}`,
    strengths: hasAnswer ? ["能回应题干", "表达有基本结构"] : ["已完成题目记录"],
    weaknesses: hasAnswer ? ["案例支撑不足", "结尾升华略弱"] : ["缺少有效作答内容"],
    suggestions: ["增加上海本地案例", "多使用分点表达", "结尾回扣岗位职责"]
  };
}
