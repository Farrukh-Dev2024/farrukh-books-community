// src/features/subscription/actions/get-available-plans.ts
'use server'

import { prisma } from '../../../../lib/prisma'

// Client-safe type
export interface ClientSubscriptionPlan {
  id: number
  code: string
  name: string
  monthlyPrice: number | null
  yearlyPrice: number | null
  maxInvites: number | null
  dailyTransactionLimit: number | null
  monthlyBackupLimit: number | null
  canViewAllReports: boolean
}

export async function getAvailablePlans(): Promise<ClientSubscriptionPlan[]> {
  'use server'
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isAdminOnly: false },
    orderBy: { id: 'asc' },
  })

  return plans.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    monthlyPrice: p.monthlyPrice ? Number(p.monthlyPrice) : null,
    yearlyPrice: p.yearlyPrice ? Number(p.yearlyPrice) : null,
    maxInvites: p.maxInvites,
    dailyTransactionLimit: p.dailyTransactionLimit,
    monthlyBackupLimit: p.monthlyBackupLimit,
    canViewAllReports: p.canViewAllReports,
  }))
}
