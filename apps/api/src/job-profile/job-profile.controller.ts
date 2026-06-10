import { Body, Controller, Get, Post } from "@nestjs/common";

@Controller("job-profile")
export class JobProfileController {
  @Get()
  get() {
    return null;
  }

  @Post()
  save(@Body() body: unknown) {
    return body;
  }
}
