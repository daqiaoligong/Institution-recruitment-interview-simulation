import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiModule } from "./ai/ai.module";
import { AnswersModule } from "./answers/answers.module";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { InterviewsModule } from "./interviews/interviews.module";
import { JobProfileModule } from "./job-profile/job-profile.module";
import { MembershipModule } from "./membership/membership.module";
import { PrismaModule } from "./prisma/prisma.module";
import { QuestionsModule } from "./questions/questions.module";
import { ReportsModule } from "./reports/reports.module";
import { UploadsModule } from "./uploads/uploads.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    QuestionsModule,
    JobProfileModule,
    InterviewsModule,
    AnswersModule,
    UploadsModule,
    AiModule,
    ReportsModule,
    MembershipModule
  ]
})
export class AppModule {}
