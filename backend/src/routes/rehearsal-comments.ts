import { Router } from 'express'
import mongoose from 'mongoose'
import { RehearsalComment, RehearsalLog, User } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireRehearsalAccess } from '../middleware/require-rehearsal.js'
import type { RehearsalAccess } from '../lib/rehearsal-access.js'
import { cleanText } from '../lib/rehearsal-input.js'

/**
 * 연습일지 댓글 (/rehearsal-logs/:logId/comments).
 * 연습일지를 볼 수 있는 계정이면 다른 팀 일지에도 댓글을 달 수 있다.
 * 지우기는 쓴 본인과 관리자(canDelete)만 한다
 */
export const rehearsalCommentsRouter = Router({ mergeParams: true })

rehearsalCommentsRouter.use(requireRehearsalAccess)

type LeanComment = {
  _id: mongoose.Types.ObjectId
  author: mongoose.Types.ObjectId
  authorName: string
  content: string
  createdAt: Date
}

/** 주소의 일지 id가 올바르고 실제로 있는지 확인한다 */
async function findLogId(logId: string | undefined) {
  if (!logId || !mongoose.isValidObjectId(logId)) return null
  const log = await RehearsalLog.findById(logId).select('_id').lean()
  return log ? logId : null
}

rehearsalCommentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const logId = await findLogId(req.params.logId)
    if (!logId) {
      fail(res, '연습일지를 찾을 수 없습니다.', 404)
      return
    }
    const comments = await RehearsalComment.find({ log: logId }).sort({ createdAt: 1 }).lean<LeanComment[]>()

    // 이름은 지금 계정 이름으로 보여준다. '내 정보'에서 이름을 고치면 예전 댓글에도 반영된다.
    // 계정이 지워졌으면 쓸 당시 저장해 둔 이름을 쓴다
    const authorIds = [...new Set(comments.map((c) => String(c.author)))]
    // 연산자 조건은 trusted로 감싸야 sanitizeFilter에 막히지 않는다 (값은 DB에서 읽은 id라 안전)
    const users = await User.find({ _id: mongoose.trusted({ $in: authorIds }) })
      .select('name')
      .lean<{ _id: mongoose.Types.ObjectId; name: string }[]>()
    const nameById = new Map(users.map((u) => [String(u._id), u.name]))

    ok(
      res,
      comments.map((c) => ({
        _id: c._id,
        author: String(c.author),
        authorName: nameById.get(String(c.author)) || c.authorName,
        content: c.content,
        createdAt: c.createdAt,
      }))
    )
  })
)

rehearsalCommentsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const access: RehearsalAccess = res.locals.rehearsal
    const logId = await findLogId(req.params.logId)
    if (!logId) {
      fail(res, '연습일지를 찾을 수 없습니다.', 404)
      return
    }
    const content = cleanText(req.body?.content, 2000)
    if (!content) {
      fail(res, '댓글 내용을 입력해주세요.', 400)
      return
    }

    const comment = await RehearsalComment.create({
      log: logId,
      author: res.locals.user.userId,
      authorName: access.displayName,
      content,
    })
    ok(
      res,
      {
        _id: comment._id,
        author: String(comment.author),
        authorName: comment.authorName,
        content: comment.content,
        createdAt: comment.createdAt,
      },
      '댓글을 남겼습니다.',
      201
    )
  })
)

rehearsalCommentsRouter.delete(
  '/:commentId',
  asyncHandler(async (req, res) => {
    const access: RehearsalAccess = res.locals.rehearsal
    if (!mongoose.isValidObjectId(req.params.commentId)) {
      fail(res, '댓글을 찾을 수 없습니다.', 404)
      return
    }
    // 다른 일지의 댓글을 이 주소로 지우지 못하게 일지 id까지 함께 맞춘다
    const comment = await RehearsalComment.findOne({ _id: req.params.commentId, log: req.params.logId })
      .select('author')
      .lean<{ author: mongoose.Types.ObjectId } | null>()
    if (!comment) {
      fail(res, '댓글을 찾을 수 없습니다.', 404)
      return
    }
    const isMine = String(comment.author) === res.locals.user.userId
    if (!isMine && !access.canDelete) {
      fail(res, '본인이 쓴 댓글만 지울 수 있습니다.', 403)
      return
    }

    await RehearsalComment.deleteOne({ _id: req.params.commentId })
    ok(res, null, '댓글을 지웠습니다.')
  })
)
