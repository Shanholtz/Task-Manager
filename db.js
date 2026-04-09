import postgres from 'postgres'
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

const connectionString = process.env.DATABASE_URL
const sql = postgres(connectionString)

export default sql