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
