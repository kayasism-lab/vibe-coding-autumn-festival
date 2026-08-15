import mongoose from 'mongoose'
import { env } from './env.js'

let cached: typeof mongoose | null = null

export async function connectDB() {
  if (cached) {
    return cached
  }

  cached = await mongoose.connect(env.mongodbUri, {
    bufferCommands: false,
  })

  return cached
}
