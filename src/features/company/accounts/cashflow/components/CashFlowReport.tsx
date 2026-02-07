'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCashFlowReport } from '@/features/company/accounts/cashflow/actions/cashflowactions'
import { useAppContext } from '@/context/AppContext'
import { CashFlowSection } from '@/types/project-types'
import { toast } from 'sonner'

export default function CashFlowReport() {
  const { appData } = useAppContext()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isPending, startTransition] = useTransition()

  const [operating, setOperating] = useState<CashFlowSection[]>([])
  const [investing, setInvesting] = useState<CashFlowSection[]>([])
  const [financing, setFinancing] = useState<CashFlowSection[]>([])
  const [totals, setTotals] = useState({
    operating: 0,
    investing: 0,
    financing: 0,
    net: 0,
  })

  useEffect(() => {
    const currentYear = new Date().getFullYear()
    setStartDate(`${currentYear}-01-01`)
    setEndDate(`${currentYear}-12-31`)
  }, [])
  
  useEffect(() => {
    if (startDate && endDate) handleGenerate()
  }, [startDate, endDate])

  async function handleGenerate() {
    if (!startDate || !endDate) return
    startTransition(async () => {
      const res = await getCashFlowReport(new Date(startDate), new Date(endDate))
      if ('error' in res) {
        toast.error(res.error || 'Failed to generate cash flow report')
        console.error(res.error)
        return
      }
      setOperating(res.operating)
      setInvesting(res.investing)
      setFinancing(res.financing)
      setTotals(res.totals)
    })
  }

  const renderSection = (title: string, data: CashFlowSection[], total: number) => (
    <div className="mt-6">
      <h2 className="font-semibold text-lg mb-2">{title}</h2>
      <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-900 text-left">
              <th className="p-2 border border-gray-200 dark:border-gray-700">Account Title</th>
              <th className="p-2 border border-gray-200 dark:border-gray-700 text-right">Debit</th>
              <th className="p-2 border border-gray-200 dark:border-gray-700 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="p-2 border border-gray-200 dark:border-gray-700">
                    {row.title}
                  </td>
                  <td className="p-2 border border-gray-200 dark:border-gray-700 text-right">
                    {row.debit.toLocaleString()}
                  </td>
                  <td className="p-2 border border-gray-200 dark:border-gray-700 text-right">
                    {row.credit.toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="p-2 border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400"
                >
                  No transactions found
                </td>
              </tr>
            )}
            <tr className="font-semibold bg-gray-50 dark:bg-gray-800">
              <td className="p-2 border border-gray-200 dark:border-gray-700">
                Total {title}
              </td>
              <td className="p-2 border border-gray-200 dark:border-gray-700 text-right">—</td>
              <td className="p-2 border border-gray-200 dark:border-gray-700 text-right">
                {total.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl w-full mx-auto mt-6 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black space-y-5">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Cash Flow Report (Direct Method)</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Date range controls */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-48"
            />
          </div>
          <div className="flex-1 mt-3 sm:mt-0">
            <label className="block text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-48"
            />
          </div>
          <div className="mt-4 sm:mt-6">
            <Button
              onClick={handleGenerate}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? 'Loading...' : 'Generate'}
            </Button>
          </div>
        </div>

        {/* Report Sections */}
        {renderSection('Operating Activities', operating, totals.operating)}
        {renderSection('Investing Activities', investing, totals.investing)}
        {renderSection('Financing Activities', financing, totals.financing)}

        {/* Net Cash Flow */}
        <div className="mt-8 text-right">
          <h2
            className={`text-lg font-bold ${
              totals.net >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            Net Cash Flow: {totals.net.toLocaleString()}
          </h2>
        </div>
      </CardContent>
    </div>
  )
}
