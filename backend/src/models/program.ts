import mongoose, { Schema } from 'mongoose'
import type { IProgram } from '../types/index.js'

const ProgramSchema = new Schema<IProgram>(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['play', 'musical', 'short_play'],
      required: true,
    },
    company: { type: String, required: true },
    director: { type: String },
    cast: [{ type: String }],
    runtime: { type: Number, required: true },
    synopsis: { type: String, required: true },
    posterUrl: { type: String },
    galleryUrls: [{ type: String }],
    ticketUrl: { type: String },
    venue: { type: String, required: true },
    // 관람안내 페이지에서 지도 연결 버튼을 활성화하기 위한 실제 주소
    venueAddress: { type: String },
    ageRating: { type: String },
    price: {
      regular: { type: Number, required: true },
      discount: { type: Number },
    },
    openForApplication: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

ProgramSchema.index({ type: 1 })
ProgramSchema.index({ isActive: 1 })
ProgramSchema.index({ order: 1 })

export const Program =
  mongoose.models.Program || mongoose.model<IProgram>('Program', ProgramSchema)
