'use client'

import React, { useEffect, useState } from 'react'
//import { assertFullAccess } from '@/features/subscription/guards/company-subscription-access'
import { getAvailablePlans } from '@/features/subscription/user/actions/get-available-plans'
import { requestPlanUpgrade } from '@/features/subscription/user/actions/upgrade-request-actions'
import { useAppContext } from '@/context/AppContext';

export default function UpgradeRequestForm() {
  const [availablePlans, setAvailablePlans] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { appData, setAppData } = useAppContext();

  useEffect(() => {
    async function fetchPlans() {
      try {
        //await assertFullAccess() // ensure user has FullAccess
        const plans = await getAvailablePlans()
        setAvailablePlans(plans)
        if (plans.length > 0) setSelectedPlan(plans[0].code)
      } catch (err: any) {
        setError(err.message || 'Failed to load plans')
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [appData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const user = appData.user;
      const requestedPlan = availablePlans.find((p) => p.code === selectedPlan)
      if (!requestedPlan) throw new Error('Selected plan not found')

       const  result = await requestPlanUpgrade(user?.companyId!, requestedPlan.id, note)
      if (result.success){
        setSuccess(true)
      }else{
        throw new Error(result.message)
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to submit upgrade request')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Select Plan</label>
        <select
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
          className="border rounded p-2 w-full"
        >
          {availablePlans.map((plan) => (
            <option key={plan.id} value={plan.code}>
              {plan.name} ({plan.monthlyPrice ? `$${plan.monthlyPrice}/mo` : 'Free'})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="border rounded p-2 w-full"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        Submit Upgrade Request
      </button>

      {success && <p className="text-green-600">Request submitted successfully!</p>}
    </form>
  )
}
