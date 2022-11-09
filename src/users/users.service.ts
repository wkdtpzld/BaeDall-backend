import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { UserProfileOutput } from './dtos/user-profile.dtol';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verification: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.users.findOne({ where: { email } });
      if (exists) {
        return { ok: false, error: '등록된 이메일입니다.' };
      }
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      const verification = await this.verification.save(
        this.verification.create({
          user,
        }),
      );
      this.mailService.sendVerificationEmail(user.email, verification.code);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Couldn`t create account' };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne({
        where: { email },
        select: ['password', 'id'],
      });
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
    try {
      const { decode } = this.jwtService.verify(accessToken);
      const { id } = await this.users.findOne({
        where: { id: decode.payload['id'] },
      });
      const { ok, decoded } = await this.jwtService.refreshVerify(
        refreshToken,
        id,
      );

      if (ok && decoded) {
        const newAccessToken = this.jwtService.sign({ id });
        return {
          ok: true,
          accessToken: newAccessToken,
        };
      }
    } catch (e) {
      return {
        ok: false,
      };
    }
  }

  async removeRefreshToken(id: number) {
    return this.users.update(id, {
      refreshToken: null,
    });
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOne({ where: { id } });
      if (user) {
        return {
          ok: true,
          user,
        };
      }
    } catch (e) {
      return { ok: false, error: 'User Not Found' };
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne({ where: { id: userId } });
      if (email) {
        user.email = email;
        user.verified = false;
        const verification = await this.verification.save(
          this.verification.create({ user }),
        );
        this.mailService.sendVerificationEmail(user.email, verification.code);
      }
      if (password) {
        user.password = password;
      }
      await this.users.save(user);
      return {
        ok: true,
      };
    } catch (error) {
      return { ok: false, error: 'Could not update Profile' };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verification.findOne({
        where: { code },
        relations: ['user'],
      });
      if (verification) {
        verification.user.verified = true;
        await this.users.save(verification.user);
        await this.verification.delete(verification.id);
        return { ok: true };
      }
      throw new Error();
    } catch (error) {
      return { ok: false, error };
    }
  }
}
