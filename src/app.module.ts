import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { ZmqPubSubClient, ZmqSocketType } from './zmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env'],
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: 'APP_SERVICE',
      useFactory: (configService: ConfigService) => {
        return new ZmqPubSubClient({
          address: configService.get('ZMQ_ADDRESS'),
          socket: {
            type: ZmqSocketType.PUB,
          },
        });
      },
      inject: [ConfigService],
    },
    AppService,
  ],
})
export class AppModule {}
