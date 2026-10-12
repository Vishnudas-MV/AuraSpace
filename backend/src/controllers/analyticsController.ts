import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Entry } from '../models/Entry';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

/**
 * Helper to compute dominant emotion from a list of emotion strings
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
 * GET /api/analytics/trends?period=7d|30d
 * Aggregate daily average valence, intensity, entry count, and dominant emotion
 */
export const getTrends = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized: User context required.', 401);
    }

    const periodQuery = (req.query.period as string)?.toLowerCase() || '7d';
    const days = periodQuery === '30d' ? 30 : 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    // MongoDB Aggregation Pipeline for Daily Grouping
    const dailyStats = await Entry.aggregate([
      {
        $match: {
          userId: userObjectId,
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

    // Format daily items and calculate dominant emotion per day
    const trends = dailyStats.map((item) => {
      const dominant = calculateDominantEmotion(item.emotions);
      return {
        date: item._id,
        entryCount: item.entryCount,
        avgValence: Number(item.avgValence.toFixed(2)),
        avgIntensity: Number(item.avgIntensity.toFixed(2)),
        dominantEmotion: dominant.emotion,
        dominantEmotionCount: dominant.count,
        emotionsRecorded: item.emotions,
      };
    });

    // Overall summary for the period
    const totalEntries = trends.reduce((acc, curr) => acc + curr.entryCount, 0);
    const overallAvgValence =
      totalEntries > 0
        ? Number(
            (
              trends.reduce((acc, curr) => acc + curr.avgValence * curr.entryCount, 0) /
              totalEntries
            ).toFixed(2)
          )
        : 0;
    const overallAvgIntensity =
      totalEntries > 0
        ? Number(
            (
              trends.reduce((acc, curr) => acc + curr.avgIntensity * curr.entryCount, 0) /
              totalEntries
            ).toFixed(2)
          )
        : 0;

    res.status(200).json({
      success: true,
      period: periodQuery === '30d' ? '30d' : '7d',
      startDate: startDate.toISOString(),
      summary: {
        totalEntries,
        overallAvgValence,
        overallAvgIntensity,
        activeDays: trends.length,
      },
      trends,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/distribution
 * Aggregate counts per primary emotion for chart rendering (Pie / Bar charts)
 */
export const getDistribution = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized: User context required.', 401);
    }

    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    // Aggregation pipeline to group by primary emotion
    const distributionResults = await Entry.aggregate([
      {
        $match: {
          userId: userObjectId,
        },
      },
      {
        $group: {
          _id: '$emotion.primary',
          count: { $sum: 1 },
          avgValence: { $avg: '$emotion.valenceScore' },
          avgIntensity: { $avg: '$emotion.intensityScore' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const totalEntries = distributionResults.reduce((sum, item) => sum + item.count, 0);

    const distribution = distributionResults.map((item) => ({
      emotion: item._id,
      count: item.count,
      percentage: totalEntries > 0 ? Number(((item.count / totalEntries) * 100).toFixed(1)) : 0,
      avgValence: Number(item.avgValence.toFixed(2)),
      avgIntensity: Number(item.avgIntensity.toFixed(2)),
    }));

    res.status(200).json({
      success: true,
      totalEntries,
      distribution,
    });
  } catch (error) {
    next(error);
  }
};
