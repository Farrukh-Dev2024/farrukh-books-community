"use client";
import * as React from "react";
import { useState, Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updatePaySlipItem, updateBasePay, approvePayRun, editPayRun, deletePayRun, performCashOut } from "../actions/payrun-actions";
import { generatePaySlipsForRun } from "../actions/payslip-generator";
import { getPayRunDetails } from "../actions/query-actions";
import PaySlipView from "./PaySlipView";
import PrintablePayslipDialog from "./PaySlipView";
import { useAppContext } from '@/context/AppContext'
import { useYesNoDialog } from '@/features/yesnodialog/useYesNoDialog'
import { toast } from "sonner";

export type PaySlipItem = { id: number; title: string; amount: string; type: "ALLOWANCE" | "DEDUCTION" };
export type PaySlip = { id: number; employeeName: string; basicPay: string; paySlipItems: PaySlipItem[] };
export type PayRunDetailProps = { payRunId: number; month: string; year: string; status: string; createdOn: string; payslips: PaySlip[]; onDelete?: (payRunId: number) => void; onEdit?: (payRunId: number) => void; cashOut?: boolean; };

export default function PayRunDetail({ payRunId, month, year, status: initialStatus, createdOn, payslips: initialPayslips, onDelete, onEdit, cashOut }: PayRunDetailProps) {
  const { appData, setAppData } = useAppContext()
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editAmounts, setEditAmounts] = useState<Record<string, string>>({});
  const [payslips, setPayslips] = useState(initialPayslips);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const { showYesNoDialog, YesNoDialog } = useYesNoDialog()


  React.useEffect(() => {
    // Sync props to internal state
    setPayslips(initialPayslips);
    setStatus(initialStatus);

    // Optional resets to avoid stale UI on payrun change
    setExpanded(null);
    setEditAmounts({});
    setLoading(false);

  }, [
    payRunId,
    month,
    year,
    initialStatus,
    createdOn,
    initialPayslips,
    cashOut
  ]);


  const toggleRow = (index: number) => setExpanded(expanded === index ? null : index);

  const calculateTotals = (ps: PaySlip) => {
    let allowance = 0, deduction = 0;
    ps.paySlipItems.forEach(item => {
      const amt = parseFloat(editAmounts[`${item.id}`] ?? item.amount);
      item.type === "ALLOWANCE" ? allowance += amt : deduction += amt;
    });
    const basicPay = parseFloat(editAmounts[`base_${ps.id}`] ?? ps.basicPay);
    return { allowance, deduction, basicPay, netPay: basicPay + allowance - deduction };
  };

  const handleItemChange = (itemId: number, value: string) => setEditAmounts(prev => ({ ...prev, [itemId]: value }));
  const handleBasePayChange = (psId: number, value: string) => setEditAmounts(prev => ({ ...prev, [`base_${psId}`]: value }));

  const savePaySlipItem = async (psId: number, item: PaySlipItem) => {
    const newAmount = editAmounts[item.id]; if (!newAmount || newAmount === item.amount) return;
    try {
      setLoading(true);
      const res = await updatePaySlipItem({ paySlipItemId: item.id, newAmount });
      if (!res.success) return toast.error(res.message);
      await refreshPayRun();
    } finally {
      setLoading(false);
    }
  };

  const saveBasePay = async (ps: PaySlip) => {
    const newBase = editAmounts[`base_${ps.id}`]; if (!newBase || newBase === ps.basicPay) return;
    try {
      setLoading(true);
      const form = new FormData();
      form.append("paySlipId", String(ps.id));
      form.append("amount", newBase);
      const res = await updateBasePay(form);
      if (!res.success) return toast.error(res.message);
      await refreshPayRun();
    } finally { setLoading(false); }
  };

  const refreshPayRun = async () => {
    try {
      setLoading(true);
      const updated = await getPayRunDetails(payRunId);
      setPayslips((updated.paySlips ?? []).map((ps) => ({
        id: ps.id,
        employeeName: ps.employee.firstName + ps.employee.lastName,
        basicPay: String(ps.basicPay ?? ""),
        paySlipItems: (ps.paySlipItems ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          amount: String(item.amount ?? ""),
          type: item.type === "ALLOWANCE" ? "ALLOWANCE" : "DEDUCTION",
        })),
      })));
      setStatus(updated.status);
    } catch (err) { console.error(err); toast.error("Failed to refresh PayRun"); } finally { setLoading(false); }
  };

  const handleGeneratePayslips = async () => { try { setLoading(true); const res = await generatePaySlipsForRun(payRunId); if (!res.success) return toast.error(res.message); await refreshPayRun(); } finally { setLoading(false); } };
  const handleApprovePayRun = async () => {
    try {
      const confirmed = await showYesNoDialog({
        title: 'Approve PayRun',
        content: (
          <div>
            Are you sure you want to Approve payrun?<br />
            <ul className="list-disc list-inside">
              <li>Once approved, no further edits can be made to this PayRun.</li>
              <li>Ensure all payslips are accurate before proceeding.</li>
              <li>Accouting entries will be performed.</li>
            </ul>
            This action{' '}
            <span className="text-red-500 font-semibold">cannot</span> be undone.
          </div>
        ),
      })
      if (!confirmed) return
      setLoading(true);
      const form = new FormData();
      form.append("payRunId", String(payRunId));
      const res = await approvePayRun(form);
      if (!res.success) return toast.error(res.message); await refreshPayRun();
    } finally { setLoading(false); }
  };
  const handlePerformCashOut = async () => {
    const confirmed = await showYesNoDialog({
      title: 'Perform CashOut PayRun',
      content: (
        <div>
          Are you sure you want to perform cashout for this payrun?<br />
          <ul className="list-disc list-inside">
            <li>This will process payments to all employees in this PayRun.</li>
            <li>Cash will debted and employee account + employee individual accounts will be credited.</li>
          </ul>
          This action{' '}
          <span className="text-red-500 font-semibold">cannot</span> be undone.
        </div>
      ),
    })
    if (!confirmed) return
    try {
      setLoading(true);
      const form = new FormData();
      form.append("payRunId", String(payRunId));
      const res = await performCashOut(form);
      if (!res.success) return toast.error(res.message); onEdit?.(payRunId);; await refreshPayRun();
    } finally { setLoading(false); }
  };

  const handleEditPayRun = async () => {
    const confirmed = await showYesNoDialog({
      title: 'Edit PayRun',
      content: (
        <div>
          Are you sure you want to edit this PayRun?<br />
          This action{' '}
          <span className="text-red-500 font-semibold">cannot</span> be undone.
        </div>
      ),
    })
    if (!confirmed) return

    const newMonth = prompt("Enter month (1-12):", String(new Date().getMonth() + 1));
    if (!newMonth) return;
    const newYear = prompt("Enter year (e.g., 2025):", String(new Date().getFullYear()));
    if (!newYear) return;

    const monthNum = Number(newMonth);
    const yearNum = Number(newYear);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return toast.error("Invalid month");
    if (isNaN(yearNum) || yearNum < 1900) return toast.error("Invalid year");

    const periodStart = new Date(yearNum, monthNum - 1, 1);
    const periodEnd = new Date(yearNum, monthNum, 0); // last day of month

    try {
      setLoading(true);
      const form = new FormData();
      form.append("payRunId", String(payRunId));
      form.append("periodStart", periodStart.toISOString());
      form.append("periodEnd", periodEnd.toISOString());

      const res = await editPayRun(form)
      if (!res.success) return toast.error(res.message);
      onEdit?.(payRunId);
      await refreshPayRun();
    } finally {
      setLoading(false);
    }
  };

  // ✅ New: Delete PayRun
  const handleDeletePayRun = async () => {
    const confirmed = await showYesNoDialog({
      title: 'Delete PayRun',
      content: (
        <div>
          Are you sure you want to delete this PayRun
          This action{' '}
          <span className="text-red-500 font-semibold">cannot</span> be undone.
        </div>
      ),
    })
    if (!confirmed) return

    try {
      setLoading(true);
      const form = new FormData();
      form.append("payRunId", String(payRunId));
      const res = await deletePayRun(form);
      if (!res.success) return toast.error(res.message);
      onDelete?.(payRunId);
      toast.success("PayRun deleted successfully");

      // Optionally, redirect to PayRun list page here
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl w-full mx-auto mt-6 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">PayRun: {month}-{year}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleEditPayRun} disabled={loading || status === "APPROVED"}>Edit PayRun</Button>
          <Button variant="destructive" onClick={handleDeletePayRun} disabled={loading}>Delete PayRun</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent><h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Employees</h3><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{payslips.length}</p></CardContent></Card>
        <Card><CardContent><h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pay</h3><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{appData.company?.currencyCode} {payslips.reduce((acc, ps) => acc + calculateTotals(ps).netPay, 0)}</p></CardContent></Card>
        <Card><CardContent><h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{status}</p></CardContent></Card>
        <Card><CardContent><h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created On</h3><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{createdOn}</p></CardContent></Card>
      </div>

      {/* ---------------- Mobile Card View (Option A - M1) ---------------- */}
      <div className="space-y-4 block md:hidden">
        {payslips.map((ps, index) => {
          const { allowance, deduction, basicPay, netPay } = calculateTotals(ps);
          const allowances = ps.paySlipItems.filter(i => i.type === "ALLOWANCE");
          const deductions = ps.paySlipItems.filter(i => i.type === "DEDUCTION");
          return (
            <Card key={ps.id} className="rounded-lg">
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{ps.employeeName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Employee ID: {ps.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{appData.company?.currencyCode} {netPay}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Net Pay</div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editAmounts[`base_${ps.id}`] ?? ps.basicPay}
                      onChange={e => handleBasePayChange(ps.id, e.target.value)}
                      className="w-28 p-1 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-black"
                    />
                    <Button size="sm" onClick={() => saveBasePay(ps)} disabled={loading || status === "APPROVED"}>Save</Button>
                  </div>

                  <div className="flex justify-between">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Allowances</div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">{appData.company?.currencyCode} {allowance}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Deductions</div>
                      <div className="text-sm font-medium text-red-600 dark:text-red-400">{appData.company?.currencyCode} {deduction}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center gap-2">
                  <div className="flex gap-2">
                    <div className="p-3 text-sm text-gray-700 dark:text-gray-300">
                      <Button size="sm" className="mr-0.5" onClick={() => toggleRow(index)}>{expanded === index ? "Hide" : "Details"}</Button>
                      <PrintablePayslipDialog
                        slip={{
                          employeeName: ps.employeeName,
                          basePay: basicPay,
                          allowances: ps.paySlipItems
                            .filter(i => i.type === "ALLOWANCE")
                            .map(i => ({
                              title: i.title,
                              amount: parseFloat(editAmounts[`${i.id}`] ?? i.amount)
                            })),
                          deductions: ps.paySlipItems
                            .filter(i => i.type === "DEDUCTION")
                            .map(i => ({
                              title: i.title,
                              amount: parseFloat(editAmounts[`${i.id}`] ?? i.amount)
                            })),
                          grossPay: basicPay,
                          netPay,
                          period: `${month}/${year}`,
                          company: {
                            name: appData.company?.title || "Your Company Name",
                            address: appData.company?.description || "Company Address"
                          }
                        }}
                        trigger={<Button size={'sm'}>View Payslip</Button>}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{appData.company?.currencyCode} {netPay}</div>
                </div>

                {expanded === index && (
                  <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                    {/* Option A1: simple read-only lists */}
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Allowances</div>
                      {allowances.length === 0 ? <div className="text-xs text-gray-500 dark:text-gray-400">—</div> :
                        allowances.map(a => (
                          <div key={a.id} className="flex justify-between text-sm text-gray-800 dark:text-gray-200 py-1">
                            <div>{a.title}</div>
                            <div>{appData.company?.currencyCode} {a.amount}</div>
                          </div>
                        ))
                      }
                    </div>

                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Deductions</div>
                      {deductions.length === 0 ? <div className="text-xs text-gray-500 dark:text-gray-400">—</div> :
                        deductions.map(d => (
                          <div key={d.id} className="flex justify-between text-sm text-gray-800 dark:text-gray-200 py-1">
                            <div>{d.title}</div>
                            <div>{appData.company?.currencyCode} {d.amount}</div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ---------------- Desktop Table View (unchanged) ---------------- */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full border-collapse text-left">
          <thead className="bg-gray-100 dark:bg-gray-900">
            <tr>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Employee</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Base Pay</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Total Allowances</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Total Deductions</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Net Pay</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {payslips.map((ps, index) => {
              const { allowance, deduction, basicPay, netPay } = calculateTotals(ps);
              return (
                <Fragment key={ps.id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <td className="p-3 text-sm font-medium text-gray-900 dark:text-gray-100">{ps.employeeName}</td>
                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300">
                      <input type="number" value={editAmounts[`base_${ps.id}`] ?? ps.basicPay} onChange={e => handleBasePayChange(ps.id, e.target.value)} className="w-24 p-1 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-black" />
                      <Button size="sm" className="ml-2" onClick={() => saveBasePay(ps)} disabled={loading || status === "APPROVED"}>Save</Button>
                    </td>
                    <td className="p-3 text-sm text-green-600 dark:text-green-400" onClick={() => toggleRow(index)}>{appData.company?.currencyCode} {allowance}</td>
                    <td className="p-3 text-sm text-red-600 dark:text-red-400">{appData.company?.currencyCode} {deduction}</td>
                    <td className="p-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{appData.company?.currencyCode} {netPay}</td>
                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300">
                      <PrintablePayslipDialog
                        slip={{
                          employeeName: ps.employeeName,
                          basePay: basicPay,
                          allowances: ps.paySlipItems
                            .filter(i => i.type === "ALLOWANCE")
                            .map(i => ({
                              title: i.title,
                              amount: parseFloat(editAmounts[`${i.id}`] ?? i.amount)
                            })),
                          deductions: ps.paySlipItems
                            .filter(i => i.type === "DEDUCTION")
                            .map(i => ({
                              title: i.title,
                              amount: parseFloat(editAmounts[`${i.id}`] ?? i.amount)
                            })),
                          grossPay: basicPay,
                          netPay,
                          period: `${month}/${year}`,
                          company: {
                            name: appData.company?.title || "Your Company Name",
                            address: appData.company?.description || "Company Address"
                          }
                        }}
                        trigger={<Button>View Payslip</Button>}
                      />
                    </td>
                  </tr>
                  {expanded === index && (
                    <tr className="bg-gray-50 dark:bg-gray-900">
                      <td colSpan={6} className="p-3">
                        <table className="w-full text-sm border-t border-gray-200 dark:border-gray-700">
                          <thead>
                            <tr>
                              <th className="p-2 text-left text-gray-600 dark:text-gray-300">Item</th>
                              <th className="p-2 text-left text-gray-600 dark:text-gray-300">Type</th>
                              <th className="p-2 text-left text-gray-600 dark:text-gray-300">Amount</th>
                              <th className="p-2 text-left text-gray-600 dark:text-gray-300">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {ps.paySlipItems.map(item => (
                              <tr key={item.id}>
                                <td className="p-2 text-gray-900 dark:text-gray-100">{item.title}</td>
                                <td className={`p-2 ${item.type === "ALLOWANCE" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{item.type}</td>
                                <td className="p-2">
                                  <input type="number" className="w-24 p-1 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-black" value={editAmounts[item.id] ?? item.amount} onChange={e => handleItemChange(item.id, e.target.value)} />
                                </td>
                                <td className="p-2">
                                  <Button size="sm" onClick={() => savePaySlipItem(ps.id, item)} disabled={loading || status === "APPROVED"}>Save</Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {/* <Button onClick={handleGeneratePayslips} disabled={loading}>Generate Payslips</Button> */}
        <Button onClick={handleApprovePayRun} disabled={loading || status === 'APPROVED'}>Approve PayRun</Button>
        <Button onClick={handlePerformCashOut} disabled={loading || (status === 'APPROVED' && cashOut === true) || (status !== 'APPROVED')}>PerformCashOut</Button>
      </div>
      {YesNoDialog}
    </div>
  );
}
