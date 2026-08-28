import mongoose, { Schema } from 'mongoose'
import type { INotice } from '../types/index.js'

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['notice', 'press', 'event', 'media'],
      default: 'notice',
    },
    imageUrls: [{ type: String }],
    // 실제로 알려진 날짜. 예전 보도자료를 뒤늦게 올릴 때 그 시절 날짜로 넣을 수 있도록
    // 등록 시각(createdAt)과 따로 둔다. 목록 정렬과 연도 구분은 이 값을 기준으로 한다
    publishedAt: { type: Date, default: Date.now },
    isPinned: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

NoticeSchema.index({ category: 1 })
NoticeSchema.index({ isPinned: -1, publishedAt: -1 })
NoticeSchema.index({ isPinned: -1, createdAt: -1 })
NoticeSchema.index({ title: 'text', content: 'text' })

export const Notice =
  mongoose.models.Notice || mongoose.model<INotice>('Notice', NoticeSchema)
