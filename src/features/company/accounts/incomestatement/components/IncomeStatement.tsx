'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getIncomeStatement } from '@/features/company/accounts/incomestatement/actions/incomestatementactions'
import { IncomeStatementRow } from '@/types/project-types'
import { useAppContext } from '@/context/AppContext'
import { toast } from 'sonner'

export default function IncomeStatement() {
  const { appData } = useAppContext()
  const [rowsIncome, setRowsIncome] = useState<IncomeStatementRow[]>([])
  const [rowsExpense, setRowsExpense] = useState<IncomeStatementRow[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [netIncome, setNetIncome] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isPending, startTransition] = useTransition()

  let companyId = appData.user?.companyId || undefined

  useEffect(() => {
    const currentYear = new Date().getFullYear()
    setStartDate(`${currentYear}-01-01`)
    setEndDate(`${currentYear}-12-31`)
    companyId = appData.user?.companyId || undefined
  }, [])

  useEffect(() => {
    if (startDate && endDate && companyId) {
      handleGenerate()
    }
  }, [startDate, endDate, companyId])

  async function handleGenerate() {
    if (!startDate || !endDate || !companyId) return
    startTransition(async () => {
      const res = await getIncomeStatement(new Date(startDate), new Date(endDate))
      if ('error' in res) {
        toast.error(res.error || 'Failed to generate income statement')
        console.error(res.error)
        return;
      }
      setRowsIncome(res.income || [])
      setRowsExpense(res.expenses || [])
      setTotalIncome(res.totalIncome || 0)
      setTotalExpense(res.totalExpense || 0)
      setNetIncome(res.netIncome || 0)
    })      

  }

  const isContra = (title: string) =>
    title.toLowerCase().includes('contra') ||
    title.toLowerCase().includes('allowance') ||
    title.toLowerCase().includes('discount')

  return (
    <div className="max-w-5xl w-full mx-auto mt-6 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black space-y-5 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Income Statement
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              From:
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              To:
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={isPending}
          >
            {isPending ? 'Loading…' : 'Generate'}
          </Button>
        </div>
      </div>

      {/* INCOME SECTION */}
      <div>
        <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2">
          Income
        </h2>
        <div className="overflow-auto border border-gray-100 dark:border-gray-950 rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr className="text-gray-700 dark:text-gray-300 font-semibold">
                <th className="p-2 text-left">Account Title</th>
                <th className="p-2 text-right">Debit</th>
                <th className="p-2 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {rowsIncome.map((row, i) => (
                <tr key={i}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isContra(row.title) ? 'text-gray-500 italic' : ''
                    }`}>
                  <td className="p-2 border-t border-gray-100 dark:border-gray-700">
                    {isContra(row.title) ? `Less: ${row.title}` : row.title}
                  </td>
                  <td className="p-2 border-t border-gray-100 dark:border-gray-700 text-right">
                    {isContra(row.title) ? `(${row.debit.toLocaleString()})` : row.debit.toLocaleString()}
                  </td>
                  <td className="p-2 border-t border-gray-100 dark:border-gray-700 text-right">
                    {isContra(row.title) ? `(${row.credit.toLocaleString()})` : row.credit.toLocaleString()}
                  </td>
                </tr>
              ))}

              <tr className="font-semibold bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                <td className="p-2 border-t border-gray-200 dark:border-gray-700">
                  Net Income
                </td>
                <td className="p-2 border-t border-gray-200 dark:border-gray-700 text-right">—</td>
                <td className="p-2 border-t border-gray-200 dark:border-gray-700 text-right">
                  {totalIncome.toLocaleString()}
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* EXPENSE SECTION */}
      <div>
        <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2">
          Expenses
        </h2>
        <div className="overflow-auto border border-gray-100 dark:border-gray-950 rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr className="text-gray-700 dark:text-gray-300 font-semibold">
                <th className="p-2 text-left">Account Title</th>
                <th className="p-2 text-right">Debit</th>
                <th className="p-2 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {rowsExpense.map((row, i) => (
                <tr
                  key={i}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isContra(row.title) ? 'text-gray-500 italic' : ''
                    }`}
                >
                  <td className="p-2 border-t border-gray-100 dark:border-gray-700">
                    {row.title}
                  </td>
                  <td className="p-2 border-t border-gray-100 dark:border-gray-700 text-right">
                    {row.debit.toLocaleString()}
                  </td>
                  <td className="p-2 border-t border-gray-100 dark:border-gray-700 text-right">
                    {row.credit.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                <td className="p-2 border-t border-gray-200 dark:border-gray-700">
                  Total Expenses
                </td>
                <td className="p-2 border-t border-gray-200 dark:border-gray-700 text-right">
                  {totalExpense.toLocaleString()}
                </td>
                <td className="p-2 border-t border-gray-200 dark:border-gray-700 text-right">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* NET INCOME */}
      <div className="text-right">
        <h2
          className={`text-lg font-bold ${netIncome >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
            }`}
        >
          Net Income: {netIncome.toLocaleString()}
        </h2>
      </div>
    </div>
  )
}
