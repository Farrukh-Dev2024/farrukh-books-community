'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getBalanceSheet } from '@/features/company/accounts/balancesheet/actions/balancesheetactions'
import { useAppContext } from '@/context/AppContext'
import { BalanceSheetResult, BalanceSheetSection } from '@/types/project-types'
import { toast } from 'sonner'

export default function BalanceSheet() {
  const { appData } = useAppContext()
  const [sheet, setSheet] = useState<BalanceSheetResult>(null)
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isPending, startTransition] = useTransition()

  const companyId = appData.user?.companyId || undefined

  async function handleGenerate() {
    if (!companyId) return
    startTransition(async () => {
      const res = await getBalanceSheet(new Date(date))
      if ('error' in res) {
        toast.error(res.error || 'Failed to generate balance sheet');
        console.error(res.error)
        return
      }
      setSheet(res)
    })
  }

  useEffect(() => {
    handleGenerate()
  }, [])

  if (!sheet)
    return <div className="text-center mt-8">Loading...</div>

  const isContra = (title: string) =>
    title.toLowerCase().includes('contra') ||
    title.toLowerCase().includes('allowance') ||
    title.toLowerCase().includes('discount')

  const renderSection = (title: string, data: BalanceSheetSection[], total: number) => (
    <div className="mt-6">
      <h2 className="font-semibold text-lg mb-2">{title}</h2>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-900">
            <tr className="text-left">
              <th className="p-2 border-t border-gray-200 dark:border-gray-700">Account Title</th>
              <th className="p-2 border-t border-gray-200 dark:border-gray-700 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.map((a, i) => (
              <React.Fragment key={i}>
                <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isContra(a.title) ? 'text-gray-500 italic' : ''}`}>
                  <td className={`p-2 border-t border-gray-200 dark:border-gray-700 ${isContra(a.title) ? 'pl-6' : ''}`}>
                    {a.title}
                  </td>
                  <td className="p-2 border-t border-gray-200 dark:border-gray-700 text-right">
                    {a.balance.toLocaleString()}
                  </td>
                </tr>
                {a.contraAccounts.length > 0 &&
                  a.contraAccounts.map((c, j) => (
                    <tr key={`${i}-${j}`} className="text-gray-500 italic hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-2 border-t border-gray-200 dark:border-gray-700 pl-8">({c.title})</td>
                      <td className="p-2 border-t border-gray-200 dark:border-gray-700 text-right">
                        ({c.balance.toLocaleString()})
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
            <tr className="font-semibold bg-gray-50 dark:bg-gray-800">
              <td className="p-2 border-t border-gray-200 dark:border-gray-700">Total {title}</td>
              <td className="p-2 border-t border-gray-200 dark:border-gray-700 text-right">{total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )

  const totalAssets = sheet.totalAssets
  const totalLiabilitiesEquity = sheet.totalLiabilities + sheet.totalEquity
  const isBalanced = totalAssets === totalLiabilitiesEquity

  return (
    <div className="max-w-5xl w-full mx-auto mt-6 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <h3 className="text-lg font-semibold">Balance Sheet</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">As of:</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={isPending}
          >
            {isPending ? 'Loading…' : 'Generate'}
          </Button>
        </div>
      </div>

      {renderSection('Assets', sheet.assets, sheet.totalAssets)}
      {renderSection('Liabilities', sheet.liabilities, sheet.totalLiabilities)}

      {/* Render Equity */}
      <div className="mt-6">
        <h2 className="font-semibold text-lg mb-2">Equity</h2>
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr className="text-left">
                <th className="p-2 border-t border-gray-200 dark:border-gray-700">Account Title</th>
                <th className="p-2 border-t border-gray-200 dark:border-gray-700 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {sheet.equity.map((a, i) => {
                // show Drawings as negative
                const isDrawing = a.title.toLowerCase().includes('drawing')
                const displayBalance = isDrawing ? -a.balance : a.balance
                return (
                  <tr key={i} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isDrawing ? 'text-red-600 italic' : ''}`}>
                    <td className={`p-2 border-t border-gray-200 dark:border-gray-700`}>
                      {a.title}
                    </td>
                    <td className="p-2 border-t border-gray-200 dark:border-gray-700 text-right">
                      {displayBalance.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
              <tr className="font-semibold bg-gray-50 dark:bg-gray-800">
                <td className="p-2 border-t border-gray-200 dark:border-gray-700">Total Equity</td>
                <td className="p-2 border-t border-gray-200 dark:border-gray-700 text-right">{sheet.totalEquity.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>


      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
        <div className="flex justify-between font-semibold">
          <span>Total Assets</span>
          <span>{totalAssets.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total Liabilities + Equity</span>
          <span>{totalLiabilitiesEquity.toLocaleString()}</span>
        </div>
        <div className={`text-sm font-semibold text-right ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
          {isBalanced ? '✅ Balanced: Assets = Liabilities + Equity' : '❌ Not Balanced: Please review entries'}
        </div>
      </div>
    </div>
  )
}
