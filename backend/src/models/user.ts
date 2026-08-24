import mongoose, { Schema } from 'mongoose'
import type { IUser } from '../types/index.js'

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    // 이메일 주소가 아니라 로그인 아이디로 사용한다 (대소문자 구분 없이 저장)
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // 연락처는 선택 항목 (로그인에 필요한 값이 아님)
    phone: { type: String, default: '' },
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
    // 개인정보 수집·이용 동의 기록. 관리자가 직접 만든 계정은 동의 절차를 거치지 않으므로
    // required로 두지 않고 기본값 false로 남긴다.
    privacyAgreed: { type: Boolean, default: false },
    ageConfirmed: { type: Boolean, default: false },
    agreedAt: { type: Date },
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
