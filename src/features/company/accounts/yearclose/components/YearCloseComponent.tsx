// features/company/accounts/yearClose/YearCloseComponent.tsx
'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getIncomeStatement } from '@/features/company/accounts/incomestatement/actions/incomestatementactions'
import { toast } from 'sonner'
import { closeYearAction } from '../actions/closeyearactions'
import { checkYearAlreadyClosed, getYearCloseHistory } from '../actions/closeyearactionshelpers'
import { useYesNoDialog } from '@/features/yesnodialog/useYesNoDialog'

type Props = {
    companyId: string
    defaultStartDate?: string
    defaultEndDate?: string
}

export default function YearCloseComponent({ companyId, defaultStartDate, defaultEndDate }: Props) {
    const { showYesNoDialog, YesNoDialog } = useYesNoDialog()
    const [closingDate, setClosingDate] = useState(
        defaultEndDate || new Date().toISOString().slice(0, 10)
    )

    const [isPending, startTransition] = useTransition()
    const [preview, setPreview] = useState<{ totalIncome: number; totalExpense: number; netIncome: number } | null>(null)
    const [history, setHistory] = useState<any[]>([])
    const [alreadyClosed, setAlreadyClosed] = useState(false)
    const closeYear = new Date(closingDate).getFullYear()

    // ------------------------------------------------------------------
    // Load year close history
    // ------------------------------------------------------------------
    const loadHistory = async () => {
        const res = await getYearCloseHistory(Number(companyId))
        if (Array.isArray(res)) setHistory(res)
    }

    // ------------------------------------------------------------------
    // Check if this fiscal year is already closed
    // ------------------------------------------------------------------
    const checkAlready = async () => {
        const res = await checkYearAlreadyClosed(Number(companyId), closeYear)
        setAlreadyClosed(res?.closed || false)
    }

    useEffect(() => {
        loadHistory()
        checkAlready()
    }, [closingDate])

    // ------------------------------------------------------------------
    // Preview Net Income
    // ------------------------------------------------------------------
    const fetchPreview = async (start?: string, end?: string) => {
        if (!start || !end) return
        try {
            const res = await getIncomeStatement(new Date(start), new Date(end))
            if ('error' in res) {
                setPreview(null)
                return
            }
            setPreview({
                totalIncome: res.totalIncome,
                totalExpense: res.totalExpense,
                netIncome: res.netIncome
            })
        } catch {
            setPreview(null)
        }
    }

    // ------------------------------------------------------------------
    // POST CLOSING ENTRY
    // ------------------------------------------------------------------
    const onClose = async () => {
        if (alreadyClosed) {
            toast.error(`${closeYear} is already closed.`)
            return
        }


        const confirmed = await showYesNoDialog({
            title: 'Close Fiscal Year!',
            content: (
                <div>
                    Are you sure you want to <b>close fiscal year {closeYear}</b>?
                    This will zero Income & Expense accounts and post closing entries.
                    This action{' '}
                    <span className="text-red-500 font-semibold">cannot</span> be undone.
                </div>
            ),
        })
        if (!confirmed) return

        startTransition(async () => {
            const fd = new FormData()
            fd.set('companyId', companyId)
            fd.set('closingDate', closingDate)

            try {
                const res = await closeYearAction(fd)

                if (res?.success) {
                    toast.success(`Closing entry posted successfully for ${closeYear}.`)
                    loadHistory()
                    checkAlready()
                } else {
                    toast.error(res?.message || 'Failed to close year')
                }
            } catch (err) {
                if (err instanceof Error) toast.error(err?.message || 'Unexpected error')
            }
        })
    }

    return (
        <div className="space-y-6 p-4 border rounded-md bg-white dark:bg-gray-900">
            {/* ------------------------------------------------------------------ */}
            {/* Controls */}
            {/* ------------------------------------------------------------------ */}
            <div className="flex items-end gap-4">
                <div>
                    <label className="text-sm block mb-1">Closing Date</label>
                    <Input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} className="w-40" />
                </div>

                <Button
                    variant="outline"
                    onClick={() =>
                        fetchPreview(defaultStartDate || `${new Date().getFullYear()}-01-01`, closingDate)
                    }
                >
                    Preview Net
                </Button>

                <Button disabled={isPending || alreadyClosed} onClick={onClose}>
                    {alreadyClosed ? 'Already Closed' : isPending ? 'Posting...' : 'Post Closing Entry'}
                </Button>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Preview */}
            {/* ------------------------------------------------------------------ */}
            {preview && (
                <div className="text-sm">
                    <div>Total Income: {preview.totalIncome.toLocaleString()}</div>
                    <div>Total Expense: {preview.totalExpense.toLocaleString()}</div>
                    <div className={`font-semibold ${preview.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Net: {preview.netIncome.toLocaleString()}
                    </div>
                </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* Year Close History */}
            {/* ------------------------------------------------------------------ */}
            <div>
                <h3 className="font-semibold mb-2">Year Close History</h3>

                {history.length === 0 && (
                    <div className="text-sm text-gray-500">No year closing entries yet.</div>
                )}

                {history.map((h, idx) => (
                    <div
                        key={idx}
                        className="p-2 text-sm border rounded mb-2 bg-gray-50 dark:bg-gray-800 flex items-center justify-between"
                    >
                        <div>
                            <div>Year: <b>{h.year}</b></div>
                            <div className="text-gray-500">Posted on {h.closingDate}</div>
                            <div>TransactionId: <b>{h.transactionId}</b> </div>
                        </div>

                        {/* <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                                window.location.assign(
                                    `/company/${companyId}/journal?transactionId=${h.transactionId}`
                                )
                            }
                        >
                            View Closing Entry
                        </Button> */}
                    </div>
                ))}
            </div>
            {YesNoDialog}
        </div>
    )
}
