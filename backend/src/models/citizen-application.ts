import mongoose, { Schema } from 'mongoose'
import type { ICitizenApplication } from '../types/index.js'

const CitizenApplicationSchema = new Schema<ICitizenApplication>(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    region: {
      sido: { type: String, required: true },
      gu: { type: String, required: true },
    },
    motivation: { type: String, required: true },
    experience: { type: String },
    password: { type: String, required: true },
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

CitizenApplicationSchema.index({ programId: 1 })
CitizenApplicationSchema.index({ phone: 1 })
CitizenApplicationSchema.index({ status: 1 })

export const CitizenApplication =
  mongoose.models.CitizenApplication ||
  mongoose.model<ICitizenApplication>('CitizenApplication', CitizenApplicationSchema)
