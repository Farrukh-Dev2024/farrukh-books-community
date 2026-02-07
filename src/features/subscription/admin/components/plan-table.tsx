// plan-table.tsx
'use client'

import { useState } from 'react'
import { SubscriptionPlan } from '@/types/prisma-types'
import { EditPlanDialog } from './edit-plan-dialog'

export function PlansTable({ plans }: { plans: SubscriptionPlan[] }) {
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null)

  return (
    <div className="space-y-4">
      {/* Make table scrollable on small screens */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-150 border rounded-md">
          <thead className="bg-gray-100 dark:bg-gray-900">
            <tr>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-right">Monthly</th>
              <th className="p-2 text-right">Yearly</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(plan => (
              <tr key={plan.id} className="border-t">
                <td className="p-2 font-mono text-sm">{plan.code}</td>
                <td className="p-2">{plan.name}</td>
                <td className="p-2 text-right">{plan.monthlyPrice ?? '—'}</td>
                <td className="p-2 text-right">{plan.yearlyPrice ?? '—'}</td>
                <td className="p-2 text-center">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => setSelected(plan)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <EditPlanDialog
          plan={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
