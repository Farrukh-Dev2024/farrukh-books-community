'use client'

import React, { useEffect, useState } from 'react'
import { CompanyUsageRow, adminGetCompanyUsageSummary } from '../actions/usage-actions'
import { CompanyUsageTable } from '../components/company-usage-table'

export default function CompanyUsagePage({ companyId }: { companyId: number }) {
  const [usage, setUsage] = useState<CompanyUsageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUsage = async () => {
      try {
        setLoading(true)
        const data = await adminGetCompanyUsageSummary(companyId)
        setUsage(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load usage')
      } finally {
        setLoading(false)
      }
    }

    loadUsage()
  }, [companyId])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Company Usage</h1>
      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <CompanyUsageTable usage={usage} />
      )}
    </div>
  )
}
