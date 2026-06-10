import { Body, Controller, Get, Post } from "@nestjs/common";

interface AuthDto {
  username: string;
  email: string;
}

@Controller("auth")
export class AuthController {
  @Post("register")
  register(@Body() body: AuthDto) {
    return { id: `user-${body.email}`, username: body.username, email: body.email, token: "dev-token" };
  }

  @Post("login")
  login(@Body() body: AuthDto) {
    return { id: `user-${body.email}`, username: body.username, email: body.email, token: "dev-token" };
  }

  @Get("me")
  me() {
    return { id: "dev-user", username: "考生1234", email: "candidate@example.com" };
  }
}
