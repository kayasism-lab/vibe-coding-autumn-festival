import path from 'node:path'
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
  // 연습일지 첨부 파일을 두는 폴더. 운영에서는 Cloudtype 영구 디스크의 마운트 경로를 넣어야
  // 재배포해도 파일이 남는다. 비워 두면 실행 위치의 uploads 폴더를 쓴다(로컬 개발용)
  fileStorageDir: path.resolve(process.env.FILE_STORAGE_DIR || 'uploads'),
  isProduction,
}
