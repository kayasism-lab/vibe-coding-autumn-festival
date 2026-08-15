import mongoose, { Schema } from 'mongoose'
import type { ISponsor } from '../types/index.js'

const SponsorSchema = new Schema<ISponsor>(
  {
    name: { type: String, required: true },
    logoUrl: { type: String, required: true },
    websiteUrl: { type: String },
    tier: {
      type: String,
      enum: ['main', 'gold', 'silver', 'partner'],
      default: 'partner',
    },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

SponsorSchema.index({ tier: 1, order: 1 })

export const Sponsor =
  mongoose.models.Sponsor ||
  mongoose.model<ISponsor>('Sponsor', SponsorSchema)
