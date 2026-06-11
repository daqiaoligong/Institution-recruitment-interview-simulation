import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../common/auth/auth.guard";
import { CurrentUser, RequestUser } from "../common/auth/current-user.decorator";
import { CreateCustomQuestionDto, UpdateCustomQuestionDto } from "./dto";
import { QuestionsService } from "./questions.service";

@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get("questions/tree")
  tree() {
    return this.questionsService.tree();
  }

  @Get("questions")
  list(@Query("type") type?: string, @Query("region") region?: string, @Query("keyword") keyword?: string) {
    return this.questionsService.list({ type, region, keyword });
  }

  @Get("question-sets/:id")
  set(@Param("id") id: string) {
    return this.questionsService.questionSet(id);
  }

  @Post("questions/custom")
  @UseGuards(AuthGuard)
  createCustom(@CurrentUser() user: RequestUser, @Body() body: CreateCustomQuestionDto) {
    return this.questionsService.createCustom(user.id, body);
  }

  @Put("questions/custom/:id")
  @UseGuards(AuthGuard)
  updateCustom(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: UpdateCustomQuestionDto) {
    return this.questionsService.updateCustom(user.id, id, body);
  }

  @Delete("questions/custom/:id")
  @UseGuards(AuthGuard)
  deleteCustom(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.questionsService.deleteCustom(user.id, id);
  }
}
