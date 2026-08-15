import mongoose, { Schema } from 'mongoose'
import type { ISiteConfig } from '../types/index.js'

const SiteConfigSchema = new Schema<ISiteConfig>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
)

export const SiteConfig =
  mongoose.models.SiteConfig ||
  mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema)
