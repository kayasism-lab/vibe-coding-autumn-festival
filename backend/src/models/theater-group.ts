import mongoose, { Schema } from 'mongoose'
import type { ITheaterGroup } from '../types/index.js'

const TheaterGroupSchema = new Schema<ITheaterGroup>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    founded: { type: String },
    members: { type: String },
    imageUrl: { type: String },
    highlights: [{ type: String }],
    socialLinks: {
      website: { type: String },
      instagram: { type: String },
      facebook: { type: String },
      youtube: { type: String },
      blog: { type: String },
    },
    // 극단이 직접 업로드하는 공연 준비 영상(유튜브 등 외부 URL)과 사진들
    videoUrl: { type: String },
    photos: [{ type: String }],
    // 앞두고 있는 공연 한 건. 등록하지 않으면 팝업에 아무것도 뜨지 않는다.
    // 축제 공연(festival)은 공연일을 저장하지 않고 회차에서 계산해 쓰므로,
    // 회차 날짜가 바뀌어도 따로 고칠 필요가 없다.
    upcomingShow: {
      kind: { type: String, enum: ['festival', 'external'] },
      programId: { type: Schema.Types.ObjectId, ref: 'Program' },
      date: { type: Date },
      // 하루만 하는 공연이면 비어 있다 (시작일만으로 표시)
      endDate: { type: Date },
      url: { type: String },
    },
    color: { type: String, default: 'bg-primary' },
    bgGradient: { type: String, default: 'from-primary to-primary/80' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
)

TheaterGroupSchema.index({ order: 1 })
TheaterGroupSchema.index({ isActive: 1 })

export const TheaterGroup =
  mongoose.models.TheaterGroup ||
  mongoose.model<ITheaterGroup>('TheaterGroup', TheaterGroupSchema)
