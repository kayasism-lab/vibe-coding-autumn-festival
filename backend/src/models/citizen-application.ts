import mongoose, { Schema } from 'mongoose'
import type { ICitizenApplication } from '../types/index.js'

const QnaSchema = new Schema(
  {
    author: { type: String, enum: ['admin', 'applicant'], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const CitizenApplicationSchema = new Schema<ICitizenApplication>(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    programType: { type: String, enum: ['reading', 'short_play'], required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    residence: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    practiceAvailable: { type: Boolean, required: true },
    respectAgreement: { type: Boolean, required: true },
    hasExperience: { type: Boolean, required: true },
    experienceDetail: { type: String, maxlength: 1000 },
    motivation: { type: String, required: true },
    password: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String },
    qna: { type: [QnaSchema], default: [] },
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
