// src/features/subscription/guards/report.guards.ts

import { subscriptionError } from './subscription-error'
import { getCompanyPlan } from '../utils/subscription-resolver'

export async function assertCanViewReport(
  companyId: number,
  reportType: 'TRIAL_BALANCE' | 'CASH_FLOW' | 'LEDGER' | 'INCOME_STATEMENT' | 'BALANCE_SHEET'
) {
  const plan = await getCompanyPlan(companyId)

  if (
    plan.code === 'FREE' &&
    !['TRIAL_BALANCE', 'CASH_FLOW'].includes(reportType)
  ) {
    subscriptionError('Upgrade your plan to access this report.')
  }
}
