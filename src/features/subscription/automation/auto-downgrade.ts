// src/features/subscription/automation/auto-downgrade.ts
'use server'
import { prisma } from '../../../lib/prisma'
import { getFreePlan } from '../utils/free-plan'

export async function downgradeCompanyToFree(companyId: number) {
  'use server'
  const freePlan = await getFreePlan()

  await prisma.companySubscription.update({
    where: { companyId },
    data: {
      subscriptionPlanId: freePlan.id,
      status: 'EXPIRED',
      graceEndsAt: null,
      canceledAt: new Date(),
    },
  })
}
