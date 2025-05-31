import { Request } from 'express';
import { Role } from 'generated/prisma';

export interface RequestWithCookies extends Request {
  cookies: {
    access_token?: string;
  };
}

export interface ValidatedUser {
  id: number;
  username: string;
  role: Role;
}

export interface RequestWithUser extends Request {
  user: ValidatedUser;
}

export interface JwtPayload {
  sub: number;
  username: string;
  role: Role;
}
