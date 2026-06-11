import { IsOptional, IsString } from "class-validator";

export class SaveJobProfileDto {
  @IsString()
  jobTitle!: string;

  @IsString()
  unitName!: string;

  @IsString()
  requirements!: string;

  @IsOptional()
  @IsString()
  extraInfo?: string;
}
