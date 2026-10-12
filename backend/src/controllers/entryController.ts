import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Entry, PRIMARY_EMOTIONS } from '../models/Entry';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

/**
 * POST /api/entries
 * Create a new emotion diary entry
 */
export const createEntry = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized: User context required.', 401);
    }

    const { emotion, note, tags, triggers, loggedAt } = req.body;

    if (!emotion || !emotion.primary || emotion.valenceScore === undefined) {
      throw new AppError(
        'Missing required emotion fields: "primary" and "valenceScore" are required.',
        400
      );
    }

    if (!PRIMARY_EMOTIONS.includes(emotion.primary)) {
      throw new AppError(
        `Invalid primary emotion. Must be one of: [${PRIMARY_EMOTIONS.join(', ')}]`,
        400
      );
    }

    const valence = Number(emotion.valenceScore);
    if (isNaN(valence) || valence < 1 || valence > 5) {
      throw new AppError('Valence score must be a number between 1 and 5.', 400);
    }

    let intensity = 3;
    if (emotion.intensityScore !== undefined) {
      intensity = Number(emotion.intensityScore);
      if (isNaN(intensity) || intensity < 1 || intensity > 5) {
        throw new AppError('Intensity score must be a number between 1 and 5.', 400);
      }
    }

    const entry = await Entry.create({
      userId: new mongoose.Types.ObjectId(req.user.id),
      emotion: {
        primary: emotion.primary,
        valenceScore: valence,
        intensityScore: intensity,
        subEmotions: Array.isArray(emotion.subEmotions)
          ? emotion.subEmotions.map((s: any) => String(s).trim())
          : [],
      },
      note: typeof note === 'string' ? note.trim() : '',
      tags: Array.isArray(tags)
        ? tags.map((t: any) => String(t).trim().toLowerCase()).filter(Boolean)
        : [],
      triggers: Array.isArray(triggers)
        ? triggers.map((tr: any) => String(tr).trim()).filter(Boolean)
        : [],
      loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Emotion entry logged successfully.',
      entry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/entries
 * Retrieve paginated entries for the authenticated user with optional filtering
 */
export const getEntries = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized: User context required.', 401);
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(req.user.id),
    };

    // Filter by tag
    if (req.query.tag) {
      filter.tags = String(req.query.tag).trim().toLowerCase();
    }

    // Filter by primary emotion
    if (req.query.emotion) {
      filter['emotion.primary'] = String(req.query.emotion).trim().toLowerCase();
    }

    // Filter by date range (loggedAt)
    if (req.query.startDate || req.query.endDate) {
      filter.loggedAt = {};
      if (req.query.startDate) {
        const parsedStart = new Date(req.query.startDate as string);
        if (!isNaN(parsedStart.getTime())) {
          filter.loggedAt.$gte = parsedStart;
        }
      }
      if (req.query.endDate) {
        const parsedEnd = new Date(req.query.endDate as string);
        if (!isNaN(parsedEnd.getTime())) {
          filter.loggedAt.$lte = parsedEnd;
        }
      }
      if (Object.keys(filter.loggedAt).length === 0) {
        delete filter.loggedAt;
      }
    }

    const [entries, total] = await Promise.all([
      Entry.find(filter)
        .sort({ loggedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Entry.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      entries,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/entries/:id
 * Retrieve a specific emotion entry by ID (ensuring ownership)
 */
export const getEntryById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized: User context required.', 401);
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid entry ID format.', 400);
    }

    const entry = await Entry.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(req.user.id),
    });

    if (!entry) {
      throw new AppError('Entry not found or unauthorized access.', 404);
    }

    res.status(200).json({
      success: true,
      entry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/entries/:id
 * Delete a specific emotion entry by ID (ensuring ownership)
 */
export const deleteEntry = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized: User context required.', 401);
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid entry ID format.', 400);
    }

    const deleted = await Entry.findOneAndDelete({
      _id: id,
      userId: new mongoose.Types.ObjectId(req.user.id),
    });

    if (!deleted) {
      throw new AppError('Entry not found or unauthorized access.', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Entry successfully deleted.',
      deletedEntryId: id,
    });
  } catch (error) {
    next(error);
  }
};
