// edit-plan-dialog.tsx
'use client'

import { useState } from 'react'
import { SubscriptionPlan } from '@/types/prisma-types'
import { adminUpdateSubscriptionPlan } from '../actions/plan-actions'

export function EditPlanDialog({
  plan,
  onClose,
}: {
  plan: SubscriptionPlan
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: plan.name,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    maxInvites: plan.maxInvites,
    dailyTransactionLimit: plan.dailyTransactionLimit,
    monthlyBackupLimit: plan.monthlyBackupLimit,
    canViewAllReports: plan.canViewAllReports,
    isAdminOnly: plan.isAdminOnly,
    autoExpireDays: plan.autoExpireDays,
  })

  async function onSave() {
    await adminUpdateSubscriptionPlan(plan.id, form)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white dark:bg-black p-6 rounded-lg w-full max-w-lg space-y-4">
        <h2 className="text-lg font-semibold">
          Edit Plan — <span className="font-mono">{plan.code}</span>
        </h2>

        <input
          className="w-full border p-2"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Monthly Price"
            value={form.monthlyPrice ?? ''}
            onChange={e =>
              setForm({ ...form, monthlyPrice: e.target.value ? Number(e.target.value) : null })
            }
            className="border p-2"
          />
          <input
            type="number"
            placeholder="Yearly Price"
            value={form.yearlyPrice ?? ''}
            onChange={e =>
              setForm({ ...form, yearlyPrice: e.target.value ? Number(e.target.value) : null })
            }
            className="border p-2"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onSave} className="btn-primary">
            Save
          </button>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
