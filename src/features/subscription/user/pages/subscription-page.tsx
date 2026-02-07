'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { getCompanySubscriptionOverview, CompanySubscriptionOverview } from '@/features/subscription/user/actions/get-company-subscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import UpgradeRequestForm from '../components/upgrade-request-form'

export default function SubscriptionPage({ user }: { user: { id: number; companyId: number; companyRole: number } }) {
  const [subscription, setSubscription] = useState<CompanySubscriptionOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const data = await getCompanySubscriptionOverview(user)
        if (data && data != null){
          setSubscription(data)
        }else {
          setError('Failed to load subscription')  
        }
        
      } catch (err: any) {
        setError(err.message || 'Failed to load subscription')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  if (loading) return <p className="text-center mt-10">Loading subscription...</p>
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>
  if (!subscription) return null

  const { plan, status, usage, endsAt, graceEndsAt } = subscription

  // Compute usage percentages
  const dailyPercent =
    plan.dailyTransactionLimit && plan.dailyTransactionLimit > 0
      ? Math.min((usage.dailyTransactions / plan.dailyTransactionLimit) * 100, 100)
      : 0

  const monthlyPercent =
    plan.monthlyBackupLimit && plan.monthlyBackupLimit > 0
      ? Math.min((usage.monthlyBackups / plan.monthlyBackupLimit) * 100, 100)
      : 0

  const isGrace = status === 'GRACE'

  return (
    <div className="max-w-5xl w-full mx-auto mt-6 space-y-5">
      {isGrace && graceEndsAt && (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-200 rounded-lg shadow">
          ⚠️ Your subscription is in grace period until{' '}
          <strong>{new Date(graceEndsAt).toLocaleDateString()}</strong>. New actions may be limited.
        </div>
      )}

      <Card className="shadow-md border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Current Plan: {plan.name}</CardTitle>
          <CardDescription>
            Status:{' '}
            <span
              className={`font-semibold ${status === 'ACTIVE'
                ? 'text-green-600 dark:text-green-400'
                : status === 'GRACE'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
                }`}
            >
              {status}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Limits */}
          <div>
            <p className="font-semibold">Daily Journal Entries:</p>
            {plan.dailyTransactionLimit ? (
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 mt-1">
                <div
                  className={`h-3 rounded-full ${dailyPercent > 80
                    ? 'bg-red-600 dark:bg-red-400'
                    : dailyPercent > 49
                      ? 'bg-yellow-500 dark:bg-yellow-400'
                      : 'bg-blue-600 dark:bg-blue-400'
                    }`}
                  style={{ width: `${dailyPercent}%` }}
                ></div>
              </div>
            ) : (
              <p>Unlimited</p>
            )}
            <p className="text-sm mt-1">
              {usage.dailyTransactions}/{plan.dailyTransactionLimit ?? '∞'}
            </p>
          </div>

          <div>
            <p className="font-semibold">Monthly Backups:</p>
            {plan.monthlyBackupLimit ? (
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 mt-1">
                <div
                  className={`h-3 rounded-full ${monthlyPercent > 80
                      ? 'bg-red-600 dark:bg-red-400'
                      : monthlyPercent > 49
                        ? 'bg-yellow-500 dark:bg-yellow-400'
                        : 'bg-blue-600 dark:bg-blue-400'
                    }`}
                  style={{ width: `${monthlyPercent}%` }}
                ></div>

              </div>
            ) : (
              <p>Unlimited</p>
            )}
            <p className="text-sm mt-1">
              {usage.monthlyBackups}/{plan.monthlyBackupLimit ?? '∞'}
            </p>
          </div>

          {/* Upgrade button */}
          <Button onClick={() => setShowUpgrade(true)} disabled={status === 'EXPIRED'}>
            Request Upgrade / Renew
          </Button>

          {showUpgrade && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
              {/* <p>
                Upgrade requests are manual. Admin will review your request and apply changes.
              </p>
              <Button className="mt-2" onClick={() => setShowUpgrade(false)}>
                Close
              </Button> */}
              <UpgradeRequestForm />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
