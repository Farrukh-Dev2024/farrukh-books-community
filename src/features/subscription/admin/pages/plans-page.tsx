// plans-page.tsx
import React from 'react'
import { adminGetAllSubscriptionPlans } from '../actions/plan-actions'
import { PlansTable } from '../components/plan-table'
import { SubscriptionPlan } from '@/types/prisma-types'

export default function AdminPlansPage() {
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);

  React.useEffect(() => {
    const loadPlans = async () => {
      const res = await adminGetAllSubscriptionPlans()
      if (res) setPlans(res)
    }
    loadPlans()
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Subscription Plans</h1>
      <PlansTable plans={plans} />
    </div>
  )
}
