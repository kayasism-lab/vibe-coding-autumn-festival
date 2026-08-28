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
    // 작품을 소유한 극단. 극단 담당자 계정의 수정 권한 판정 기준.
    // 협의회가 직접 주관하는 프로그램(열린 낭독극·단막극)은 비워 둔다.
    theaterGroup: { type: Schema.Types.ObjectId, ref: 'TheaterGroup' },
    director: { type: String },
    cast: [{ type: String }],
    runtime: { type: Number, required: true },
    synopsis: { type: String, required: true },
    posterUrl: { type: String },
    // 홈 카드는 가로로 길어 세로 포스터의 위아래가 잘린다.
    // 관리자가 드래그로 정한 중심점을 담아 화면에서 object-position으로 쓴다.
    posterFocus: {
      x: { type: Number, min: 0, max: 100 },
      y: { type: Number, min: 0, max: 100 },
    },
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
ProgramSchema.index({ theaterGroup: 1 })
ProgramSchema.index({ isActive: 1 })
ProgramSchema.index({ order: 1 })

export const Program =
  mongoose.models.Program || mongoose.model<IProgram>('Program', ProgramSchema)
