import mongoose, { Schema } from 'mongoose'
import type { IApplication } from '../types/index.js'

const ApplicationSchema = new Schema<IApplication>(
  {
    groupName: { type: String, required: true },
    representative: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    memberCount: { type: Number, required: true },
    attachmentUrls: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String },
  },
  {
    timestamps: true,
  }
)

ApplicationSchema.index({ status: 1 })
ApplicationSchema.index({ createdAt: -1 })

export const Application =
  mongoose.models.Application ||
  mongoose.model<IApplication>('Application', ApplicationSchema)
