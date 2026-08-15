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
