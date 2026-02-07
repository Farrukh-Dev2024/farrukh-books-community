// src/features/company/payroll/payrun/components/PayRunForm.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPayRun } from '../actions/payrun-actions';
import { generatePaySlipsForRun } from '../actions/payslip-generator';

export default function PayRunForm({ onCreated }: { onCreated?: (payRunId: number) => void }) {
  const [periodStart, setPeriodStart] = React.useState('');
  const [periodEnd, setPeriodEnd] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('periodStart', periodStart);
    formData.append('periodEnd', periodEnd);

    try {
      const res = await createPayRun(formData);
      if (res.success) {
        await generatePaySlipsForRun(res.payRunId!);
        onCreated?.(res.payRunId!);
      } else {
        setError(res.message || 'Failed to create PayRun');
      }
    } catch (err) {
      if (err instanceof Error){
        setError(err.message);
      }else{
        setError('Network error');
      }
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-sm p-6 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md space-y-5"
    >
      <div className="space-y-1">
        <Label htmlFor="periodStart" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Period Start
        </Label>
        <Input
          id="periodStart"
          type="date"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
          required
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="periodEnd" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Period End
        </Label>
        <Input
          id="periodEnd"
          type="date"
          value={periodEnd}
          onChange={(e) => setPeriodEnd(e.target.value)}
          required
          className="w-full"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create PayRun'}
      </Button>
    </form>
  );
}
