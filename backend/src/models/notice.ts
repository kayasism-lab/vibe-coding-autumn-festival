import mongoose, { Schema } from 'mongoose'
import type { INotice } from '../types/index.js'

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['notice', 'press', 'event', 'media'],
      default: 'notice',
    },
    imageUrls: [{ type: String }],
    isPinned: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

NoticeSchema.index({ category: 1 })
NoticeSchema.index({ isPinned: -1, createdAt: -1 })
NoticeSchema.index({ title: 'text', content: 'text' })

export const Notice =
  mongoose.models.Notice || mongoose.model<INotice>('Notice', NoticeSchema)
