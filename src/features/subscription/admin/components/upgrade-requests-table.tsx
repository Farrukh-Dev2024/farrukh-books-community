// src/features/subscription/admin/components/upgrade-requests-table.tsx
'use client'

import React, { useState } from 'react'
import { UpgradeRequestRow } from '@/types/prisma-types'
import { UpgradeRequestReviewDialog } from './upgrade-request-review-dialog'

export function UpgradeRequestsTable({
  requests,
  onUpdate,
}: {
  requests: UpgradeRequestRow[]
  onUpdate: (newData: UpgradeRequestRow[]) => void
}) {
  const [selected, setSelected] = useState<UpgradeRequestRow | null>(null)

  return (
    <div className="space-y-4">
      {/* Make table scrollable on small screens */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-175 border rounded-md">
          <thead className="bg-gray-100 dark:bg-gray-900">
            <tr>
              <th className="p-2 text-left">Company</th>
              <th className="p-2 text-left">Current Plan</th>
              <th className="p-2 text-left">Requested Plan</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Requested By</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} className="border-t">
                <td className="p-2">{req.companyTitle}</td>
                <td className="p-2">{req.currentPlanName}</td>
                <td className="p-2">{req.requestedPlanName}</td>
                <td className="p-2">{req.status}</td>
                <td className="p-2">{req.requestedBy}</td>
                <td className="p-2 text-center">
                  {req.status === 'PENDING' && (
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => setSelected(req)}
                    >
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <UpgradeRequestReviewDialog
          request={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updater) => onUpdate(updater(requests))}
        />
      )}
    </div>
  )
}
