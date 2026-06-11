import { IsArray, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class JobProfileInputDto {
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  unitName?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  extraInfo?: string;
}

export class ReviewAnswerDto {
  @IsOptional()
  @IsString()
  interviewAnswerId?: string;

  @IsString()
  question!: string;

  @IsOptional()
  @IsString()
  transcript?: string;

  @IsOptional()
  @IsString()
  questionType?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => JobProfileInputDto)
  jobProfile?: JobProfileInputDto;
}

export class GenerateQuestionsDto extends JobProfileInputDto {}

class ReportAnswerDto {
  @IsString()
  question!: string;

  @IsOptional()
  @IsString()
  transcript?: string;

  @IsOptional()
  @IsObject()
  aiReview?: Record<string, unknown>;
}

export class GenerateReportDto {
  @IsOptional()
  @IsString()
  interviewId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportAnswerDto)
  answers!: ReportAnswerDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => JobProfileInputDto)
  jobProfile?: JobProfileInputDto;
}

export class TranscribeAudioDto {
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  audioData?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  durationSeconds?: number;
}
