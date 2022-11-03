import { Inject, Injectable } from '@nestjs/common';
import { JwtModuleOptions } from './jwt.interface';
import { CONFIG_OPTIONS } from './jwt.constants';
import * as jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions,
  ) {}
  sign(payload: object): string {
    return jwt.sign(payload, this.options.privateKey, {
      algorithm: 'HS256',
      expiresIn: '10s',
    });
  }

  verify(token: string): {
    ok: boolean;
    decoded?: jwt.JwtPayload | string;
    message?: string;
  } {
    try {
      const decoded = jwt.verify(token, this.options.privateKey);
      return {
        ok: true,
        decoded,
      };
    } catch (e) {
      return {
        ok: false,
        message: e.message,
      };
    }
  }

  refresh(payload: object): string {
    return jwt.sign({ payload }, this.options.privateKey, {
      algorithm: 'HS256',
      expiresIn: '14d',
    });
  }
}
