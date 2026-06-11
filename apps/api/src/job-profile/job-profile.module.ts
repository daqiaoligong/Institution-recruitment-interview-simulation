import { Module } from "@nestjs/common";
import { JobProfileController } from "./job-profile.controller";
import { JobProfileService } from "./job-profile.service";

@Module({
  controllers: [JobProfileController],
  providers: [JobProfileService]
})
export class JobProfileModule {}
