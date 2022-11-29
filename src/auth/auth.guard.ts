import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AllowedRoles } from './role.decorator';
import { User } from 'src/users/entities/user.entity';
import { JwtService } from '../jwt/jwt.service';
import { UserService } from '../users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const role = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );
    if (!role) {
      return true;
    }
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext.token;
    const decoded = this.jwtService.verify(token.toString());
    if (decoded.ok && decoded.decode) {
      const { user } = await this.userService.findById(
        decoded.decode.payload['id'],
      );
      if (user) {
        gqlContext['user'] = user;
        if (role.includes('Any')) {
          return true;
        }
        return role.includes(user.role);
      }
      return false;
    }
  }
}
