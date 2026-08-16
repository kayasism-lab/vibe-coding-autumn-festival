import mongoose, { Schema } from 'mongoose'
import type { IProgram } from '../types/index.js'

const ProgramSchema = new Schema<IProgram>(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['play', 'short_play', 'reading'],
      required: true,
    },
    company: { type: String, required: true },
    director: { type: String },
    cast: [{ type: String }],
    runtime: { type: Number, required: true },
    synopsis: { type: String, required: true },
    posterUrl: { type: String },
    galleryUrls: [{ type: String }],
    // 축제 팜플렛(리플렛) 스캔 이미지 - 공연 사진(galleryUrls)과는 별개
    pamphletUrls: [{ type: String }],
    // 시놉시스 외에 관리자가 자유롭게 남기는 추가 안내글(연출의도, 관전 포인트 등)
    detailContent: { type: String },
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
