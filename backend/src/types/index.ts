import { Request } from 'express';

export type UserRole = 'user' | 'superadmin';

export interface AuthUserPayload {
  id: string;
  role: UserRole;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
