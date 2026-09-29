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
    // 담당 공연 유형(낭독극/단막극). theaterGroup이 없는 계정만 이 값으로 소유권을 판정한다.
    programType: { type: String, enum: ['reading', 'short_play'] },
    // 관리자가 추가로 부여한 메뉴 권한 키 목록
    permissions: { type: [String], default: [] },
    // 연습일지 작성 계정(role: 'rehearsal')이 맡은 팀. 이 팀의 일지만 쓰고 고칠 수 있다
    rehearsalTeam: { type: Schema.Types.ObjectId, ref: 'RehearsalTeam' },
    // 처음 받은 비밀번호(아이디와 같은 값)를 아직 안 바꿨는지. true면 이름·비밀번호를 정하기 전까지
    // 연습일지를 쓸 수 없다 (아이디 규칙만 알면 누구나 로그인할 수 있기 때문)
    mustChangePassword: { type: Boolean, default: false },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'group', 'rehearsal', 'normal'],
      default: 'normal',
    },
    refreshToken: { type: String },
    lastLoginAt: { type: Date },
    // 마지막으로 관리 화면을 조작한 시각. 자리를 비운 사이 세션이 살아 있지 않도록
    // 여기서부터 일정 시간이 지나면 세션 연장을 거절한다
    lastActiveAt: { type: Date },
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
