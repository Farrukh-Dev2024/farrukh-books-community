'use server'

import { prisma } from '../../../../lib/prisma'
import { auth } from '@/lib/auth'
import { assertFullAccess } from '@/features/subscription/guards/company-subscription-access'
import { getAuthUserOrThrow } from '@/lib/permissions/helperfunctions'

export async function requestPlanUpgrade(
  companyId: number,
  requestedPlanId: number,
  note?: string
) {
  'use server'
  try {
    const userdb = await assertFullAccess();

    // ✅ NEW: prevent duplicate pending requests
    const existingPending = await prisma.subscriptionUpgradeRequest.findFirst({
      where: {
        companyId,
        status: 'PENDING',
      },
    })

    if (existingPending) {
      throw new Error('An upgrade request is already pending for this company.')
    }

    const currentSub = await prisma.companySubscription.findFirst({
      where: { companyId },
      include: { subscriptionPlan: true },
      orderBy: { createdAt: 'desc' },
    })

    //if (!currentSub) throw new Error('No active subscription found')
    if (!currentSub) {
      await autoAssignWebsiteFreePlan(companyId);
      throw new Error(
        'No active subscription found. A free plan has been assigned to your company. Please try again.'
      );
    }

    const result = await prisma.subscriptionUpgradeRequest.create({
      data: {
        companyId,
        currentPlanId: currentSub.subscriptionPlanId,
        requestedPlanId,
        requestedByUserId: userdb.id,
        note,
      },
    })
    return {...result, success: true}  
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error while requesting upgrade.',
    }
  }

}

export async function autoAssignWebsiteFreePlan(
  companyId: number,
  days = 30
) {
  'use server'
  const userdb = await getAuthUserOrThrow()
  const currentSub = await prisma.companySubscription.findFirst({
    where: { companyId },
    include: { subscriptionPlan: true },
    orderBy: { createdAt: 'desc' },
  })

  if (currentSub) return currentSub // already has a subscription

  const freePlan = await prisma.subscriptionPlan.findFirstOrThrow({
    where: { code: 'FREE' },
  })

  const now = new Date()
  const endsAt = new Date(now.getTime() + days * 86400000)

  return prisma.companySubscription.upsert({
    where: { companyId },
    update: {
      subscriptionPlanId: freePlan.id,
      status: 'ACTIVE',
      startedAt: now,
      endsAt,
      graceEndsAt: null,
      canceledAt: null,
    },
    create: {
      companyId,
      subscriptionPlanId: freePlan.id,
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      startedAt: now,
      endsAt,
      createdByUserId: userdb.id, // normal user automatically assigning
    },
  })
}