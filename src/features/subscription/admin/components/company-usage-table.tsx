'use client'

import React from 'react'
import { CompanyUsageRow } from '../actions/usage-actions'

export function CompanyUsageTable({ usage }: { usage: CompanyUsageRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border rounded-md">
        <thead className="bg-gray-100 dark:bg-gray-900">
          <tr>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-right">Journal Entries</th>
            <th className="p-2 text-right">Backups</th>
          </tr>
        </thead>
        <tbody>
          {usage.map((row, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-2">{row.type}</td>
              <td className="p-2">{row.dateLabel}</td>
              <td className="p-2 text-right">{row.journalEntries}</td>
              <td className="p-2 text-right">{row.backups}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
