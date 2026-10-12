import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUserDocument } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

/**
 * Generate standard signed JWT token
 */
const generateToken = (user: IUserDocument): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError('JWT secret is not configured on the server', 500);
  }

  // Token expires in 7 days by default
  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    jwtSecret,
    { expiresIn: '7d' }
  );
};

/**
 * POST /api/auth/register
 * Register a new user. Role strictly defaults to 'user'.
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, privacySettings } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Please provide name, email, and password.', 400);
    }

    if (typeof password !== 'string' || password.length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    // Salt and hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Enforce strict regular user role during public registration
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user', // strictly default to 'user'
      privacySettings: {
        shareNotesWithAdmin:
          privacySettings?.shareNotesWithAdmin !== undefined
            ? Boolean(privacySettings.shareNotesWithAdmin)
            : true,
      },
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        privacySettings: newUser.privacySettings,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate user credentials and return JWT token
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide both email and password.', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        privacySettings: user.privacySettings,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Retrieve profile of currently authenticated user
 */
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized: User context missing.', 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('User profile not found.', 404);
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        privacySettings: user.privacySettings,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/privacy
 * Update user privacy settings (e.g. shareNotesWithAdmin)
 */
export const updatePrivacySettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized: User context missing.', 401);
    }

    const { shareNotesWithAdmin } = req.body;
    if (shareNotesWithAdmin === undefined) {
      throw new AppError('Please provide shareNotesWithAdmin boolean value.', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'privacySettings.shareNotesWithAdmin': Boolean(shareNotesWithAdmin),
        },
      },
      { new: true }
    );

    if (!user) {
      throw new AppError('User profile not found.', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully.',
      privacySettings: user.privacySettings,
    });
  } catch (error) {
    next(error);
  }
};

