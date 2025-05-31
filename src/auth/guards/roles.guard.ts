import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Role } from 'generated/prisma';
import { ROLES_KEY } from '../roles.decorator';
import { RequestWithUser } from 'src/common/types/auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user }: RequestWithUser = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
