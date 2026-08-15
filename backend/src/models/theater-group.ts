import mongoose, { Schema } from 'mongoose'
import type { ITheaterGroup } from '../types/index.js'

const TheaterGroupSchema = new Schema<ITheaterGroup>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    founded: { type: String },
    members: { type: String },
    imageUrl: { type: String },
    highlights: [{ type: String }],
    socialLinks: {
      website: { type: String },
      instagram: { type: String },
      facebook: { type: String },
      youtube: { type: String },
      blog: { type: String },
    },
    color: { type: String, default: 'bg-primary' },
    bgGradient: { type: String, default: 'from-primary to-primary/80' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
)

TheaterGroupSchema.index({ order: 1 })
TheaterGroupSchema.index({ isActive: 1 })

export const TheaterGroup =
  mongoose.models.TheaterGroup ||
  mongoose.model<ITheaterGroup>('TheaterGroup', TheaterGroupSchema)
