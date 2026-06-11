import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../common/auth/auth.guard";
import { CurrentUser, RequestUser } from "../common/auth/current-user.decorator";
import { DeepseekService } from "./deepseek.service";
import { GenerateQuestionsDto, GenerateReportDto, ReviewAnswerDto, TranscribeAudioDto } from "./dto";

@Controller("ai")
@UseGuards(AuthGuard)
export class AiController {
  constructor(private readonly deepseek: DeepseekService) {}

  @Post("review-answer")
  reviewAnswer(@CurrentUser() user: RequestUser, @Body() body: ReviewAnswerDto) {
    return this.deepseek.reviewAnswer(user.id, body);
  }

  @Post("generate-questions")
  generateQuestions(@Body() body: GenerateQuestionsDto) {
    return this.deepseek.generateQuestions(body);
  }

  @Post("generate-report")
  generateReport(@CurrentUser() user: RequestUser, @Body() body: GenerateReportDto) {
    return this.deepseek.generateReport(user.id, body);
  }

  @Post("transcribe-audio")
  transcribeAudio(@Body() body: TranscribeAudioDto) {
    return this.deepseek.transcribeAudio(body);
  }
}
