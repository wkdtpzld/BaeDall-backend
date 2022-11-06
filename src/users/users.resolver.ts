import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { RefreshInput, RefreshOutput } from './dtos/refresh.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dtol';
import { User } from './entities/user.entity';
import { UserService } from './users.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly usersService: UserService) {}

  @Mutation(() => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    try {
      const { ok, error } = await this.usersService.createAccount(
        createAccountInput,
      );
      return {
        ok,
        error,
      };
    } catch (error) {
      return {
        error,
        ok: false,
      };
    }
  }

  @Mutation(() => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    try {
      const { ok, error, accessToken, refreshToken } =
        await this.usersService.login(loginInput);
      return { ok, error, accessToken, refreshToken };
    } catch (e) {
      return {
        ok: false,
        error: 'Error occured',
      };
    }
  }

  @Mutation(() => RefreshOutput)
  async refresh(
    @Args('input') { accessToken, refreshToken }: RefreshInput,
  ): Promise<RefreshOutput> {
    try {
      const { ok, accessToken: newAccessToken } =
        await this.usersService.IsMatchRefreshToken(accessToken, refreshToken);
      if (ok && newAccessToken) {
        return {
          ok,
          accessToken: newAccessToken,
        };
      }
    } catch (e) {
      console.log(e);
    }
  }

  @Query(() => Boolean)
  hi() {
    return true;
  }

  @Query(() => User)
  @UseGuards(AuthGuard)
  me(@AuthUser() authUser: User) {
    return authUser;
  }

  @Query(() => UserProfileOutput)
  @UseGuards(AuthGuard)
  async userProfile(
    @Args() userProfileInput: UserProfileInput,
  ): Promise<UserProfileOutput> {
    try {
      const user = await this.usersService.findById(userProfileInput.userId);
      if (!user) {
        return {
          ok: false,
          error: 'User Not Found',
        };
      }
      return {
        ok: true,
        user,
      };
    } catch {
      return {
        ok: false,
        error: 'User Not Found',
      };
    }
  }

  @UseGuards(AuthGuard)
  @Mutation(() => EditProfileOutput)
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      await this.usersService.editProfile(authUser.id, editProfileInput);
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }
}
