import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

const questionTypes = ["comprehensive", "interpersonal", "emergency", "organization", "jobMatching", "professional"];

export class CreateCustomQuestionDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsIn(questionTypes)
  type?: string;
}

export class UpdateCustomQuestionDto extends CreateCustomQuestionDto {}
