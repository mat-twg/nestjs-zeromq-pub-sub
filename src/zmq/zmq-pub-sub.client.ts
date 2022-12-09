import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ZmqCurve } from './zmq.curve';
import { Socket } from 'zeromq/lib/compat';
import * as Buffer from 'buffer';
import { clc } from '@nestjs/common/utils/cli-colors.util';
import { Observable, Observer, throwError } from 'rxjs';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { InvalidMessageException } from '@nestjs/microservices/errors/invalid-message.exception';
import { LOGGER_CONTEXT } from './constants';

export enum ZmqSocketType {
  PUB = 'pub',
  SUB = 'sub',
}

const ZmqSocketTypeNames = {
  [ZmqSocketType.PUB]: 'Publisher',
  [ZmqSocketType.SUB]: 'Subscriber',
};

export interface ZmqClientOptions {
  options: {
    address: string;

    socket: {
      type: ZmqSocketType;
    };

    curve?: {
      server?: boolean;
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

export class ZmqPubSubClient extends ClientProxy {
  public logger = new Logger(LOGGER_CONTEXT);

  private readonly channelPostfix: string;
  private readonly socket: Socket;
  private readonly curve: ZmqCurve;

  constructor(private readonly options: ZmqClientOptions['options']) {
    super();
    this.channelPostfix = this.options?.channel?.postfix || '@';
    this.curve = new ZmqCurve(this.options?.curve?.path);
    this.socket = this.createSocket();

    this.initializeSerializer(options);
    this.initializeDeserializer(options);
  }

  private createSocket(): Socket {
    const socket = new Socket(this.options.socket.type);

    if (!this.options.curve) {
      return socket;
    }

    if (this.options.curve.server) {
      socket.setsockopt('curve_server', true);
    } else {
      socket.setsockopt('curve_serverkey', this.options.curve.serverKey);
    }

    socket.setsockopt(
      'curve_publickey',
      this.options.curve.publicKey || this.curve.publicKey,
    );

    socket.setsockopt(
      'curve_secretkey',
      this.options.curve.secretKey || this.curve.secretKey,
    );

    return socket;
  }

  public async connect(): Promise<any> {
    this.socket.connect(this.options.address);
    this.logger.log(
      clc.cyanBright(
        `${ZmqSocketTypeNames[this.socket.type]} connected to: ${
          this.options.address
        }`,
      ),
    );
  }

  public bind(): void {
    this.socket.bind(this.options.address);
    this.logger.log(
      clc.cyanBright(
        `${ZmqSocketTypeNames[this.socket.type]} bound on: ${
          this.options.address
        }`,
      ),
    );
  }

  public subscribe(filter: string): this {
    if (this.socket.type === ZmqSocketType.SUB) {
      this.logger.log(clc.cyanBright(`Subscribed on channel: ${filter}`));
      this.socket.subscribe(filter + this.channelPostfix);
    }
    return this;
  }

  public addListener(event: string, listener: (...args: any[]) => void): this {
    if (this.socket.type === ZmqSocketType.SUB) {
      this.socket.addListener(event, (channel: Buffer, data: Buffer) =>
        listener(JSON.parse(data.toString())),
      );
    }
    return this;
  }

  close(): any {
    this.socket.close();
  }

  public send<TResult = any, TInput = any>(
    pattern: string,
    data: TInput,
  ): Observable<TResult> {
    if (isNil(pattern) || isNil(data)) {
      return throwError(() => new InvalidMessageException());
    }
    return new Observable((observer: Observer<TResult>) => {
      const callback = this.createObserver(observer);
      return this.publish({ pattern, data }, callback);
    });
  }

  protected publish(
    packet: ReadPacket,
    callback: (packet: WritePacket) => void,
  ): () => void {
    try {
      if (this.socket && this.socket.type === ZmqSocketType.PUB) {
        this.socket.send([
          packet.pattern + this.channelPostfix,
          JSON.stringify(packet.data),
        ]);
      }
      return;
    } catch (err) {
      callback({ err });
    }
  }

  protected dispatchEvent<T = any>(packet: ReadPacket): Promise<T> {
    return Promise.resolve(undefined);
  }
}
