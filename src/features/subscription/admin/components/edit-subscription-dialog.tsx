'use client'

import * as React from 'react'
import { SubscriptionRow } from '@/types/prisma-types'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
    adminForceChangeCompanyPlan,
    adminExtendGracePeriod,
} from '../actions/company-subscription-actions'
import { SubscriptionStatus } from '@/types/prisma-types'
import { adminGetAllSubscriptionPlans } from '../actions/plan-actions'

export function EditSubscriptionDialog({
    subscription,
}: {
    subscription: SubscriptionRow
}) {
    const [open, setOpen] = React.useState(false)
    const [plans, setPlans] = React.useState<{ code: string; name: string }[]>([])
    const [planCode, setPlanCode] = React.useState<string | null>(null)
    const [status, setStatus] = React.useState<SubscriptionStatus | null>(null)
    const [extendDays, setExtendDays] = React.useState<number>(0)
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        if (!open) return
            ; (async () => {
                const res = await adminGetAllSubscriptionPlans()
                setPlans(res)
            })()
    }, [open])

    async function onSubmit() {
        setLoading(true)

        try {
            if (planCode && planCode !== subscription.planCode) {

                const billingCycle =
                    subscription.billingCycle === 'MONTHLY' ||
                        subscription.billingCycle === 'YEARLY'
                        ? subscription.billingCycle
                        : null

                if (!billingCycle) {
                    throw new Error('Invalid billing cycle')
                }
                await adminForceChangeCompanyPlan(
                    subscription.companyId,
                    planCode,
                    billingCycle
                )
            }

            if (extendDays > 0) {
                await adminExtendGracePeriod(subscription.companyId, extendDays)
            }

            // status is derived by actions above; explicit setter intentionally avoided
            setOpen(false)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Edit
                </Button>
            </DialogTrigger>

            <DialogContent className="space-y-4">
                <DialogHeader>
                    <DialogTitle>Edit Subscription</DialogTitle>
                </DialogHeader>

                {/* Plan */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">Plan</label>
                    <Select onValueChange={setPlanCode}>
                        <SelectTrigger>
                            <SelectValue placeholder={subscription.planName} />
                        </SelectTrigger>
                        <SelectContent>
                            {plans.map(p => (
                                <SelectItem key={p.code} value={p.code}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                        defaultValue={subscription.status}
                        onValueChange={v => setStatus(v as SubscriptionStatus)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(SubscriptionStatus).map(s => (
                                <SelectItem key={s} value={s}>
                                    {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Extend */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">Extend (days)</label>
                    <Input
                        type="number"
                        min={0}
                        value={extendDays}
                        onChange={e => setExtendDays(Number(e.target.value))}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onSubmit} disabled={loading}>
                        Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
