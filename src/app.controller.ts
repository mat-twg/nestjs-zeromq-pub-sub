import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  private readonly logger = new Logger(this.constructor.name);

  @MessagePattern('test')
  action(@Payload() data: string) {
    this.logger.log('action1 - ' + data);
  }

  @MessagePattern('test2')
  action2(@Payload() data: string) {
    this.logger.log('action2 - ' + data);
  }
}
