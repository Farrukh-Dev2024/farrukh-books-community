'use server'
import { prisma } from '../../../lib/prisma'
import { downgradeCompanyToFree } from './auto-downgrade'

export async function expireTesterPlans() {
  'use server'
  const now = new Date()

  // Fetch all company subscriptions where endsAt < now
  const subs = await prisma.companySubscription.findMany({
    where: {
      endsAt: { lt: now },
    },
    include: {
      subscriptionPlan: true, // include the plan to access code
    },
  })

  for (const sub of subs) {
    // Only target the tester plan
    if (sub.subscriptionPlan.code === 'WEBSITE_TESTER') {
      await downgradeCompanyToFree(sub.companyId)
    }
  }
}
