import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { AuthenticatedRequest, AuthUserPayload } from '../types';

interface DecodedToken {
  id?: string;
  userId?: string;
  role?: UserRole;
  email?: string;
  name?: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to verify JWT authentication token from Bearer header
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('Fatal: JWT_SECRET environment variable is missing.');
    res.status(500).json({
      success: false,
      message: 'Server configuration error.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid token payload: missing user identifier.',
      });
      return;
    }

    // Optional database verification to ensure user hasn't been deleted
    const user = await User.findById(userId).select('id name email role');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
      return;
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

/**
 * Middleware factory to enforce Role-Based Access Control (RBAC)
 * e.g., requireRole('superadmin')
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required prior to role verification.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
};
