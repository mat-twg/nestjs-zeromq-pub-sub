import { Inject, Injectable } from '@nestjs/common';
import { ZmqPubSubClient } from './zmq';

@Injectable()
export class AppService {
  constructor(
    @Inject('APP_SERVICE') private readonly publisher: ZmqPubSubClient,
  ) {
    this.publisher.bind();
    this.start();
  }

  start(): void {
    setInterval(async () => {
      this.publisher
        .send('test', 'app service publisher message at channel: test')
        .subscribe();
    }, 1000);

    setInterval(async () => {
      this.publisher
        .send('test2', 'app service publisher message at channel: test2')
        .subscribe();
    }, 2000);
  }
}
