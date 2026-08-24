import mongoose, { Schema } from 'mongoose'
import type { IInquiry } from '../types/index.js'

const InquirySchema = new Schema<IInquiry>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    title: { type: String, required: true },
    content: { type: String, required: true },
    password: { type: String, required: true },
    isPrivate: { type: Boolean, default: false },
    // 개인정보 수집·이용 동의 기록. 이 기능이 생기기 전에 접수된 문의는 값이 false로 남는다
    // (동의를 받지 않았다는 사실 그대로를 보존하기 위해 required로 두지 않는다).
    privacyAgreed: { type: Boolean, default: false },
    ageConfirmed: { type: Boolean, default: false },
    agreedAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'answered'],
      default: 'pending',
    },
    reply: {
      content: { type: String },
      repliedAt: { type: Date },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

InquirySchema.index({ status: 1 })
InquirySchema.index({ createdAt: -1 })

export const Inquiry =
  mongoose.models.Inquiry ||
  mongoose.model<IInquiry>('Inquiry', InquirySchema)
