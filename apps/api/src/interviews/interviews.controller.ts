import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../common/auth/auth.guard";
import { CurrentUser, RequestUser } from "../common/auth/current-user.decorator";
import { CreateInterviewDto, SaveAnswerDto } from "./dto";
import { InterviewsService } from "./interviews.service";

@Controller("interviews")
@UseGuards(AuthGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() body: CreateInterviewDto) {
    return this.interviewsService.create(user.id, body);
  }

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.interviewsService.list(user.id);
  }

  @Get(":id")
  get(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.interviewsService.get(user.id, id);
  }

  @Post(":id/answers")
  answer(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: SaveAnswerDto) {
    return this.interviewsService.saveAnswer(user.id, id, body);
  }

  @Post(":id/finish")
  finish(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.interviewsService.finish(user.id, id);
  }
}
