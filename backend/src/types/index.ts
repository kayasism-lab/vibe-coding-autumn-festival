import type { Document, Types } from 'mongoose'

// Program (공연)
export type ProgramType = 'play' | 'short_play' | 'reading'

export interface IProgram extends Document {
  _id: Types.ObjectId
  title: string
  type: ProgramType
  company: string
  director?: string
  cast: string[]
  runtime: number
  synopsis: string
  posterUrl?: string
  galleryUrls: string[]
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
export type SeatStatus = 'available' | 'limited' | 'soldout'

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
  theaterGroupName: string
  password: string
  role: UserRole
  refreshToken?: string
  lastLoginAt?: Date
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
  playTitle: string
  playType: 'play' | 'musical' | 'short_play'
  runtime: number
  synopsis: string
  memberCount: number
  attachmentUrls: string[]
  status: ApplicationStatus
  adminNote?: string
  createdAt: Date
  updatedAt: Date
}

// CitizenApplication (시민참여 열린 낭독극/열린 단막극 개인 신청)
export type CitizenApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface ICitizenApplication extends Document {
  _id: Types.ObjectId
  programId: Types.ObjectId
  name: string
  phone: string
  email: string
  region: {
    sido: string
    gu: string
  }
  motivation: string
  experience?: string
  password: string
  status: CitizenApplicationStatus
  adminNote?: string
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
