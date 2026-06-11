import { IsEmail, IsString, MinLength } from "class-validator";

export class AuthDto {
  @IsString()
  @MinLength(1)
  username!: string;

  @IsEmail()
  email!: string;
}
