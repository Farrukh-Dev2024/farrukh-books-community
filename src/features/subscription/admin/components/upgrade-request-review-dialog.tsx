// src/features/subscription/admin/components/upgrade-request-review-dialog.tsx
'use client'

import React, { useState } from 'react'
import { UpgradeRequestRow } from '@/types/prisma-types'
import { adminReviewUpgradeRequest, adminReviewUpgradeRequestToTester } from '../actions/upgrade-requests'
import { adminAssignWebsiteTesterPlan } from '../actions/company-subscription-actions'

export function UpgradeRequestReviewDialog({
    request,
    onClose,
    onUpdate,
}: {
    request: UpgradeRequestRow
    onClose: () => void
    onUpdate: (
        updater: (prev: UpgradeRequestRow[]) => UpgradeRequestRow[]
    ) => void

}) {
    const [loading, setLoading] = useState(false)
    const [rows, setRows] = useState<UpgradeRequestRow[]>([])

    async function handleDecision(approve: boolean) {
        setLoading(true)

        const updated = await adminReviewUpgradeRequest(
            request.id,
            approve,
            0 // reviewerId placeholder
        )

        onUpdate(prev =>
            prev.map(r =>
                r.id === request.id
                    ? {
                        ...r,
                        status: updated.request.status as unknown as UpgradeRequestRow['status'],
                        reviewedAt: updated.request.reviewedAt,
                    }
                    : r
            )
        )

        setLoading(false)
        onClose()
    }

    async function approveToTester(approve: boolean) {
        setLoading(true)

        const updated = await adminReviewUpgradeRequestToTester(
            request.id,
            approve,
            0 // reviewerId placeholder
        )

        onUpdate(prev =>
            prev.map(r =>
                r.id === request.id
                    ? {
                        ...r,
                        status: updated.request.status as unknown as UpgradeRequestRow['status'],
                        reviewedAt: updated.request.reviewedAt,
                    }
                    : r
            )
        )

        setLoading(false)
        onClose()
    }
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-black p-6 rounded-lg w-full max-w-md space-y-4">
                <h2 className="text-lg font-semibold">Review Upgrade Request</h2>
                <p>
                    <strong>Company:</strong> {request.companyTitle}
                </p>
                <p>
                    <strong>Current Plan:</strong> {request.currentPlanName}
                </p>
                <p>
                    <strong>Requested Plan:</strong> {request.requestedPlanName}
                </p>
                <p>
                    <strong>Note:</strong> {request.note || '—'}
                </p>

                <div className="flex gap-2">
                    <button
                        onClick={() => handleDecision(true)}
                        disabled={loading}
                        className="btn-primary"
                    >
                        Approve
                    </button>
                    <button
                        onClick={() => approveToTester(true)}
                        disabled={loading}
                        className="bg-red-400"
                    >
                        ApproveToTester
                    </button>                    
                    <button
                        onClick={() => handleDecision(false)}
                        disabled={loading}
                        className="btn-secondary"
                    >
                        Reject
                    </button>
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
