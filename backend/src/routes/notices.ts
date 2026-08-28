import { Router } from 'express'
import { Notice } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireAdmin, requirePermission } from '../middleware/require-admin.js'

export const noticesRouter = Router()

/** 한국 시각 기준 올해. 서버가 어느 지역에 떠 있어도 같은 값이 나오게 한다 */
function getKstYear(): number {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric' }).format(new Date())
  )
}

noticesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 10)
    const query: Record<string, unknown> = {}

    if (req.query.category && req.query.category !== 'all') {
      // 'notice,event'처럼 여러 개를 한 번에 받을 수 있게 한다.
      // 공지 게시판과 보도·미디어 게시판이 각각 두 종류씩 묶어 쓰기 때문이다
      const categories = String(req.query.category).split(',').filter(Boolean)
      query.category = categories.length > 1 ? { $in: categories } : categories[0]
    }

    // 연도와 검색 조건은 둘 다 $or를 쓰므로 $and로 묶는다.
    // 예전처럼 query.$or에 각각 넣으면 뒤에 오는 조건이 앞의 것을 덮어써버린다
    const conditions: Record<string, unknown>[] = []

    // 예전 보도까지 쌓이면 연도별로 나눠 봐야 한다.
    // 기준은 알려진 날짜(publishedAt)이며, 그 값이 없는 예전 자료는 등록 시각으로 본다
    // 연도는 '올해'와 '올해 이전' 두 갈래로만 나눈다.
    // 해가 바뀌면 올해 값도 저절로 따라가므로 코드를 고칠 일이 없다.
    // 한국 시각 기준 1월 1일 0시는 UTC로 9시간 앞서므로 그만큼 당겨서 경계를 잡는다.
    // 이 보정이 없으면 12월 31일 밤에 올린 글이 다음 해로 잡힌다
    if (req.query.year === 'before') {
      const boundary = new Date(Date.UTC(getKstYear(), 0, 1, -9))
      conditions.push({
        $or: [
          { publishedAt: { $lt: boundary } },
          { publishedAt: { $exists: false }, createdAt: { $lt: boundary } },
        ],
      })
    } else if (req.query.year && req.query.year !== 'all') {
      const year = Number(req.query.year)
      const from = new Date(Date.UTC(year, 0, 1, -9))
      const to = new Date(Date.UTC(year + 1, 0, 1, -9))
      conditions.push({
        $or: [
          { publishedAt: { $gte: from, $lt: to } },
          { publishedAt: { $exists: false }, createdAt: { $gte: from, $lt: to } },
        ],
      })
    }

    if (req.query.search) {
      conditions.push({
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { content: { $regex: req.query.search, $options: 'i' } },
        ],
      })
    }

    if (conditions.length > 0) {
      query.$and = conditions
    }

    const skip = (page - 1) * limit
    const [items, total] = await Promise.all([
      // 알려진 날짜 순으로 본다. 예전 보도를 뒤늦게 올려도 그 시절 자리에 놓이도록
      Notice.find(query)
        .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notice.countDocuments(query),
    ])

    // 연도 선택 상자를 그리려면 이 분류에 실제로 어떤 해가 있는지 알아야 한다.
    // 연도·검색 조건은 빼고 분류 조건만으로 모은다 (연도를 고른 뒤에도 목록이 유지되도록)
    const yearMatch = query.category ? { category: query.category } : {}
    const yearRows = await Notice.aggregate<{ _id: number }>([
      { $match: yearMatch },
      {
        $group: {
          _id: {
            $year: { date: { $ifNull: ['$publishedAt', '$createdAt'] }, timezone: 'Asia/Seoul' },
          },
        },
      },
      { $sort: { _id: -1 } },
    ])

    ok(res, {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      years: yearRows.map((row) => row._id),
    })
  })
)

noticesRouter.post(
  '/',
  requirePermission('notices'),
  asyncHandler(async (req, res) => {
    const notice = await Notice.create(req.body)
    ok(res, notice.toObject(), '공지사항이 등록되었습니다.', 201)
  })
)

noticesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).lean()

    if (!notice) {
      fail(res, '공지사항을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, notice)
  })
)

noticesRouter.put(
  '/:id',
  requirePermission('notices'),
  asyncHandler(async (req, res) => {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).lean()

    if (!notice) {
      fail(res, '공지사항을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, notice, '공지사항이 수정되었습니다.')
  })
)

noticesRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const notice = await Notice.findByIdAndDelete(req.params.id)
    if (!notice) {
      fail(res, '공지사항을 찾을 수 없습니다.', 404)
      return
    }

    ok(res, null, '공지사항이 삭제되었습니다.')
  })
)
