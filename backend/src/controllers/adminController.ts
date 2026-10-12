import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Entry } from '../models/Entry';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

/**
 * Helper to compute dominant emotion from an array of emotion strings
 */
const calculateDominantEmotion = (emotions: string[]): { emotion: string; count: number } => {
  if (!emotions || emotions.length === 0) {
    return { emotion: 'none', count: 0 };
  }

  const counts: Record<string, number> = {};
  for (const emotion of emotions) {
    counts[emotion] = (counts[emotion] || 0) + 1;
  }

  let dominantEmotion = emotions[0];
  let maxCount = 0;

  for (const [emotion, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = emotion;
    }
  }

  return { emotion: dominantEmotion, count: maxCount };
};

/**
 * GET /api/admin/users
 * Lists all regular users with basic stats and last check-in timestamp
 */
export const getAllUsers = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const usersWithStats = await User.aggregate([
      {
        $match: { role: 'user' },
      },
      {
        $lookup: {
          from: 'entries',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$userId', '$$uid'] } } },
            { $sort: { loggedAt: -1 } },
            {
              $group: {
                _id: null,
                totalEntries: { $sum: 1 },
                lastCheckIn: { $first: '$loggedAt' },
              },
            },
          ],
          as: 'stats',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          privacySettings: 1,
          createdAt: 1,
          updatedAt: 1,
          totalEntries: {
            $ifNull: [{ $arrayElemAt: ['$stats.totalEntries', 0] }, 0],
          },
          lastCheckIn: {
            $ifNull: [{ $arrayElemAt: ['$stats.lastCheckIn', 0] }, null],
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      count: usersWithStats.length,
      users: usersWithStats.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        privacySettings: u.privacySettings,
        totalEntries: u.totalEntries,
        lastCheckIn: u.lastCheckIn,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/:targetUserId/report?period=day|week|month
 * Full emotional journey of a user (daily aggregations + chronological log entries).
 * Enforces privacy masking on raw notes if user has disabled shareNotesWithAdmin.
 */
export const getUserEmotionalReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { targetUserId } = req.params;
    const periodQuery = (req.query.period as string)?.toLowerCase() || 'week';

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new AppError('Invalid target user ID format.', 400);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('Target user not found.', 404);
    }

    // Determine start timestamp based on period filter
    const now = new Date();
    const startDate = new Date(now);

    if (periodQuery === 'day') {
      startDate.setHours(startDate.getHours() - 24);
    } else if (periodQuery === 'month') {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Default to 'week' (7 days)
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    const targetObjectId = new mongoose.Types.ObjectId(targetUserId);

    // 1. Daily Aggregations Pipeline
    const dailyStats = await Entry.aggregate([
      {
        $match: {
          userId: targetObjectId,
          loggedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$loggedAt' },
          },
          avgValence: { $avg: '$emotion.valenceScore' },
          avgIntensity: { $avg: '$emotion.intensityScore' },
          entryCount: { $sum: 1 },
          emotions: { $push: '$emotion.primary' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const dailyAggregations = dailyStats.map((item) => {
      const dominant = calculateDominantEmotion(item.emotions);
      return {
        date: item._id,
        entryCount: item.entryCount,
        avgValence: Number(item.avgValence.toFixed(2)),
        avgIntensity: Number(item.avgIntensity.toFixed(2)),
        dominantEmotion: dominant.emotion,
        dominantEmotionCount: dominant.count,
      };
    });

    // 2. Fetch Chronological Log Entries in the period
    const rawEntries = await Entry.find({
      userId: targetObjectId,
      loggedAt: { $gte: startDate },
    })
      .sort({ loggedAt: -1 })
      .lean();

    // 3. Apply Privacy Guard: If shareNotesWithAdmin is false, mask the raw note!
    const canShareNotes = targetUser.privacySettings?.shareNotesWithAdmin ?? true;

    const entries = rawEntries.map((entry) => ({
      _id: entry._id,
      userId: entry.userId,
      emotion: {
        primary: entry.emotion.primary,
        valenceScore: entry.emotion.valenceScore,
        intensityScore: entry.emotion.intensityScore,
        subEmotions: entry.emotion.subEmotions || [],
      },
      // Privacy-masked or plain note
      note: canShareNotes ? entry.note : '[REDACTED - USER PRIVACY SETTING ACTIVE]',
      noteMasked: !canShareNotes,
      tags: entry.tags,
      triggers: entry.triggers,
      loggedAt: entry.loggedAt,
      createdAt: entry.createdAt,
    }));

    // Overall metrics
    const totalEntries = entries.length;
    const overallAvgValence =
      totalEntries > 0
        ? Number(
            (
              entries.reduce((acc, curr) => acc + curr.emotion.valenceScore, 0) /
              totalEntries
            ).toFixed(2)
          )
        : 0;

    const overallAvgIntensity =
      totalEntries > 0
        ? Number(
            (
              entries.reduce((acc, curr) => acc + curr.emotion.intensityScore, 0) /
              totalEntries
            ).toFixed(2)
          )
        : 0;

    res.status(200).json({
      success: true,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        privacySettings: targetUser.privacySettings,
        notesSharedWithAdmin: canShareNotes,
      },
      period: periodQuery,
      dateRange: {
        from: startDate.toISOString(),
        to: now.toISOString(),
      },
      summary: {
        totalEntries,
        overallAvgValence,
        overallAvgIntensity,
        activeDays: dailyAggregations.length,
      },
      dailyAggregations,
      entries,
    });
  } catch (error) {
    next(error);
  }
};
