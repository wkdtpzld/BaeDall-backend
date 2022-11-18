import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AllowedRoles } from './role.decorator';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const role = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );
    if (!role) {
      return true;
    }
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user: User = gqlContext.req['user'];
    if (!user) {
      return false;
    }

    if (role.includes('Any')) return true;
    return role.includes(user.role);
  }
}
