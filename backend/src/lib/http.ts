import type { NextFunction, Request, Response } from 'express'

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next)
  }
}

export function ok<T>(res: Response, data: T, message?: string, status = 200) {
  res.status(status).json({ success: true, data, ...(message ? { message } : {}) })
}

export function fail(res: Response, error: string, status = 500) {
  res.status(status).json({ success: false, error })
}

// 페이지 크기를 안전한 범위로 자른다. limit=999999 같은 값으로 컬렉션 전체를
// 한 번에 덤프하거나 limit=abc(NaN)로 쿼리를 깨뜨리는 것을 막는다.
export function clampLimit(value: unknown, fallback = 20, max = 100): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(1, Math.floor(n)), max)
}

// 페이지 번호를 1 이상으로 보정한다 (음수 skip 방지).
export function clampPage(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.max(1, Math.floor(n))
}

// 사용자 입력을 정규식으로 쓸 때 메타문자를 이스케이프한다.
// 이 처리가 없으면 (a+)+$ 같은 파국적 백트래킹 패턴으로 DB CPU를 태울 수 있다(ReDoS).
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
