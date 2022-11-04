import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { JwtService } from 'src/jwt/jwt.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
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
      const refreshToken = this.jwtService.refresh();
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

  async IsMatchRefreshToken(accessToken: string, refreshToken: string) {
    const { decode } = await this.jwtService.verify(accessToken);
    const { id } = await this.users.findOne({
      where: { id: decode.payload['id'] },
    });
    const { ok, decoded } = await this.jwtService.refreshVerify(
      refreshToken,
      id,
    );

    if (ok && decoded) {
      const newAccessToken = await this.jwtService.sign({ id });
      return {
        ok: true,
        accessToken: newAccessToken,
      };
    }

    return {
      ok: false,
    };
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
