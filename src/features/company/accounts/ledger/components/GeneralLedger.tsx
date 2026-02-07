'use client'

import React, { useState, useTransition } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { getGeneralLedgerEntries } from '../actions/ledgeractions'
import { format } from 'date-fns'
import { Account } from '@/types/prisma-types'
import { LedgerEntry } from '@/types/project-types'
import { toast } from 'sonner'

export default function GeneralLedger({ accounts }: { accounts: Account[] }) {
  const [accountId, setAccountId] = useState<number | null>(null)
const currentYear = new Date().getFullYear()
const [startDate, setStartDate] = useState(`${currentYear}-01-01`)
const [endDate, setEndDate] = useState(`${currentYear}-12-31`)
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [isPending, startTransition] = useTransition()

  const handleLoad = async () => {
    if (!accountId) return

    startTransition(async () => {
      const result = await getGeneralLedgerEntries({
        accountId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      })
      if ('error' in result) {
        toast.error(result.error || 'Failed to load general ledger entries')
        console.error(result.error)
        return
      }
      setEntries(result)
    })
  }

  return (
    <Card className="max-w-5xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>General Ledger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Account</label>
            <Select onValueChange={(v) => setAccountId(Number(v))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>
                    {acc.title}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>

          <Button onClick={handleLoad} disabled={isPending || !accountId}>
            {isPending ? 'Loading...' : 'Load Ledger'}
          </Button>
        </div>

        {/* Table */}
        {entries.length > 0 ? (
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-right p-2">Debit</th>
                  <th className="text-right p-2">Credit</th>
                  <th className="text-right p-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="p-2">{format(new Date(e.date), 'yyyy-MM-dd')}</td>
                    <td className="p-2">{e.description}</td>
                    <td className="p-2 text-right">{e.debit ? e.debit.toFixed(2) : '-'}</td>
                    <td className="p-2 text-right">{e.credit ? e.credit.toFixed(2) : '-'}</td>
                    <td className="p-2 text-right font-medium">{e.balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-4">No entries found for the selected criteria.</p>
        )}
      </CardContent>
    </Card>
  )
}
