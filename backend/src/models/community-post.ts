import mongoose, { Schema } from 'mongoose'
import type { ICommunityPost } from '../types/index.js'

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrls: [{ type: String }],
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

CommunityPostSchema.index({ authorId: 1, createdAt: -1 })

export const CommunityPost =
  mongoose.models.CommunityPost ||
  mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema)
