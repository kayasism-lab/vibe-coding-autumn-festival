import mongoose, { Schema } from 'mongoose'
import type { ICitizenApplication } from '../types/index.js'

const QnaSchema = new Schema(
  {
    author: { type: String, enum: ['admin', 'applicant'], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

// 접수 시점의 질문 문구를 그대로 담아두는 자리
const AnsweredQuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, required: true },
    options: { type: [String], default: undefined },
  },
  { _id: false }
)

const CitizenApplicationSchema = new Schema<ICitizenApplication>(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    programType: { type: String, enum: ['reading', 'short_play'], required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    residence: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    // 2026-09-06 신청서에서 뺀 항목. 예전 신청서를 열어볼 수 있게 필수 조건만 풀고 필드는 남긴다
    practiceAvailable: { type: Boolean },
    // 아래 항목은 기본 질문의 답이 저장되는 자리다.
    // 담당자가 관리 화면에서 질문을 지울 수 있게 되면서 required를 풀었다.
    // 필수 입력 여부는 이제 작품에 저장된 질문 정의(required)를 보고 접수 API에서 검증한다
    unavailableSchedules: { type: [String], default: [] },
    respectAgreement: { type: Boolean },
    hasExperience: { type: Boolean },
    experienceDetail: { type: String, maxlength: 1000 },
    motivation: { type: String },
    // 담당자가 만든 질문의 답 전체 (질문 id -> 답).
    // 질문마다 답의 모양(참/거짓·문자열·배열)이 달라 Mixed로 둔다
    answers: { type: Schema.Types.Mixed, default: {} },
    // 접수 당시의 질문 문구 스냅샷. 담당자가 나중에 질문을 고쳐도 답을 해석할 수 있게 남긴다
    answeredQuestions: { type: [AnsweredQuestionSchema], default: [] },
    password: { type: String, required: true },
    // 개인정보 수집·이용 동의 기록. 연령은 age 필드로 확인하므로 연령 확인 항목은 두지 않는다.
    privacyAgreed: { type: Boolean, default: false },
    agreedAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String },
    qna: { type: [QnaSchema], default: [] },
  },
  {
    timestamps: true,
  }
)

CitizenApplicationSchema.index({ programId: 1 })
CitizenApplicationSchema.index({ phone: 1 })
CitizenApplicationSchema.index({ status: 1 })

export const CitizenApplication =
  mongoose.models.CitizenApplication ||
  mongoose.model<ICitizenApplication>('CitizenApplication', CitizenApplicationSchema)
