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
      enum: ['available', 'limited', 'soldout'],
      default: 'available',
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
