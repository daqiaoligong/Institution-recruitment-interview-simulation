import { Global, Module } from "@nestjs/common";
import { AuthGuard } from "./auth/auth.guard";
import { TokenService } from "./auth/token.service";

@Global()
@Module({
  providers: [AuthGuard, TokenService],
  exports: [AuthGuard, TokenService]
})
export class CommonModule {}
