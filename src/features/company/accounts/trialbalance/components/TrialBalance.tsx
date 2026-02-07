'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { getTrialBalance } from '@/features/company/accounts/trialbalance/actions/trialbalanceactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrialBalanceRow } from '@/types/project-types'
import { toast } from 'sonner'

export default function TrialBalance() {
  const [rows, setRows] = useState<TrialBalanceRow[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const currentYear = new Date().getFullYear()
  const [startDate] = useState(`${currentYear}-01-01`)
  const [endDate] = useState(`${currentYear}-12-31`)
  const [from, setFrom] = useState(startDate || '')
  const [to, setTo] = useState(endDate || '')

  useEffect(() => {
    startTransition(async () => {
        const data = await getTrialBalance({ from, to })
        if ('error' in data) {
            toast.error(data.error || 'Failed to generate trial balance')
            setError(data.error)
            setRows([])
            return
        }
        setRows(data)
        setError(null)
    })
  }, [from, to])

  const totalDebit = rows.reduce((sum, r) => sum + (r.debit || 0), 0)
  const totalCredit = rows.reduce((sum, r) => sum + (r.credit || 0), 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005

  return (
    <div className="max-w-5xl w-full mx-auto mt-6 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black space-y-5 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Trial Balance
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              From:
            </label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              To:
            </label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-36"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              startTransition(async () => {
                const data = await getTrialBalance({ from, to })
                if ('error' in data) {
                    toast.error(data.error || 'Failed to generate trial balance')
                    setError(data.error)
                    setRows([])
                    return
                }
                setRows(data)
              })
            }}
            disabled={isPending}
          >
            {isPending ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-red-500 font-medium">{error}</p>}

      {/* Table */}
      <div className="overflow-auto border border-gray-100 dark:border-gray-950 rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-900">
            <tr className="text-gray-700 dark:text-gray-300 font-semibold">
              <th className="p-2 text-left">Account</th>
              <th className="p-2 text-right">Debit</th>
              <th className="p-2 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.accountId}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="p-2 border-t border-gray-100 dark:border-gray-700">
                  {r.accountTitle}
                </td>
                <td className="p-2 border-t border-gray-100 dark:border-gray-700 text-right">
                  {r.debit.toFixed(2)}
                </td>
                <td className="p-2 border-t border-gray-100 dark:border-gray-700 text-right">
                  {r.credit.toFixed(2)}
                </td>
              </tr>
            ))}
            <tr className="font-semibold bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              <td className="p-2 border-t border-gray-200 dark:border-gray-700">Total</td>
              <td className="p-2 border-t border-gray-200 dark:border-gray-700 text-right">
                {totalDebit.toFixed(2)}
              </td>
              <td className="p-2 border-t border-gray-200 dark:border-gray-700 text-right">
                {totalCredit.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Message */}
      <div
        className={`text-sm font-medium ${
          isPending
            ? 'text-gray-500 dark:text-gray-400'
            : balanced
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        }`}
      >
        {isPending
          ? 'Loading…'
          : balanced
          ? '✅ Trial balance is balanced'
          : '❌ Trial balance not balanced'}
      </div>
    </div>
  )
}
