import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export const PRIMARY_EMOTIONS = [
  'joy',
  'calm',
  'anxious',
  'sad',
  'angry',
  'exhausted',
  'overwhelmed',
] as const;

export type PrimaryEmotion = typeof PRIMARY_EMOTIONS[number];

export interface IEmotion {
  primary: PrimaryEmotion;
  valenceScore: number; // 1 to 5
  intensityScore: number; // 1 to 5
  subEmotions?: string[];
}

export interface IEntry {
  userId: Types.ObjectId;
  emotion: IEmotion;
  note: string;
  tags: string[];
  triggers: string[];
  loggedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEntryDocument extends IEntry, Document {}

const entrySchema = new Schema<IEntryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    emotion: {
      primary: {
        type: String,
        enum: {
          values: PRIMARY_EMOTIONS,
          message: '{VALUE} is not a valid primary emotion',
        },
        required: [true, 'Primary emotion is required'],
      },
      valenceScore: {
        type: Number,
        required: [true, 'Valence score is required (1: Very Negative to 5: Very Positive)'],
        min: [1, 'Valence score cannot be less than 1'],
        max: [5, 'Valence score cannot be greater than 5'],
      },
      intensityScore: {
        type: Number,
        default: 3,
        min: [1, 'Intensity score cannot be less than 1'],
        max: [5, 'Intensity score cannot be greater than 5'],
      },
      subEmotions: {
        type: [String],
        default: [],
      },
    },
    note: {
      type: String,
      default: '',
      maxlength: [5000, 'Note cannot exceed 5000 characters'],
    },
    tags: {
      type: [String],
      default: [],
    },
    triggers: {
      type: [String],
      default: [],
    },
    loggedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for optimal performance when querying a user's chronological entries
entrySchema.index({ userId: 1, loggedAt: -1 });

export const Entry: Model<IEntryDocument> = mongoose.model<IEntryDocument>('Entry', entrySchema);
