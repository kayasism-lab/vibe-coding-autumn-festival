import dotenv from 'dotenv'

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'

function required(name: string, fallback?: string) {
  const value = process.env[name] || fallback

  if (!value || (isProduction && fallback && value === fallback)) {
    throw new Error(`${name} 환경변수를 설정해주세요.`)
  }

  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  mongodbUri: required('MONGODB_URI', 'mongodb://localhost:27017/autumn_festival'),
  jwtSecret: required('JWT_SECRET', 'local-access-secret-change-before-prod'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'local-refresh-secret-change-before-prod'),
  isProduction,
}
