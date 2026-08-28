import mongoose, { Schema } from 'mongoose'
import type { IGallery } from '../types/index.js'

const GallerySchema = new Schema<IGallery>(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['photo', 'video'],
      default: 'photo',
    },
    // 기존 자료는 구분이 없으므로 '기타'로 들어간다. 나중에 관리자가 골라 바꾸면 된다
    category: {
      type: String,
      enum: ['festival', 'general', 'etc'],
      default: 'etc',
    },
    // 사진이면 대표 이미지(images의 첫 장), 영상이면 영상 주소.
    // 예전 자료가 이 값만 갖고 있어서 그대로 둔다
    url: { type: String, required: true },
    // 사진 여러 장을 한 항목으로 묶는다. 목록에는 첫 장만 보이고,
    // 눌러서 크게 보면 나머지를 넘겨볼 수 있다
    images: [{ type: String }],
    // 목록에서 이 자료가 차지할 칸 모양. 사진마다 어울리는 비율이 달라
    // 전부 4:3으로 고정하면 세로 사진의 위아래가 크게 잘린다
    cardRatio: {
      type: String,
      enum: ['4:3', '16:9', '1:1', '3:4'],
      default: '4:3',
    },
    thumbnailUrl: { type: String },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
    },
    theaterGroup: {
      type: Schema.Types.ObjectId,
      ref: 'TheaterGroup',
    },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

GallerySchema.index({ type: 1 })
GallerySchema.index({ category: 1 })
GallerySchema.index({ theaterGroup: 1 })
GallerySchema.index({ programId: 1 })
GallerySchema.index({ order: 1 })

export const Gallery =
  mongoose.models.Gallery ||
  mongoose.model<IGallery>('Gallery', GallerySchema)
