import prisma from './__mocks__/prisma'
jest.mock('./lib/prisma', () => ({ prisma }))