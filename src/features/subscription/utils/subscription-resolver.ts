'use server'
import { prisma } from '../../../lib/prisma'
import { SubscriptionState } from '@/types/project-types'

export async function getSubscriptionState(companyId: number): Promise<SubscriptionState> {
  'use server'
  const sub = await prisma.companySubscription.findUnique({
    where: { companyId },
    include: { subscriptionPlan: true },
  })

  if (!sub) return 'FREE'

  const now = new Date()

  if (sub.endsAt > now) return 'ACTIVE'

  if (sub.graceEndsAt && sub.graceEndsAt > now) return 'GRACE'

  return 'EXPIRED'
}

export async function getCompanyPlan(companyId: number) {
  'use server'
  const state = await getSubscriptionState(companyId)

  if (state === 'FREE') {
    return prisma.subscriptionPlan.findFirstOrThrow({
      where: { code: 'FREE' },
    })
  }

  const subscription = await prisma.companySubscription.findFirstOrThrow({
    where: { companyId },
    include: { subscriptionPlan: true },
  })

  return subscription.subscriptionPlan
}

export async function getCompanySubscription(companyId: number) {
  'use server'
  return prisma.companySubscription.findUnique({
    where: { companyId },
    include: { subscriptionPlan: true },
  })
}

