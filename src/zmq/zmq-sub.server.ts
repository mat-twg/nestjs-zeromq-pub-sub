import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ZmqPubSubClient, ZmqClientOptions, ZmqSocketType } from './index';
import { LOGGER_CONTEXT, MESSAGE_EVENT } from './constants';

export interface ZmqSubServerOptions {
  options: {
    address: string;

    curve?: {
      serverKey?: string;
      publicKey?: string;
      secretKey?: string;
      path?: string;
    };

    channel?: {
      postfix?: string;
    };
  };
}

export class ZmqSubServer extends Server implements CustomTransportStrategy {
  public logger = new Logger(LOGGER_CONTEXT);

  private readonly clients: ZmqPubSubClient[];
  private readonly clientOptions: ZmqClientOptions['options'];

  constructor(private readonly options: ZmqSubServerOptions['options']) {
    super();
    this.clients = [];
    this.clientOptions = Object.assign(this.options, {
      socket: { type: ZmqSocketType.SUB },
    });
  }

  public listen(callback: (...optionalParams: unknown[]) => any): void {
    try {
      this.messageHandlers.forEach((handler, channel) => {
        const client = new ZmqPubSubClient(this.clientOptions);

        Promise.resolve(client.connect())
          .then(() => {
            client.subscribe(channel).addListener(MESSAGE_EVENT, handler);
            callback();
          })
          .catch(callback);

        this.clients.push(client);
      });
    } catch (err) {
      callback(err);
    }
  }

  public close(): void {
    this.clients.forEach((client) => client.close());
  }
}
