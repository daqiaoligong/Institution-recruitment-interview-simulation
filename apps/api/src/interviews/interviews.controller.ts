import { Body, Controller, Get, Param, Post } from "@nestjs/common";

@Controller("interviews")
export class InterviewsController {
  @Post()
  create(@Body() body: unknown) {
    return body;
  }

  @Get()
  list() {
    return [];
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return { id };
  }

  @Post(":id/answers")
  answer(@Param("id") id: string, @Body() body: unknown) {
    return { interviewId: id, ...(body as object) };
  }

  @Post(":id/finish")
  finish(@Param("id") id: string) {
    return { id, status: "finished" };
  }
}
