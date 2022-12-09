import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';
import { clc } from '@nestjs/common/utils/cli-colors.util';
import { ZmqSubServer } from './zmq';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.API_PORT || 3000;

  app.connectMicroservice({
    strategy: new ZmqSubServer({
      address: process.env.ZMQ_ADDRESS,
    }),
  });

  await app.startAllMicroservices();

  await app.listen(3000, () =>
    Logger.log(
      clc.cyanBright(`Server started on port: ${port}`),
      'NestApplication',
    ),
  );
}

(async () => await bootstrap())();

// async function bootstrap() {
//   const app = await NestFactory.createApplicationContext(AppModule);
// }
//
// (async () => await bootstrap())();

// (async () => NestFactory.createApplicationContext(AppModule))();