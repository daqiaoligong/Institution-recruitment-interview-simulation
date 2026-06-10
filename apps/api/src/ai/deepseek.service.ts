import { Injectable } from "@nestjs/common";

@Injectable()
export class DeepseekService {
  mockReview(input: unknown) {
    return {
      input,
      comment: "DeepSeek 接入预留：当前返回开发期占位评语。",
      thinking: "建议按表态、分析、对策、总结四步展开。",
      suggestions: ["补充上海本地案例", "强化岗位匹配", "提高表达结构化"]
    };
  }

  mockQuestions(input: unknown) {
    return {
      input,
      questions: Array.from({ length: 10 }, (_, index) => `岗位匹配题 ${index + 1}：请结合岗位要求谈谈你的理解。`)
    };
  }

  mockReport(input: unknown) {
    return {
      input,
      summary: "DeepSeek 接入预留：当前返回开发期占位总评。",
      totalScore: 82
    };
  }
}
