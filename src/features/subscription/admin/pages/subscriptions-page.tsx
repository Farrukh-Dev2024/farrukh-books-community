//subscriptions-page.tsx
'use client'
import React from 'react'
import { adminGetAllCompanySubscriptions } from '../actions/company-subscription-actions'
import { SubscriptionTable } from '../components/subscription-table'
import { SubscriptionRow } from '@/types/prisma-types'

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = React.useState<SubscriptionRow[]>([]);
    React.useEffect(() => {
    const loadSubscriptions = async () => {
        const res = await adminGetAllCompanySubscriptions()
        if (res) setSubscriptions(res)
    }
    loadSubscriptions()
    }, []);


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Company Subscriptions</h1>

      <SubscriptionTable rows={subscriptions} />
    </div>
  )
}
