import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { json, static as serveStatic, urlencoded } from "express";
import { join } from "node:path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const bodyLimit = config.get<string>("BODY_LIMIT") ?? "50mb";
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));
  app.setGlobalPrefix("api");
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const uploadRoot = config.get<string>("UPLOAD_ROOT") ?? "uploads";
  app.use(`/${uploadRoot}`, serveStatic(join(process.cwd(), uploadRoot)));

  const port = config.get<number>("PORT") ?? 3001;
  await app.listen(port);
}

void bootstrap();
