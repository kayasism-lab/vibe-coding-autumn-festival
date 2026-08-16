import mongoose, { Schema } from 'mongoose'
import type { IUser } from '../types/index.js'

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    theaterGroupName: { type: String, required: true, default: '없음' },
    // 극단 담당자 계정이 관리할 극단(ID 참조). 이름이 바뀌어도 연결이 유지된다.
    theaterGroup: { type: Schema.Types.ObjectId, ref: 'TheaterGroup' },
    // 관리자가 추가로 부여한 메뉴 권한 키 목록
    permissions: { type: [String], default: [] },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'group', 'normal'],
      default: 'normal',
    },
    refreshToken: { type: String },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
)

UserSchema.index({ email: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ theaterGroup: 1 })

export const User =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
