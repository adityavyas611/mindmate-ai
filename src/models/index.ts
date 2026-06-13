import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { AIAnalysis } from "@/schemas";

export interface ICheckIn extends Document {
  userId: string;
  encryptedJournal: string;
  moodScore: number;
  energyLevel: number;
  sleepHours: number;
  studyHours: number;
  examType: string;
  daysRemaining: number;
  confidenceLevel: number;
  anxietyLevel: number;
  analysis?: AIAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

const CheckInSchema = new Schema<ICheckIn>(
  {
    userId: { type: String, required: true, index: true },
    encryptedJournal: { type: String, required: true },
    moodScore: { type: Number, required: true, min: 1, max: 10 },
    energyLevel: { type: Number, required: true, min: 1, max: 10 },
    sleepHours: { type: Number, required: true, min: 0, max: 24 },
    studyHours: { type: Number, required: true, min: 0, max: 24 },
    examType: { type: String, required: true },
    daysRemaining: { type: Number, required: true, min: 0 },
    confidenceLevel: { type: Number, required: true, min: 1, max: 10 },
    anxietyLevel: { type: Number, required: true, min: 1, max: 10 },
    analysis: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

CheckInSchema.index({ userId: 1, createdAt: -1 });

export const CheckIn: Model<ICheckIn> =
  mongoose.models.CheckIn ?? mongoose.model<ICheckIn>("CheckIn", CheckInSchema);

export interface IUserProfile extends Document {
  userId: string;
  examType?: string;
  examGoal?: string;
  motivationalPreferences?: string;
  knownStressTriggers: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    examType: { type: String },
    examGoal: { type: String },
    motivationalPreferences: { type: String },
    knownStressTriggers: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const UserProfile: Model<IUserProfile> =
  mongoose.models.UserProfile ??
  mongoose.model<IUserProfile>("UserProfile", UserProfileSchema);

export interface IChatMessage extends Document {
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ userId: 1, createdAt: -1 });

export const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage ??
  mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
