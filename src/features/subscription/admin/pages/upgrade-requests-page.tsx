// src/features/subscription/admin/pages/upgrade-requests-page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { UpgradeRequestRow } from '@/types/prisma-types'
import { adminGetAllUpgradeRequests } from '../actions/upgrade-requests'
import { UpgradeRequestsTable } from '../components/upgrade-requests-table'

export default function AdminUpgradeRequestsPage() {
  const [requests, setRequests] = useState<UpgradeRequestRow[]>([])

  useEffect(() => {
    async function loadRequests() {
      const res = await adminGetAllUpgradeRequests()
      setRequests(res)
    }
    loadRequests()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Upgrade Requests</h1>
      <UpgradeRequestsTable requests={requests} onUpdate={setRequests} />
    </div>
  )
}
