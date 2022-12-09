import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import { join, isAbsolute } from 'path';
import { existsSync } from 'fs';
import * as zmq from 'zeromq';
import { LOGGER_CONTEXT } from './constants';
import { clc } from '@nestjs/common/utils/cli-colors.util';

enum Curve {
  PUBLIC_KEY = 'public_key.curve',
  SECRET_KEY = 'secret_key.curve',
}

interface CurveKeyPair {
  publicKey: string;
  secretKey: string;
}

export class ZmqCurve {
  private readonly logger = new Logger(LOGGER_CONTEXT);
  private readonly defaultPath = join(process.cwd(), 'curve');

  constructor(private readonly path?: string) {
    this.path = path || this.defaultPath;
    if (!isAbsolute(this.path)) {
      throw new Error(
        `Invalid curve keys path - must be absolute, defaults: ${this.defaultPath}`,
      );
    }
  }

  get secretKey(): string {
    return this.getKeyFromFile(Curve.SECRET_KEY) ?? this.initKeys().secretKey;
  }

  get publicKey(): string {
    return this.getKeyFromFile(Curve.PUBLIC_KEY) ?? this.initKeys().publicKey;
  }

  getKeyFromFile(fileName: string): string | undefined {
    return fs.existsSync(join(this.path, fileName))
      ? fs.readFileSync(join(this.path, fileName), 'utf8').split(/\r?\n/)[0]
      : undefined;
  }

  createKeyFile(fileName: string, key: string): void {
    const pathname = join(this.path, fileName);
    fs.appendFileSync(pathname, key + '\n', 'utf8');
    this.logger.log(clc.magentaBright(`New key created: ${pathname}`));
  }

  initKeys(keyPair?: CurveKeyPair): CurveKeyPair {
    keyPair = keyPair ?? zmq.curveKeyPair();
    existsSync(this.path) || fs.mkdirSync(this.path, { recursive: true });
    this.createKeyFile(Curve.SECRET_KEY, keyPair.secretKey);
    this.createKeyFile(Curve.PUBLIC_KEY, keyPair.publicKey);
    return keyPair;
  }
}
