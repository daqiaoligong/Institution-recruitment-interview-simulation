import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, RequestUser } from "../common/auth/current-user.decorator";
import { AuthGuard } from "../common/auth/auth.guard";
import { AuthService } from "./auth.service";
import { AuthDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() body: AuthDto) {
    return this.authService.register(body);
  }

  @Post("login")
  login(@Body() body: AuthDto) {
    return this.authService.login(body);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user.id);
  }
}
