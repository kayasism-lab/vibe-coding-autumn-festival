import mongoose, { Schema } from 'mongoose'
import type { IRehearsalTeam } from '../types/index.js'

// 연습일지의 팀 구성(열린 단막극·열린 낭독극). 관리 화면 '연습일지 설정'에서 만든다
const RehearsalTeamSchema = new Schema<IRehearsalTeam>(
  {
    // 낭독극을 더하기 전에 만든 팀에는 이 값이 없다. 읽을 때 단막극으로 본다(lib/rehearsal-access.ts의 teamKind)
    kind: { type: String, enum: ['short_play', 'reading'], default: 'short_play' },
    title: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    // 단막극은 연출, 낭독극은 메인강사
    director: { type: String, required: true, trim: true },
    assistantDirector: { type: String, default: '', trim: true },
    // 낭독극에서 메인강사와 함께하는 강사
    instructors: { type: [String], default: [] },
    members: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    // 팀원 계정 번호 (1이면 jik_short_1001~, 낭독극은 jik_reading_1001~). 계정을 일괄로 만들 때 정해진다
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
