import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly config: ConfigService) {}

  sign(payload: AuthTokenPayload) {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = this.createSignature(body);
    return `${body}.${signature}`;
  }

  verify(token: string): AuthTokenPayload {
    const [body, signature] = token.split(".");
    if (!body || !signature) throw new UnauthorizedException("Invalid token");

    const expected = this.createSignature(body);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      throw new UnauthorizedException("Invalid token");
    }

    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AuthTokenPayload;
  }

  private createSignature(body: string) {
    const secret = this.config.get<string>("JWT_SECRET") || "dev-secret";
    return createHmac("sha256", secret).update(body).digest("base64url");
  }
}
