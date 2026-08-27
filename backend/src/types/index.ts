import type { Document, Types } from 'mongoose'

// Program (공연)
export type ProgramType = 'play' | 'short_play' | 'reading'

export interface IProgram extends Document {
  _id: Types.ObjectId
  title: string
  type: ProgramType
  // 표시용 극단명(협의회 직접 주관 프로그램도 있으므로 문자열은 계속 유지)
  company: string
  // 이 작품을 소유한 극단. 극단 담당자 계정의 수정 권한 판정 기준이 된다.
  // 협의회가 직접 주관하는 프로그램(열린 낭독극 등)은 비워 둔다.
  theaterGroup?: Types.ObjectId
  director?: string
  cast: string[]
  runtime: number
  synopsis: string
  posterUrl?: string
  galleryUrls: string[]
  // 축제 팜플렛(리플렛) 스캔 이미지 - 공연 사진(galleryUrls)과는 별개
  pamphletUrls: string[]
  // 시놉시스 외에 관리자가 자유롭게 남기는 추가 안내글(연출의도, 관전 포인트 등)
  detailContent?: string
  ticketUrl?: string
  venue: string
  venueAddress?: string
  ageRating?: string
  price: {
    regular: number
    discount?: number
  }
  // 열린 낭독극/열린 단막극처럼 시민 공개모집 신청을 받는 프로그램인지 여부
  openForApplication: boolean
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

// Schedule (일정)
// 회차별 예매 상태. 'limited'(잔여석 적음)는 2026-08-28에 없앴다.
// 예전 값이 남은 문서를 막지 않으려고 모델 enum에는 'limited'를 남겨둔다.
export type SeatStatus = 'available' | 'pending' | 'soldout' | 'ended'

export interface ISchedule extends Document {
  _id: Types.ObjectId
  programId: Types.ObjectId
  date: Date
  time: string
  venue: string
  seatStatus: SeatStatus
  note?: string
  createdAt: Date
}

// Notice (공지/홍보 게시판)
export type NoticeCategory = 'notice' | 'press' | 'event' | 'media'

export interface INotice extends Document {
  _id: Types.ObjectId
  title: string
  content: string
  category: NoticeCategory
  imageUrls: string[]
  isPinned: boolean
  viewCount: number
  createdAt: Date
  updatedAt: Date
}

// Inquiry (문의 게시판)
export type InquiryStatus = 'pending' | 'answered'

export interface IInquiry extends Document {
  _id: Types.ObjectId
  name: string
  email: string
  phone?: string
  title: string
  content: string
  password: string
  isPrivate: boolean
  // 개인정보 수집·이용 동의 기록.
  // 동의를 받았다는 사실의 입증 책임이 운영자에게 있어 동의 여부와 시각을 함께 남긴다.
  privacyAgreed: boolean
  ageConfirmed: boolean
  agreedAt?: Date
  status: InquiryStatus
  reply?: {
    content: string
    repliedAt: Date
  }
  createdAt: Date
}

// Gallery (갤러리)
export type GalleryType = 'photo' | 'video'

export interface IGallery extends Document {
  _id: Types.ObjectId
  title: string
  description?: string
  type: GalleryType
  url: string
  thumbnailUrl?: string
  programId?: Types.ObjectId
  order: number
  createdAt: Date
}

// Sponsor (후원사)
export type SponsorTier = 'main' | 'gold' | 'silver' | 'partner'

export interface ISponsor extends Document {
  _id: Types.ObjectId
  name: string
  logoUrl: string
  websiteUrl?: string
  tier: SponsorTier
  order: number
  createdAt: Date
}

// User (사용자)
// group: 극단별 담당자 계정 - 본인 소속 극단(theaterGroupName과 일치하는 TheaterGroup/Program)만 관리 가능
export type UserRole = 'superadmin' | 'admin' | 'group' | 'normal'

export interface IUser extends Document {
  _id: Types.ObjectId
  name: string
  email: string
  phone: string
  // 표시용 극단명. 소유권 판정은 theaterGroup(ObjectId)을 우선 사용한다.
  theaterGroupName: string
  // 담당 극단 참조. 극단명이 바뀌어도 권한이 끊기지 않도록 ID로 연결한다.
  theaterGroup?: Types.ObjectId
  // 관리자가 추가로 부여한 메뉴 권한 (기본 권한은 코드 상수로 관리하므로 저장하지 않음)
  permissions: string[]
  password: string
  role: UserRole
  refreshToken?: string
  lastLoginAt?: Date
  // 개인정보 수집·이용 동의 기록 (가입 시점에 받은 동의를 입증하기 위해 보관)
  privacyAgreed: boolean
  ageConfirmed: boolean
  agreedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Admin (관리자, legacy)
export type AdminRole = 'superadmin' | 'admin' | 'staff'

export interface IAdmin extends Document {
  _id: Types.ObjectId
  email: string
  password: string
  name: string
  role: AdminRole
  refreshToken?: string
  lastLoginAt?: Date
  createdAt: Date
}

// TheaterGroup (참여 극단)
// 극단이 앞두고 있는 공연 한 건. 극단 소개 팝업에 노출된다.
// 'festival'은 이 사이트에 등록된 축제 프로그램을 가리키고(공연일은 회차에서 계산),
// 'external'은 축제와 무관한 자체 공연이라 공연일과 예약 주소를 직접 받는다.
export interface IUpcomingShow {
  kind: 'festival' | 'external'
  /** kind가 'festival'일 때 가리키는 축제 프로그램 */
  programId?: Types.ObjectId
  /** kind가 'external'일 때 직접 입력하는 공연일 */
  date?: Date
  /** kind가 'external'일 때 이동할 예약/안내 주소 */
  url?: string
}

export interface ITheaterGroup extends Document {
  _id: Types.ObjectId
  name: string
  description: string
  founded?: string
  members?: string
  imageUrl?: string
  highlights: string[]
  socialLinks: {
    website?: string
    instagram?: string
    facebook?: string
    youtube?: string
    blog?: string
  }
  videoUrl?: string
  photos?: string[]
  upcomingShow?: IUpcomingShow
  color: string
  bgGradient: string
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Venue (공연장)
export interface IVenue extends Document {
  _id: Types.ObjectId
  name: string
  address: string
  description?: string
  imageUrls: string[]
  capacity: number
  facilities: string[]
  mapUrl?: string
  contactPhone?: string
  order: number
  isActive: boolean
  createdAt: Date
}

// Application (참가 신청)
export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface IApplication extends Document {
  _id: Types.ObjectId
  groupName: string
  representative: string
  email: string
  phone: string
  memberCount: number
  attachmentUrls: string[]
  status: ApplicationStatus
  adminNote?: string
  createdAt: Date
  updatedAt: Date
}

// CitizenApplication (시민참여 열린 낭독극/열린 단막극 개인 신청)
export type CitizenApplicationStatus = 'pending' | 'approved' | 'rejected'
export type CitizenApplicationProgramType = 'reading' | 'short_play'

export interface ICitizenApplicationQna {
  author: 'admin' | 'applicant'
  message: string
  createdAt: Date
}

export interface ICitizenApplication extends Document {
  _id: Types.ObjectId
  programId: Types.ObjectId
  programType: CitizenApplicationProgramType
  name: string
  phone: string
  email: string
  residence: string
  age: number
  gender: 'male' | 'female'
  // 낭독극=주2회, 단막극=주3회 연습 참여 가능 여부 (질문 라벨은 programType으로 분기)
  practiceAvailable: boolean
  respectAgreement: boolean
  hasExperience: boolean
  experienceDetail?: string
  motivation: string
  password: string
  // 개인정보 수집·이용 동의 기록.
  // 연령은 age 필드로 직접 확인하므로 별도의 연령 확인 체크는 두지 않는다.
  privacyAgreed: boolean
  agreedAt?: Date
  status: CitizenApplicationStatus
  adminNote?: string
  // 심사중 상태에서 관리자-신청자가 주고받는 문의/답변 이력
  qna: ICitizenApplicationQna[]
  createdAt: Date
  updatedAt: Date
}

// SiteConfig (사이트 설정)
export interface ISiteConfig extends Document {
  _id: Types.ObjectId
  key: string
  value: Record<string, unknown>
  updatedAt: Date
}

// Community (커뮤니티)
export interface ICommunityPost extends Document {
  _id: Types.ObjectId
  title: string
  content: string
  imageUrls: string[]
  authorId: Types.ObjectId
  authorName: string
  createdAt: Date
  updatedAt: Date
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Schedule with Program (populated)
export interface ScheduleWithProgram extends Omit<ISchedule, 'programId'> {
  programId: IProgram
}

// Frontend Display Types
export interface ProgramCardData {
  id: string
  title: string
  type: ProgramType
  company: string
  posterUrl?: string
  venue: string
  ticketUrl?: string
  schedules?: {
    date: string
    time: string
  }[]
}

export interface ScheduleDisplayData {
  id: string
  programTitle: string
  programType: ProgramType
  company: string
  posterUrl?: string
  date: string
  time: string
  venue: string
  seatStatus: SeatStatus
  ticketUrl?: string
}
