import mongoose, { Schema } from 'mongoose'
import type { IRehearsalComment } from '../types/index.js'

// 연습일지 댓글. 일지 문서 안에 넣지 않고 따로 두어,
// 일지를 고칠 때 덮어쓰기로 댓글이 사라지는 일이 없게 한다
const RehearsalCommentSchema = new Schema<IRehearsalComment>(
  {
    log: { type: Schema.Types.ObjectId, ref: 'RehearsalLog', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, default: '' },
    content: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

// 일지 한 건의 댓글을 쓴 순서대로 읽는다
RehearsalCommentSchema.index({ log: 1, createdAt: 1 })

export const RehearsalComment =
  mongoose.models.RehearsalComment ||
  mongoose.model<IRehearsalComment>('RehearsalComment', RehearsalCommentSchema)
