// src/app/api/internal/subscriptions/automation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { assertSuperAdminAccess } from '@/features/admindashboard/utils/utils'
import { runSubscriptionAutomation } from '@/features/subscription/automation/subscription-automation'

export async function POST(req: NextRequest) {
  try {
    await assertSuperAdminAccess()

    await runSubscriptionAutomation()

    return NextResponse.json({ success: true, message: 'Subscription automation executed' })
  } catch (error: any) {
    console.error('[Subscription Automation API] Error:', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to run automation' }, { status: 500 })
  }
}

// How to use
//await fetch('/api/internal/subscriptions/automation', { method: 'POST' })
