// subscription-automation.ts
'use server'
import { runDailySubscriptionCheck } from './daily-checker'
import { expireTesterPlans } from './tester-expirer'

/**
 * Central entrypoint for all subscription automation tasks.
 * Can be triggered daily via cron or API route.
 */
export async function runSubscriptionAutomation() {
  'use server'
  console.log('[Subscription Automation] Started:', new Date().toISOString())

  try {
    // 1️⃣ Handle normal paid subscriptions & grace periods
    await runDailySubscriptionCheck()
    console.log('[Subscription Automation] Daily subscription check completed')

    // 2️⃣ Expire all tester plans
    await expireTesterPlans()
    console.log('[Subscription Automation] Tester plan expiration completed')

    console.log('[Subscription Automation] Finished successfully')
  } catch (error) {
    console.error('[Subscription Automation] Error:', error)
  }
}


/**
         How to use
        1. Via cron / scheduler
            # Node script example
                node -r ts-node/register src/features/subscription/automation/subscription-automation.ts


        Or in serverless environment, call:

            import { runSubscriptionAutomation } from '@/features/subscription/automation/subscription-automation'

            export default async function handler(req, res) {
                // Only allow admin/internal calls
                // assertSuperAdminAccess(session)
                await runSubscriptionAutomation()
                res.status(200).json({ success: true })
            }
 */

/**
 * Alternatively, you can set up an API route to trigger this automation.
 src/app/api/internal/subscriptions/automation/route.ts 
 */