import mongoose, { Schema } from 'mongoose'
import type { IRehearsalLog } from '../types/index.js'

// 연습일지 한 건 (단막극·낭독극 공통. 어느 쪽인지는 팀의 kind로 정해진다).
// '#N번째 연습'은 저장하지 않고 조회할 때 날짜순으로 센다. 날짜를 고치거나
// 중간 일지를 지워도 번호가 저절로 맞춰진다
const RehearsalLogSchema = new Schema<IRehearsalLog>(
  {
    team: { type: Schema.Types.ObjectId, ref: 'RehearsalTeam', required: true },
    date: { type: String, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    roster: { type: [String], default: [] },
    attendees: { type: [String], default: [] },
    topic: { type: String, default: '' },
    content: { type: String, default: '' },
    directorComment: { type: String, default: '' },
    photos: { type: [String], default: [] },
    createdByName: { type: String, default: '' },
    updatedByName: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
)

// 팀별로 날짜순 정렬해 번호를 매기므로 이 순서의 색인을 둔다
RehearsalLogSchema.index({ team: 1, date: 1, startTime: 1, createdAt: 1 })

export const RehearsalLog =
  mongoose.models.RehearsalLog ||
  mongoose.model<IRehearsalLog>('RehearsalLog', RehearsalLogSchema)
