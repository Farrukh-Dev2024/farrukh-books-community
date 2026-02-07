// src/features/subscription/utils/free-plan.ts
'use server'
import { prisma } from '../../../lib/prisma'

export async function getFreePlan() {
  'use server'
  return prisma.subscriptionPlan.findFirstOrThrow({
    where: { code: 'FREE' },
  })
}
