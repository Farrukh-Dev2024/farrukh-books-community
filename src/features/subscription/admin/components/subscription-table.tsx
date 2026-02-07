//subscription-table.tsx
'use client'
import { SubscriptionRow } from '@/types/prisma-types'
import { EditSubscriptionDialog } from './edit-subscription-dialog'

export function SubscriptionTable({ rows }: { rows: SubscriptionRow[] }) {
  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 dark:bg-gray-900">
          <tr>
            <th className="p-2 text-left">Company</th>
            <th className="p-2 text-left">Plan</th>
            <th className="p-2 text-center">Billing</th>
            <th className="p-2 text-center">Status</th>
            <th className="p-2 text-right">Ends At</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.map(row => (
            <tr key={row.companyId} className="border-t">
              <td className="p-2 font-medium">{row.companyTitle}</td>

              <td className="p-2">
                <div className="font-mono text-xs text-gray-500">
                  {row.planCode}
                </div>
                <div>{row.planName}</div>
              </td>

              <td className="p-2 text-center">
                {row.billingCycle}
              </td>

              <td className="p-2 text-center">
                <span className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-800">
                  {row.status}
                </span>
              </td>

              <td className="p-2 text-right">
                {row.endsAt
                  ? new Date(row.endsAt).toLocaleDateString()
                  : '—'}
              </td>
              <td className="p-2 text-right">
                <EditSubscriptionDialog subscription={row} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
