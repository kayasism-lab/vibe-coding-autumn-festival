import mongoose, { Schema } from 'mongoose'
import type { IRehearsalTeam } from '../types/index.js'

// 열린 단막극 연습일지의 팀 구성. 관리 화면 '연습일지 설정'에서 만든다
const RehearsalTeamSchema = new Schema<IRehearsalTeam>(
  {
    title: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    director: { type: String, required: true, trim: true },
    assistantDirector: { type: String, default: '', trim: true },
    members: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    // 팀원 계정 번호 (1이면 jik_short_1001~). 계정을 일괄로 만들 때 정해진다
    accountSeries: { type: Number },
  },
  {
    timestamps: true,
  }
)

RehearsalTeamSchema.index({ order: 1, createdAt: 1 })

export const RehearsalTeam =
  mongoose.models.RehearsalTeam ||
  mongoose.model<IRehearsalTeam>('RehearsalTeam', RehearsalTeamSchema)
