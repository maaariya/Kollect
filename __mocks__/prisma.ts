import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'

const prisma = mockDeep<PrismaClient>()

beforeEach(() => {
  mockReset(prisma)
})

export default prisma
export type MockPrisma = DeepMockProxy<PrismaClient>