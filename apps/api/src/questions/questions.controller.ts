import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";

@Controller()
export class QuestionsController {
  @Get("questions/tree")
  tree() {
    return [];
  }

  @Get("questions")
  list() {
    return [];
  }

  @Get("question-sets/:id")
  set(@Param("id") id: string) {
    return { id, questions: [] };
  }

  @Post("questions/custom")
  createCustom(@Body() body: unknown) {
    return body;
  }

  @Put("questions/custom/:id")
  updateCustom(@Param("id") id: string, @Body() body: unknown) {
    return { id, ...(body as object) };
  }

  @Delete("questions/custom/:id")
  deleteCustom(@Param("id") id: string) {
    return { id, deleted: true };
  }
}
