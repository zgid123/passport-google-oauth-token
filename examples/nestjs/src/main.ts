import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';

config({
  path: '.env',
});

import { AppModule } from 'app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3_000);
}

bootstrap();
