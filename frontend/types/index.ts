// Program (공연)
export type ProgramType = 'play' | 'short_play' | 'reading'

export interface IProgram {
  _id: string
  title: string
  type: ProgramType
  company: string
  director?: string
  cast: string[]
  runtime: number
  synopsis: string
  posterUrl?: string
  galleryUrls: string[]
  pamphletUrls: string[]
  detailContent?: string
  ticketUrl?: string
  venue: string
  price: {
    regular: number
    discount?: number
  }
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

// Schedule (일정)
// 회차별 예매 상태. 관리자 화면에서 회차마다 직접 고른다.
// 'limited'(잔여석 적음)는 2026-08-28에 없앴지만, 예전에 저장된 값이 남아 있을 수 있어
// 화면에서는 resolveSeatStatus()로 걸러 쓴다. (lib/program-display.ts)
export type SeatStatus = 'available' | 'pending' | 'soldout' | 'ended'

export interface ISchedule {
  _id: string
  programId: string
  date: Date
  time: string
  venue: string
  seatStatus: SeatStatus
  note?: string
  createdAt: Date
}

// Notice (공지/홍보 게시판)
export type NoticeCategory = 'notice' | 'press' | 'event' | 'media'

export interface INotice {
  _id: string
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

export interface IInquiry {
  _id: string
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

export interface IGallery {
  _id: string
  title: string
  description?: string
  type: GalleryType
  url: string
  thumbnailUrl?: string
  programId?: string
  order: number
  createdAt: Date
}

// Sponsor (후원사)
export type SponsorTier = 'main' | 'gold' | 'silver' | 'partner'

export interface ISponsor {
  _id: string
  name: string
  logoUrl: string
  websiteUrl?: string
  tier: SponsorTier
  order: number
  createdAt: Date
}

// Admin (관리자)
export type AdminRole = 'superadmin' | 'admin' | 'staff'

export interface IAdmin {
  _id: string
  email: string
  password: string
  name: string
  role: AdminRole
  refreshToken?: string
  lastLoginAt?: Date
  createdAt: Date
}

// TheaterGroup (참여 극단)
export interface ITheaterGroup {
  _id: string
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
  color: string
  bgGradient: string
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Venue (공연장)
export interface IVenue {
  _id: string
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

export interface IApplication {
  _id: string
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

// SiteConfig (사이트 설정)
export interface ISiteConfig {
  _id: string
  key: string
  value: Record<string, unknown>
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
