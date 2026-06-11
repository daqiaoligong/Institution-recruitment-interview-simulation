import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { static as serveStatic } from "express";
import { join } from "node:path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = app.get(ConfigService);
  const uploadRoot = config.get<string>("UPLOAD_ROOT") ?? "uploads";
  app.use(`/${uploadRoot}`, serveStatic(join(process.cwd(), uploadRoot)));

  const port = config.get<number>("PORT") ?? 3001;
  await app.listen(port);
}

void bootstrap();
