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
    // 보도자료 원문 주소. 기사 본문을 옮겨 담는 대신 원문으로 보내주기 위한 값
    sourceUrl: { type: String },
    /** 원문을 실은 곳 이름 (예: 연합뉴스) */
    sourceName: { type: String },
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
