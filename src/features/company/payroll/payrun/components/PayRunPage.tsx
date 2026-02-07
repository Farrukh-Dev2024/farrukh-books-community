'use client';

import * as React from 'react';
import PayRunForm from './PayRunForm';
import PaySlipsList from './PaySlipsList';
import { getPayRuns } from '../actions/query-actions';
import PayRunDetail from './PayRunDetail';
import { Router } from 'next/router';
import { Button } from '@/components/ui/button';
import { PaySlip } from './PayRunDetail';

/* ✅ ADDED: minimal PayRun type (only what is used) */
type PayRun = {
  id: number;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  createdAt: Date;
  cashedOut?: boolean | null;
  paySlips?: PaySlip[];
};

export type PayRunSummary = {
  month: number;
  year: number;
  status: string;
  createdOn: Date | string;
  payslips: PaySlip[];
  cashOut: boolean;
};

export default function PayRunPage({ companyId }: { companyId: number }) {
  const [payRunId, setPayRunId] = React.useState<number | null>(null);

  const [payRuns, setPayRuns] = React.useState<PayRun[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [payRunSummary, setPayRunSummary] =
    React.useState<PayRunSummary | null>(null);

  // Load previous PayRuns
  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getPayRuns();
      setPayRuns((data as unknown as PayRun[]) || []);
      setLoading(false);
    }
    load();
  }, [companyId]);

  function updatePayRunSummary(selectedPayRun: PayRun | null) {
    if (selectedPayRun) {
      setPayRunSummary({
        month: selectedPayRun.periodStart.getMonth() + 1,
        year: selectedPayRun.periodStart.getFullYear(),
        status: selectedPayRun.status,
        createdOn: selectedPayRun.createdAt,
        payslips:
          selectedPayRun.paySlips ??
          [],
        cashOut: selectedPayRun.cashedOut ?? false,
      });
    }
  }

  function handleEditPayRun() {
    getPayRuns().then((runs) => {
      setPayRuns(runs as unknown as PayRun[] || []);
      setPayRunId(null);
    });
  }

  return (
    <div className="space-y-8 max-w-5xl w-full mx-auto mt-6">
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">
        Payroll - PayRun
      </h1>

      <div className="flex flex-row flex-wrap gap-6 justify-center">
        <PayRunForm
          onCreated={async (id) => {
            const runs = await getPayRuns();
            setPayRuns(runs as unknown as PayRun[] || []);
          }}
        />

        <div className="w-lg h-100 overflow-y-scroll border border-gray-200 dark:border-gray-700 rounded-2xl p-6 bg-gray-50 dark:bg-black space-y-4 shadow-sm">
          <h2 className="font-semibold text-lg text-gray-700 dark:text-gray-300">
            Previous PayRuns
          </h2>

          <Button
            onClick={async () => {
              setLoading(true);
              const runs = await getPayRuns();
              setPayRuns(runs as unknown as PayRun[] || []);
              setLoading(false);
            }}
            className="w-fit"
            variant="default"
          >
            Refesh
          </Button>

          {loading && (
            <p className="text-gray-500 dark:text-gray-400">Loading…</p>
          )}

          {!loading && payRuns.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No PayRuns created yet.
            </p>
          )}

          {!loading && payRuns.length > 0 && (
            <div className="space-y-2">
              {payRuns.map((run) => (
                <button
                  key={run.id}
                  onClick={() => {
                    setPayRunId(run.id);
                    updatePayRunSummary(run);
                  }}
                  className={`w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors duration-200 ${
                    payRunId === run.id
                      ? 'bg-accent text-white dark:bg-accent-dark'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="font-semibold text-gray-800 dark:text-gray-100">
                    PayRun #{run.id}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {run.periodStart.toISOString().split('T')[0]} —{' '}
                    {run.periodEnd.toISOString().split('T')[0]}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {payRunId && (
        <div className="space-y-5 mt-6">
          <PayRunDetail
            payRunId={payRunId}
            month={payRunSummary?.month.toString() ?? ''}
            year={payRunSummary?.year.toString() ?? ''}
            status={payRunSummary?.status ?? ''}
            createdOn={payRunSummary?.createdOn.toString() ?? ''}
            payslips={payRunSummary?.payslips ?? []}
            onEdit={handleEditPayRun}
            onDelete={handleEditPayRun}
            cashOut={payRunSummary?.cashOut}
          />
        </div>
      )}
    </div>
  );
}
