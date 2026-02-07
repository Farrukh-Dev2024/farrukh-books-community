// src/features/subscription/guards/invite.guards.ts

import { prisma } from '../../../lib/prisma'
import { subscriptionError } from './subscription-error'
import { getCompanyPlan, getSubscriptionState } from '../utils/subscription-resolver'

export async function assertCanInviteUser(companyId: number) {
  const state = await getSubscriptionState(companyId)

  if (state === 'EXPIRED') {
    subscriptionError('Subscription expired. Cannot invite users.')
  }

  const plan = await getCompanyPlan(companyId)

  if (plan.maxInvites === 0) {
    subscriptionError('Your plan does not allow inviting users.')
  }

  const memberCount = await prisma.user.count({
    where: { companyId },
  })

  const allowedUsers = 1 + plan.maxInvites! // creator + invites
  if (memberCount >= allowedUsers) {
    subscriptionError(
      `Invite limit reached. Max allowed users: ${allowedUsers}.`
    )
  }
}
