import { Body, Controller, Post } from "@nestjs/common";
import { DeepseekService } from "./deepseek.service";

@Controller("ai")
export class AiController {
  constructor(private readonly deepseek: DeepseekService) {}

  @Post("review-answer")
  reviewAnswer(@Body() body: unknown) {
    return this.deepseek.mockReview(body);
  }

  @Post("generate-questions")
  generateQuestions(@Body() body: unknown) {
    return this.deepseek.mockQuestions(body);
  }

  @Post("generate-report")
  generateReport(@Body() body: unknown) {
    return this.deepseek.mockReport(body);
  }
}
