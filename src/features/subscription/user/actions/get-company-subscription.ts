// src/features/subscription/guards/user/actions/get-company-subscription.ts
'use server'
import { prisma } from '../../../../lib/prisma'
import { getSubscriptionState, getCompanyPlan } from '@/features/subscription/utils/subscription-resolver'
import { assertFullAccess } from '@/features/subscription/guards/company-subscription-access' 
import { CompanyRoles } from '@/types/project-types'

export type CompanySubscriptionOverview = {
  plan: {
    code: string
    name: string
    maxInvites: number | null
    dailyTransactionLimit: number | null
    monthlyBackupLimit: number | null
    canViewAllReports: boolean
  }
  status: 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'FREE'
  startedAt: Date
  endsAt: Date
  graceEndsAt: Date | null
  usage: {
    dailyTransactions: number
    monthlyBackups: number
  }
}

export async function getCompanySubscriptionOverview(user: {
  id: number
  companyId: number
  companyRole: number
}): Promise<CompanySubscriptionOverview | null> {
  'use server'
  try {
    // enforce FullAccess
    // if (user.companyRole !== CompanyRoles.FullAccess) {
    //   throw new Error('Access denied: FullAccess required')
    // }

    const companyId = user.companyId

    // Get subscription plan and status
    const plan = await getCompanyPlan(companyId)
    const status = await getSubscriptionState(companyId)

    // Get today and current month
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Fetch usage counters
    const dailyUsage = await prisma.companySubscriptionUsageDaily.findUnique({
      where: { companyId_date: { companyId, date: startOfDay } },
    })

    const monthlyUsage = await prisma.companySubscriptionUsageMonthly.findUnique({
      where: { companyId_year_month: { companyId, year: today.getFullYear(), month: today.getMonth() + 1 } },
    })

    // normalize plan shape: getCompanyPlan may return the plan directly or an object with subscriptionPlan and subscriptions
    const subscriptionPlan = 'subscriptionPlan' in plan ? plan.subscriptionPlan : (plan as any)
    const subscriptions = 'subscriptions' in plan ? (plan as any).subscriptions : []

    return {
      plan: {
        code: subscriptionPlan.code,
        name: subscriptionPlan.name,
        maxInvites: subscriptionPlan.maxInvites,
        dailyTransactionLimit: subscriptionPlan.dailyTransactionLimit,
        monthlyBackupLimit: subscriptionPlan.monthlyBackupLimit,
        canViewAllReports: subscriptionPlan.canViewAllReports,
      },
      status,
      startedAt: subscriptions[0]?.startedAt ?? new Date(),
      endsAt: subscriptions[0]?.endsAt ?? new Date(),
      graceEndsAt: subscriptions[0]?.graceEndsAt ?? null,
      usage: {
        dailyTransactions: dailyUsage?.journalEntryCount ?? 0,
        monthlyBackups: monthlyUsage?.backupCount ?? 0,
      },
    }    
  } catch (error) {
    return(null)
  }

}
