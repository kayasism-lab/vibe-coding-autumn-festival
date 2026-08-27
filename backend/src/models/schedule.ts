import mongoose, { Schema } from 'mongoose'
import type { ISchedule } from '../types/index.js'

const ScheduleSchema = new Schema<ISchedule>(
  {
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    venue: { type: String, required: true },
    seatStatus: {
      type: String,
      // 'limited'는 더 이상 고를 수 없지만, 예전에 저장된 문서를 수정할 때
      // 유효성 검사에 걸려 저장이 막히지 않도록 목록에는 남겨둔다.
      enum: ['available', 'pending', 'soldout', 'ended', 'limited'],
      // 예매 사이트가 열리기 전에 등록되는 회차가 '예약가능'으로 보이면 안 되므로
      // 새로 만드는 회차는 '예매대기'에서 시작한다.
      default: 'pending',
    },
    note: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

ScheduleSchema.index({ programId: 1 })
ScheduleSchema.index({ date: 1 })
ScheduleSchema.index({ date: 1, time: 1 })

export const Schedule =
  mongoose.models.Schedule ||
  mongoose.model<ISchedule>('Schedule', ScheduleSchema)
