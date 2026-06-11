import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../common/auth/auth.guard";
import { CurrentUser, RequestUser } from "../common/auth/current-user.decorator";
import { SaveJobProfileDto } from "./dto";
import { JobProfileService } from "./job-profile.service";

@Controller("job-profile")
@UseGuards(AuthGuard)
export class JobProfileController {
  constructor(private readonly jobProfileService: JobProfileService) {}

  @Get()
  get(@CurrentUser() user: RequestUser) {
    return this.jobProfileService.get(user.id);
  }

  @Post()
  save(@CurrentUser() user: RequestUser, @Body() body: SaveJobProfileDto) {
    return this.jobProfileService.save(user.id, body);
  }
}
