'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getJournalTransactions, deleteJournalEntry } from '../actions/journalactions'
import { Loader2, Trash2 } from 'lucide-react'
import { JournalLine, JournalEntry } from '@/types/project-types'
import { toast } from 'sonner'
import { useYesNoDialog } from '@/features/yesnodialog/useYesNoDialog'

export default function JournalList() {
  const [isPending, startTransition] = useTransition()
  const [page, setPage] = useState(1)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const { showYesNoDialog, YesNoDialog } = useYesNoDialog()

  useEffect(() => {
    startTransition(async () => {
      const res = await getJournalTransactions(page, 10)
      setEntries(res.data)
      setTotalPages(res.totalPages)
    })
  }, [page])

  const handleDelete = (transactionId: number) => {
    showYesNoDialog({
      title: 'Delete Journal Entry?',
      content: (
        <div>
          Are you sure you want to delete transaction #
          <b>{transactionId}</b>?<br />
          This action{' '}
          <span className="text-red-500 font-semibold">cannot</span> be undone.
          <span className='font-semibold text-amber-500 '> Journal entry should not be deleted , it should be <span className='text-green-400 font-bold'>reversed instead.</span>  </span>
        </div>
      ),
      onYes: async () => {
        startTransition(async () => {
          const res = await deleteJournalEntry(transactionId)
          if (res?.success) {
            toast.success('Journal entry deleted')
            setEntries(prev => prev.filter(e => e.transactionId !== transactionId))
          } else {
            toast.error(res?.message || 'Failed to delete entry')
          }
        })
      },
    })
  }

  if (isPending && entries.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin text-gray-500 dark:text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl w-full mx-auto mt-6 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black space-y-5">
      {YesNoDialog}
      <h2 className="text-lg md:text-xl font-semibold text-center text-gray-800 dark:text-gray-100">
        Journal Entries
      </h2>

      {entries.length === 0 ? (
        <Card className="shadow-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <CardContent className="py-6 text-center text-gray-600 dark:text-gray-400">
            No journal entries found.
          </CardContent>
        </Card>
      ) : (
        entries.map(entry => (
          <Card
            key={entry.transactionId}
            className="shadow-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
          >
            <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/60">
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Transaction #{entry.transactionId}
              </CardTitle>
              <div className="flex flex-col sm:items-end gap-1 mt-2 sm:mt-0">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(entry.entryDate).toLocaleString()}
                </div>
                <div className="italic text-sm text-gray-600 dark:text-gray-400">
                  Entered By: {entry.userName}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(entry.transactionId)}
                  className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 md:p-6">
              {entry.description && (
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {entry.description}
                </p>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-t border-gray-200 dark:border-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="text-left py-2 px-3 w-[30%] font-medium">
                        Account
                      </th>
                      <th className="text-center py-2 px-3 w-[15%] font-medium">
                        Side
                      </th>
                      <th className="text-right py-2 px-3 w-[20%] font-medium">
                        Amount
                      </th>
                      <th className="text-left py-2 px-3 w-[35%] font-medium">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.lines.map((line: JournalLine, i: number) => (
                      <tr
                        key={i}
                        className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-2 px-3 truncate text-gray-800 dark:text-gray-200">
                          {line.accountTitle}
                        </td>
                        <td className="text-center py-2 px-3 text-gray-700 dark:text-gray-300">
                          {line.side ? 'Debit' : 'Credit'}
                        </td>
                        <td className="text-right py-2 px-3 text-gray-800 dark:text-gray-100">
                          {line.amount.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400 truncate">
                          {line.description || '-'}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-semibold border-t border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/70 text-gray-800 dark:text-gray-100">
                      <td className="py-2 px-3 text-right" colSpan={2}>
                        Totals:
                      </td>
                      <td className="text-right py-2 px-3">
                        {entry.totalDebit.toFixed(2)}
                      </td>
                      <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">
                        {entry.totalCredit.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <div className="flex justify-center items-center gap-4 mt-6 text-gray-700 dark:text-gray-300">
        <Button
          variant="outline"
          disabled={page <= 1 || isPending}
          onClick={() => setPage(p => p - 1)}
          className="dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Prev
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={page >= totalPages || isPending}
          onClick={() => setPage(p => p + 1)}
          className="dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
