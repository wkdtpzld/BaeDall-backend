import { Inject, Injectable } from '@nestjs/common';
import { JwtModuleOptions } from './jwt.interface';
import * as jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CONFIG_OPTIONS } from 'src/common/common.constants';

@Injectable()
export class JwtService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions,
  ) {}
  sign(payload: object): string {
    return jwt.sign(payload, this.options.privateKey, {
      algorithm: 'HS256',
      expiresIn: '1d',
    });
  }

  verify(token: string): {
    ok: boolean;
    verify?: jwt.JwtPayload | string;
    decode?: jwt.Jwt;
    message?: string;
  } {
    try {
      const verify = jwt.verify(token, this.options.privateKey);
      const decode = jwt.decode(token, { complete: true });
      return {
        ok: true,
        verify,
        decode,
      };
    } catch (e) {
      return {
        ok: false,
        message: e.message,
      };
    }
  }

  refresh(): string {
    return jwt.sign({}, this.options.privateKey, {
      algorithm: 'HS256',
      expiresIn: '14d',
    });
  }

  async refreshVerify(
    token: string,
    id: number,
  ): Promise<{
    ok: boolean;
    decoded?: jwt.JwtPayload | string;
    message?: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.options.privateKey);
      const user = await this.users.findOne({ where: { id } });
      if (user.refreshToken !== token) {
        return {
          ok: false,
          message: 'is not Matched Token',
        };
      }
      return {
        ok: true,
        decoded,
      };
    } catch (e) {
      return {
        ok: false,
        message: 'refreshVerify Failed',
      };
    }
  }
}
