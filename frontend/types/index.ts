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

// 어떤 자리에서 찍은 것인지 구분한다. 극단 구분과는 축이 다르므로 따로 둔다
export type GalleryCategory = 'festival' | 'general' | 'etc'

export interface IGallery {
  _id: string
  title: string
  description?: string
  type: GalleryType
  category: GalleryCategory
  url: string
  thumbnailUrl?: string
  programId?: string
  // 목록 API는 이름을 채워서 내려주고, 저장할 때는 ID 문자열만 보낸다
  theaterGroup?: string | { _id: string; name: string }
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

// 극단이 앞두고 있는 공연 한 건. 극단 소개 팝업에 노출된다.
// 'festival'은 사이트에 등록된 축제 프로그램을 가리키고(공연일은 회차에서 계산),
// 'external'은 축제와 무관한 자체 공연이라 공연일·예약 주소를 직접 받는다.
export type UpcomingShowKind = 'festival' | 'external'

export interface UpcomingShow {
  kind: UpcomingShowKind
  /** kind가 'festival'일 때 가리키는 축제 프로그램 id */
  programId?: string
  /** kind가 'external'일 때 직접 입력한 공연 시작일 */
  date?: string
  /** kind가 'external'일 때의 공연 종료일. 하루만 하는 공연이면 비워 둔다 */
  endDate?: string
  /** kind가 'external'일 때 이동할 예약/안내 주소 */
  url?: string
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
  upcomingShow?: UpcomingShow
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
