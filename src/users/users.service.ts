import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from 'src/jwt/jwt.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
    try {
      const exists = await this.users.findOne({ where: { email } });
      if (exists) {
        return { ok: false, error: '등록된 이메일입니다.' };
      }
      await this.users.save(this.users.create({ email, password, role }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Couldn`t create account' };
    }
  }

  async login({ email, password }: LoginInput): Promise<{
    ok: boolean;
    error?: string;
    accessToken?: string;
    refreshToken?: string;
  }> {
    try {
      const user = await this.users.findOne({ where: { email } });
      if (!user) {
        return {
          ok: false,
          error: 'User not found',
        };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: 'Wrong Password',
        };
      }
      const accessToken = this.jwtService.sign({ id: user.id });
      const refreshToken = this.jwtService.refresh({ id: user.id });
      await this.users.update(user.id, { refreshToken });

      return {
        ok: true,
        accessToken,
        refreshToken,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Login Failed occured ServerError',
      };
    }
  }

  async IsMatchRefreshToken(refreshToken: string, id: number) {
    const user = await this.users.findOne({ where: { id } });

    const isRefreshTokenMatch = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (isRefreshTokenMatch) {
      return user;
    }
  }

  async removeRefreshToken(id: number) {
    return this.users.update(id, {
      refreshToken: null,
    });
  }

  async findById(id: number): Promise<User> {
    return this.users.findOne({ where: { id } });
  }
}
