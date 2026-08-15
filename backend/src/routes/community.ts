import { Router } from 'express'
import { CommunityPost, User } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAuth } from '../middleware/require-admin.js'

export const communityRouter = Router()

communityRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const posts = await CommunityPost.find().sort({ createdAt: -1 }).lean()
    ok(res, posts)
  })
)

communityRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = res.locals.user
    if (!req.body.title || !req.body.content) {
      fail(res, '제목과 내용을 입력해주세요.', 400)
      return
    }

    const author = await User.findById(user.userId).select('name email').lean()
    const post = await CommunityPost.create({
      title: req.body.title,
      content: req.body.content,
      imageUrls: req.body.imageUrls || [],
      authorId: user.userId,
      authorName: author?.name || user.email,
    })

    ok(res, post.toObject(), '게시글이 등록되었습니다.', 201)
  })
)

communityRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await CommunityPost.findById(req.params.id)
    if (!post) {
      fail(res, '게시글을 찾을 수 없습니다.', 404)
      return
    }

    const user = res.locals.user
    const isAdmin = user.role === 'superadmin' || user.role === 'admin'
    const isOwner = post.authorId.toString() === user.userId
    if (!isAdmin && !isOwner) {
      fail(res, '삭제 권한이 없습니다.', 403)
      return
    }

    await post.deleteOne()
    ok(res, null, '게시글이 삭제되었습니다.')
  })
)
