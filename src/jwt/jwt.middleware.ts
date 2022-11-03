import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from './jwt.service';
import { UserService } from '../users/users.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if ('x-jwt' in req.headers && 'refresh-token' in req.headers) {
      const token = req.headers['x-jwt'];
      const refreshToken = req.headers['refresh-token'];
      const accessTokenDecoded = this.jwtService.verify(token.toString());
      const refreshTokenDecoded = this.jwtService.verify(
        refreshToken.toString(),
      );

      if (accessTokenDecoded.ok && accessTokenDecoded.decoded) {
        try {
          const user = await this.userService.findById(
            accessTokenDecoded.decoded['id'],
          );
          req['user'] = user;
        } catch (e) {
          console.log(e);
        }
      } else if (!accessTokenDecoded.ok && refreshTokenDecoded.ok) {
        try {
          const user = await this.userService.findById(
            refreshTokenDecoded.decoded['id'],
          );
          const newAccessToken = await this.jwtService.sign({ id: user.id });
          req['user'] = user;
        } catch (e) {
          console.log(e);
        }
      }
    }
    next();
  }
}
