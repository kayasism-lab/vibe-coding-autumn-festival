import { Router } from 'express'
import { SiteConfig } from '../models/index.js'
import { asyncHandler, ok } from '../lib/http.js'
import { requireAdmin } from '../middleware/require-admin.js'

export const siteConfigRouter = Router()

siteConfigRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (req.query.key) {
      const config = await SiteConfig.findOne({ key: req.query.key })
      ok(res, config)
      return
    }

    const configs = await SiteConfig.find()
    ok(res, configs)
  })
)

siteConfigRouter.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { key, value } = req.body
    const config = await SiteConfig.findOneAndUpdate(
      { key },
      { key, value, updatedAt: new Date() },
      { new: true, upsert: true }
    )

    ok(res, config)
  })
)
