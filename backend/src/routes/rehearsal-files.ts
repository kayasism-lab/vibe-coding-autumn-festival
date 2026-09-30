import express, { Router } from 'express'
import mongoose from 'mongoose'
import { RehearsalLog } from '../models/index.js'
import { asyncHandler, fail, ok } from '../lib/http.js'
import { requireRehearsalAccess } from '../middleware/require-rehearsal.js'
import { findVisibleTeam, type RehearsalAccess } from '../lib/rehearsal-access.js'
import { cleanText } from '../lib/rehearsal-input.js'
import {
  appendChunk,
  createUpload,
  fileUrl,
  isFileId,
  readMeta,
  readSlice,
  validateUpload,
} from '../lib/rehearsal-files.js'

/**
 * 연습일지 첨부 파일 올리기·받기 (/rehearsal-files).
 *
 * 파일을 한 번에 보내지 않고 조각으로 나눠 주고받는다. 요청이 프론트(Vercel)를 거쳐 오는데,
 * 그 길목은 큰 본문을 막을 수 있어 조각 하나를 작게(3MB) 유지한다.
 *   1) POST /            이름·크기를 알리고 파일 id를 받는다
 *   2) PUT  /:id?offset= 조각을 차례로 보낸다 (마지막 조각에서 파일이 완성된다)
 *   3) GET  /:id?offset=&length=  조각을 차례로 받는다
 */
export const rehearsalFilesRouter = Router()

rehearsalFilesRouter.use(requireRehearsalAccess)

/** 조각 하나의 최대 크기. 화면은 3MB씩 보내고, 여유를 조금 둔다 */
const MAX_CHUNK = 4 * 1024 * 1024

/** 일지를 쓸 수 있는 계정만 파일을 올린다 (낭독극 수강생처럼 보기만 하는 계정은 못 올린다) */
function canUpload(access: RehearsalAccess) {
  return access.writableTeamId !== ''
}

rehearsalFilesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const access: RehearsalAccess = res.locals.rehearsal
    if (!canUpload(access)) {
      fail(res, '파일을 올릴 권한이 없습니다.', 403)
      return
    }
    const name = cleanText(req.body?.name, 200)
    const size = Number(req.body?.size)
    const invalid = validateUpload(name, size)
    if (invalid) {
      fail(res, invalid, 400)
      return
    }
    const id = await createUpload(name, size, res.locals.user.userId)
    ok(res, { id }, '파일 올리기를 시작합니다.', 201)
  })
)

rehearsalFilesRouter.put(
  '/:id',
  // 조각은 JSON이 아니라 파일 내용 그대로 온다
  express.raw({ type: 'application/octet-stream', limit: MAX_CHUNK }),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    const meta = isFileId(id) ? await readMeta(id) : null
    // 올리기를 시작한 본인만 조각을 이어 보낼 수 있다
    if (!meta || meta.uploadedBy !== res.locals.user.userId) {
      fail(res, '파일을 찾을 수 없습니다.', 404)
      return
    }
    if (!Buffer.isBuffer(req.body)) {
      fail(res, '파일 조각이 비어 있습니다.', 400)
      return
    }

    const result = await appendChunk(id, meta, Number(req.query.offset), req.body)
    if (typeof result === 'string') {
      fail(res, result, 409)
      return
    }
    ok(res, { ...result, url: fileUrl(id), name: meta.name, size: meta.size })
  })
)

rehearsalFilesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const access: RehearsalAccess = res.locals.rehearsal
    const id = req.params.id
    const meta = isFileId(id) ? await readMeta(id) : null
    if (!meta?.complete) {
      fail(res, '파일을 찾을 수 없습니다.', 404)
      return
    }

    // 파일이 붙은 일지를 볼 수 있는 계정만 받는다 (단막극↔낭독극 분리를 파일에도 그대로 적용).
    // 아직 일지에 붙지 않은 파일(작성 중)은 올린 본인과 관리자만 받는다
    const log = await RehearsalLog.findOne({ 'files.url': fileUrl(id) })
      .select('team')
      .lean<{ team: mongoose.Types.ObjectId } | null>()
    const allowed = log
      ? !!(await findVisibleTeam(access, String(log.team)))
      : meta.uploadedBy === res.locals.user.userId || access.canDelete
    if (!allowed) {
      fail(res, '파일을 찾을 수 없습니다.', 404)
      return
    }

    const offset = Number(req.query.offset ?? 0)
    const length = Math.min(Number(req.query.length ?? MAX_CHUNK), MAX_CHUNK)
    if (!Number.isInteger(offset) || offset < 0 || offset >= meta.size || !Number.isInteger(length) || length <= 0) {
      fail(res, '요청 범위가 올바르지 않습니다.', 400)
      return
    }

    const chunk = await readSlice(id, offset, length)
    // 브라우저가 내용을 열어 실행하지 않도록 항상 '내려받을 데이터'로만 보낸다
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Cache-Control', 'private, no-store')
    res.send(chunk)
  })
)
