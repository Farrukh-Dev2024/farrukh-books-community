'use client'

import React, { useState, useTransition } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createJournalEntry } from '@/features/company/accounts/journal/actions/journalactions'
import { toast } from 'sonner'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Account } from '@/types/prisma-types'
import { useYesNoDialog } from '@/features/yesnodialog/useYesNoDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ✅ Schema validation
const lineSchema = z.object({
  accountId: z.number().min(1, 'Select account'),
  side: z.boolean(),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().optional(),
})

const formSchema = z.object({
  date: z.string(),
  description: z.string().optional(),
  lines: z
    .array(lineSchema)
    .min(2, 'At least two lines are required')
    .refine(lines => {
      const debit = lines.filter(l => l.side).reduce((s, l) => s + l.amount, 0)
      const credit = lines.filter(l => !l.side).reduce((s, l) => s + l.amount, 0)
      return debit === credit
    }, { message: 'Debits and credits must balance' }),
})

export default function JournalEntryForm({ accounts }: { accounts: Account[] }) {
  const [isPending, startTransition] = useTransition()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState([
    { accountId: 0, side: true, amount: 0, description: '' },
    { accountId: 0, side: false, amount: 0, description: '' },
  ])
  const { showYesNoDialog, YesNoDialog } = useYesNoDialog()

  const addLine = () =>
    setLines([...lines, { accountId: 0, side: true, amount: 0, description: '' }])

  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i))

  const handleChange = (i: number, field: string, value: string | number | boolean) => {
    const updated = [...lines]
    updated[i] = { ...updated[i], [field]: value }
    setLines(updated)
  }

  const totalDebit = lines.filter(l => l.side).reduce((s, l) => s + (Number(l.amount) || 0), 0)
  const totalCredit = lines.filter(l => !l.side).reduce((s, l) => s + (Number(l.amount) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const confirmed = await showYesNoDialog({
      content: (
        <div>
          Are you sure you want to add this <b>Journal Entry</b>? <br />
          This action <span className="text-red-500 font-semibold">cannot</span> be undone.
        </div>
      ),
    })
    if (!confirmed) return

    try {
      const parsed = formSchema.parse({
        date: date ? date.toISOString() : '',
        description,
        lines,
      })
      startTransition(async () => {
        const res = await createJournalEntry(parsed.lines, parsed.date, parsed.description)
        if (res?.success) {
          toast.success(`Journal entry #${res.transactionId} added successfully`)
          setDescription('')
          setLines([
            { accountId: 0, side: true, amount: 0, description: '' },
            { accountId: 0, side: false, amount: 0, description: '' },
          ])
        }
      })
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors?.[0]?.message || 'Validation failed')
      } else if (err instanceof Error) {
        toast.error(err.message || 'Validation failed')
      } else {
        toast.error('Validation failed')
      }
    }
  }

  return (
    <Card className="max-w-4xl w-full mx-auto mt-6 shadow-md border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white text-center">
          Add Journal Entry
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          {/* Date & Description */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-col flex-1 space-y-2">
              <Label>Date & Time</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal ',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'yyyy-MM-dd') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={date ? format(date, 'HH:mm') : ''}
                  onChange={e => {
                    if (!date) return
                    const [hours, minutes] = e.target.value.split(':').map(Number)
                    const newDate = new Date(date)
                    newDate.setHours(hours)
                    newDate.setMinutes(minutes)
                    setDate(newDate)
                  }}
                  className="w-full sm:w-40"
                />
              </div>
            </div>

            <div className="flex flex-col flex-1 space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Overall description"
              />
            </div>
          </div>

          {/* Journal Lines */}
          <div className="space-y-3">
            <div className="hidden md:grid grid-cols-12 font-semibold text-sm border-b pb-2 text-gray-600">
              <span className="col-span-3">Account</span>
              <span className="col-span-2 text-center">Debit?</span>
              <span className="col-span-2">Amount</span>
              <span className="col-span-3">Description</span>
              <span className="col-span-2 text-right">Action</span>
            </div>

            {lines.map((line, i) => (
              <div
                key={i}
                className="flex flex-col md:grid md:grid-cols-12 gap-3 md:items-center border-b pb-3 pt-2"
              >
                <div className="md:col-span-4">
                  <Select
                    value={line.accountId ? String(line.accountId) : ''}
                    onValueChange={val => handleChange(i, 'accountId', Number(val))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={String(acc.id)}>
                          {acc.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-1 flex justify-center items-center">
                  <Switch
                    checked={line.side}
                    onCheckedChange={val => handleChange(i, 'side', val)}
                  />
                  <span className="ml-2 text-sm text-gray-600 md:hidden">
                    {line.side ? 'Debit' : 'Credit'}
                  </span>
                </div>

                <div className="md:col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.amount}
                    onChange={e =>
                      handleChange(i, 'amount', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-3">
                  <Input
                    value={line.description}
                    onChange={e => handleChange(i, 'description', e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeLine(i)}
                    disabled={lines.length <= 2}
                    className="w-full md:w-auto"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-center">
              <Button type="button" onClick={addLine} variant="outline" className="w-full md:w-auto">
                + Add Line
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between font-semibold text-gray-700 text-sm border-t pt-3 gap-2">
            <div>Total Debit: {totalDebit.toFixed(2)}</div>
            <div>Total Credit: {totalCredit.toFixed(2)}</div>
          </div>

          <Button
            type="submit"
            disabled={isPending || totalDebit !== totalCredit || totalDebit === 0}
            className="w-full"
          >
            {isPending ? 'Saving...' : 'Submit Journal Entry'}
          </Button>

          {YesNoDialog}
        </form>
      </CardContent>
    </Card>
  )
}
