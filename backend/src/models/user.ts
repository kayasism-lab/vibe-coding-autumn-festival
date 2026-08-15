import mongoose, { Schema } from 'mongoose'
import type { IUser } from '../types/index.js'

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    theaterGroupName: { type: String, required: true, default: '없음' },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'group', 'normal'],
      default: 'normal',
    },
    refreshToken: { type: String },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
)

UserSchema.index({ email: 1 })
UserSchema.index({ role: 1 })

export const User =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
