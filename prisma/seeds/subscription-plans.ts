// import { PrismaClient } from '@/generated/prisma/client'
// const prisma = new PrismaClient()


import {prisma} from '../prisma'

export async function seedSubscriptionPlans() {
  const plans = [
    {
      code: 'FREE',
      name: 'FreeForAll',
      monthlyPrice: null,
      yearlyPrice: null,
      maxInvites: 0,
      dailyTransactionLimit: 10,
      monthlyBackupLimit: 1,
      canViewAllReports: false,
      isAutoPlan: true,
      isAdminOnly: false,
      autoExpireDays: null,
    },
    {
      code: 'STARTER',
      name: 'Starter',
      monthlyPrice: 10,
      yearlyPrice: 96, // 8 * 12
      maxInvites: 1,
      dailyTransactionLimit: 2000,
      monthlyBackupLimit: 5,
      canViewAllReports: true,
      isAutoPlan: false,
      isAdminOnly: false,
      autoExpireDays: null,
    },
    {
      code: 'PREMIUM',
      name: 'Premium',
      monthlyPrice: 15,
      yearlyPrice: 144, // 12 * 12
      maxInvites: 2,
      dailyTransactionLimit: 2000,
      monthlyBackupLimit: 15,
      canViewAllReports: true,
      isAutoPlan: false,
      isAdminOnly: false,
      autoExpireDays: null,
    },
    {
      code: 'ENTERPRISE',
      name: 'Enterprise',
      monthlyPrice: 30,
      yearlyPrice: 312, // 26 * 12
      maxInvites: 20,
      dailyTransactionLimit: null, // unlimited
      monthlyBackupLimit: 30,
      canViewAllReports: true,
      isAutoPlan: false,
      isAdminOnly: false,
      autoExpireDays: null,
    },
    {
      code: 'CUSTOM_SERVER',
      name: 'Custom Server',
      monthlyPrice: 100,
      yearlyPrice: 1080, // 90 * 12
      maxInvites: null, // unlimited
      dailyTransactionLimit: null,
      monthlyBackupLimit: null,
      canViewAllReports: true,
      isAutoPlan: false,
      isAdminOnly: false,
      autoExpireDays: null,
    },
    {
      code: 'WEBSITE_TESTER',
      name: 'Website Tester',
      monthlyPrice: null,
      yearlyPrice: null,
      maxInvites: null,
      dailyTransactionLimit: null,
      monthlyBackupLimit: null,
      canViewAllReports: true,
      isAutoPlan: false,
      isAdminOnly: true,
      autoExpireDays: 30,
    },
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    })
  }

  console.log('✅ Subscription plans seeded')
}
