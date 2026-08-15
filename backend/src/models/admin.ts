import mongoose, { Schema } from 'mongoose'
import type { IAdmin } from '../types/index.js'

const AdminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'staff'],
      default: 'staff',
    },
    refreshToken: { type: String },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

export const Admin =
  mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema)
