import { IsArray, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class CreateInterviewQuestionDto {
  @IsOptional()
  @IsString()
  questionId?: string;

  @IsString()
  questionTitle!: string;

  @IsString()
  questionContentSnapshot!: string;
}

export class CreateInterviewDto {
  @IsIn(["listen", "read"])
  mode!: string;

  @IsIn(["question_set", "free_mock", "custom", "ai"])
  sourceType!: string;

  @IsInt()
  @Min(1)
  totalSeconds!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInterviewQuestionDto)
  questions!: CreateInterviewQuestionDto[];
}

export class SaveAnswerDto {
  @IsOptional()
  @IsString()
  questionId?: string;

  @IsString()
  questionContentSnapshot!: string;

  @IsOptional()
  @IsString()
  transcript?: string;

  @IsOptional()
  @IsInt()
  durationSeconds?: number;

  @IsInt()
  @Min(1)
  sortOrder!: number;
}
