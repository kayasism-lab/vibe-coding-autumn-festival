import mongoose, { Schema } from 'mongoose'
import type { IGallery } from '../types/index.js'

const GallerySchema = new Schema<IGallery>(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['photo', 'video'],
      default: 'photo',
    },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
    },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

GallerySchema.index({ type: 1 })
GallerySchema.index({ programId: 1 })
GallerySchema.index({ order: 1 })

export const Gallery =
  mongoose.models.Gallery ||
  mongoose.model<IGallery>('Gallery', GallerySchema)
