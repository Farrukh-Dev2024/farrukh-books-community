'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
//import { generateDraftPaySlips } from '../actions/payrun-actions';
import { useAppContext } from '@/context/AppContext';
import { generatePaySlipsForRun } from '../actions/payslip-generator';

interface PaySlip {
  employee: string;
  payslipId: number;
  grossPay?: number;
  totalAllowances?: number;
  totalDeductions?: number;
  netPay?: number;
  status?: string;
}

export default function PaySlipsList({ payRunId,  }: { payRunId: number  }) {
    const { appData, setAppData } = useAppContext();
  const [payslips, setPayslips] = React.useState<PaySlip[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

    const companyId = appData?.user?.companyId
  React.useEffect(() => {
    if (!payRunId || !companyId) return;

    setLoading(true);
    setError(null);

    /**
     * we have PayRunform to generate payruns and payslips 
     * so here we just fetch the payslips for the given payrun same function returns them again
     */
    generatePaySlipsForRun(payRunId)
      .then((res) => {
        if (res.success && 'slips' in res) {
          setPayslips(res.slips ?? []);
        } else {
          setError(res.message || 'Failed to load payslips');
        }
      })
      .catch((err) => setError(err.message || 'Unknown error'))
      .finally(() => setLoading(false));
  }, [payRunId, companyId]);

  if (loading) return <p>Loading payslips...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (payslips.length === 0) return <p>No payslips found</p>;

  return (
    <div className="space-y-4">
      {payslips.map((ps) => (
        <Card key={ps.payslipId} className="p-4">
          <CardHeader>
            <CardTitle>{ps.employee}</CardTitle>
          </CardHeader>
          <CardContent>
            {ps.grossPay !== undefined && <p>Gross Pay: {ps.grossPay}</p>}
            {ps.totalAllowances !== undefined && <p>Total Allowances: {ps.totalAllowances}</p>}
            {ps.totalDeductions !== undefined && <p>Total Deductions: {ps.totalDeductions}</p>}
            {ps.netPay !== undefined && <p>Net Pay: {ps.netPay}</p>}
            {ps.status && <p>Status: {ps.status}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
