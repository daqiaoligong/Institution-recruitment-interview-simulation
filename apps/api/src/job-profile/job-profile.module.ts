import { Module } from "@nestjs/common";
import { JobProfileController } from "./job-profile.controller";

@Module({
  controllers: [JobProfileController]
})
export class JobProfileModule {}
