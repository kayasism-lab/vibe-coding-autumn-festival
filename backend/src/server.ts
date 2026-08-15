import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { connectDB } from './lib/db.js'
import { env } from './lib/env.js'
import { fail } from './lib/http.js'
import { apiRouter } from './routes/index.js'

const app = express()

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  })
)
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api', apiRouter)

app.use((_req, res) => {
  fail(res, '요청한 API를 찾을 수 없습니다.', 404)
})

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API error:', error)
  fail(res, '서버 오류가 발생했습니다.', 500)
})

await connectDB()

app.listen(env.port, () => {
  console.log(`Backend API listening on http://localhost:${env.port}`)
})
