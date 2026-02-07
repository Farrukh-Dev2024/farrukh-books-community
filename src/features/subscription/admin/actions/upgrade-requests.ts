// src/features/subscription/admin/actions/upgrade-requests.ts
'use server'

import { prisma } from '../../../../lib/prisma'
import { assertSuperAdminAccess } from '@/features/admindashboard/utils/utils'
import { UpgradeRequestRow } from '@/types/prisma-types'
import { adminAssignWebsiteTesterPlan, adminForceChangeCompanyPlan } from './company-subscription-actions'

export async function adminGetAllUpgradeRequests(): Promise<UpgradeRequestRow[]> {
  'use server'
  await assertSuperAdminAccess()

  const requests = await prisma.subscriptionUpgradeRequest.findMany({
    include: {
      company: true,
      requestedPlan: true,
      currentPlan: true,
      requestedByUser: true,
      reviewedByUser: true,
    },
    where: {status: 'PENDING'},
    orderBy: { createdAt: 'desc' },
  })

  return requests.map(r => ({
    id: r.id,
    companyId: r.companyId,
    companyTitle: r.company.title??"",
    currentPlanName: r.currentPlan.name,
    requestedPlanName: r.requestedPlan.name,
    status: r.status as unknown as UpgradeRequestRow['status'],
    requestedBy: r.requestedByUser?.name || 'Unknown',
    reviewedBy: r.reviewedByUser?.name || null,
    note: r.note,
    createdAt: r.createdAt,
    reviewedAt: r.reviewedAt,
  }))
}

export async function adminReviewUpgradeRequest(
  requestId: number,
  approve: boolean,
  reviewerId: number
) {
  'use server'
  await assertSuperAdminAccess()

  const request = await prisma.subscriptionUpgradeRequest.update({
    where: { id: requestId },
    data: {
      status: approve ? 'APPROVED' : 'REJECTED',
      reviewedAt: new Date(),
    },
  })

  if (approve) {
    // apply the requested plan to the company subscription
    const sub = await prisma.companySubscription.update({
      where: { companyId: request.companyId },
      data: { subscriptionPlanId: request.requestedPlanId },
    })
    return { request, subscription: sub }
  }

  return { request }
}

export async function adminReviewUpgradeRequestToTester(
  requestId: number,
  approve: boolean,
  reviewerId: number
) {
  'use server'
  await assertSuperAdminAccess()

  const request = await prisma.subscriptionUpgradeRequest.update({
    where: { id: requestId },
    data: {
      status: approve ? 'APPROVED' : 'REJECTED',
      reviewedAt: new Date(),
    },
  })

  if (approve) {
    // apply the requested plan to the company subscription
    // here we will arbitrarly approve request to website_tester
    // const sub = await prisma.companySubscription.update({
    //   where: { companyId: request.companyId },
    //   data: { subscriptionPlanId: request.requestedPlanId },
    // })
    
    const sub = adminAssignWebsiteTesterPlan(request.companyId)
    return { request, subscription: sub }
  }

  return { request }
}
