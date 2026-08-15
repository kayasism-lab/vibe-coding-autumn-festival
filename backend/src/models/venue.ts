import mongoose, { Schema } from 'mongoose'
import type { IVenue } from '../types/index.js'

const VenueSchema = new Schema<IVenue>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String },
    imageUrls: [{ type: String }],
    capacity: { type: Number, required: true },
    facilities: [{ type: String }],
    mapUrl: { type: String },
    contactPhone: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

VenueSchema.index({ order: 1 })
VenueSchema.index({ isActive: 1 })

export const Venue =
  mongoose.models.Venue || mongoose.model<IVenue>('Venue', VenueSchema)
