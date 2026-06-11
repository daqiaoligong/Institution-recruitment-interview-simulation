import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TokenService } from "../common/auth/token.service";
import { AuthDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService
  ) {}

  async register(dto: AuthDto) {
    const user = await this.prisma.user.upsert({
      where: { email: dto.email },
      update: { username: dto.username },
      create: { email: dto.email, username: dto.username }
    });
    return this.withToken(user);
  }

  async login(dto: AuthDto) {
    const user = await this.prisma.user.upsert({
      where: { email: dto.email },
      update: { username: dto.username },
      create: { email: dto.email, username: dto.username }
    });
    return this.withToken(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toUser(user);
  }

  private withToken(user: { id: string; username: string; email: string; createdAt: Date }) {
    return {
      ...this.toUser(user),
      token: this.tokenService.sign({ userId: user.id, email: user.email })
    };
  }

  private toUser(user: { id: string; username: string; email: string; createdAt: Date }) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt.toISOString()
    };
  }
}
