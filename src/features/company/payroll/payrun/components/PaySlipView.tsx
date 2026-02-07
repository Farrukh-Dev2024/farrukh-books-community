'use client';
import React, { useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";

// --- original types ---
export type PrintablePayslipProps = {
  employeeName: string;
  basePay: number;
  allowances?: { title: string; amount: number }[];
  deductions?: { title: string; amount: number }[];
  grossPay: number;
  netPay: number;
  period: string;
  company: {
    name: string;
    address?: string;
  };
};

// --- ORIGINAL component kept 100% unchanged ---
function PayslipContent({ slip }: { slip: PrintablePayslipProps }) {
  if (!slip) return null;

  const {
    employeeName,
    basePay,
    allowances = [],
    deductions = [],
    grossPay,
    netPay,
    period,
    company,
  } = slip;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white text-black p-8 rounded-lg shadow print:shadow-none print:bg-white print:p-0">
      <header className="text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">{company?.name || "Company Name"}</h1>
        {company?.address && (
          <p className="text-sm text-gray-600">{company.address}</p>
        )}
        <p className="text-sm font-medium mt-1">Payslip for {period}</p>
      </header>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Employee Details</h2>
        <div className="grid grid-cols-2 text-sm">
          <span className="font-medium">Name:</span>
          <span>{employeeName}</span>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Salary Breakdown</h2>
        <div className="grid grid-cols-2 text-sm mb-1">
          <span className="font-medium">Base Pay:</span>
          <span>PKR {basePay.toLocaleString()}</span>
        </div>

        {allowances.length > 0 && (
          <div className="mt-3">
            <h3 className="font-medium mb-1">Allowances</h3>
            {allowances.map((item, i) => (
              <div key={i} className="grid grid-cols-2 text-sm">
                <span>{item.title}</span>
                <span>PKR {item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {deductions.length > 0 && (
          <div className="mt-3">
            <h3 className="font-medium mb-1">Deductions</h3>
            {deductions.map((item, i) => (
              <div key={i} className="grid grid-cols-2 text-sm">
                <span>{item.title}</span>
                <span>PKR {item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-t pt-4 mt-6">
        {/* <div className="grid grid-cols-2 text-sm mb-1">
          <span className="font-medium">Gross Pay:</span>
          <span>PKR {grossPay.toLocaleString()}</span>
        </div> */}
        <div className="grid grid-cols-2 text-sm font-bold mt-2">
          <span>Net Pay:</span>
          <span>PKR {netPay.toLocaleString()}</span>
        </div>
      </section>
    </div>
  );
}

// --- NEW dialog wrapper (only addition) ---
export default function PrintablePayslipDialog({
  slip,
  trigger,
}: {
  slip: PrintablePayslipProps;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogTitle>
      </DialogTitle>

      <DialogContent
        className="
          max-w-3xl 
          w-full 
          p-0 
          bg-white 
          dark:bg-black
          overflow-y-auto
        "
      >
  {/* <div className="flex justify-end p-2">
    <DialogClose asChild>
      <button className="text-gray-500 hover:text-gray-700">×</button>
    </DialogClose>
  </div>         */}
        <div id="print-area" className="max-h-[90vh] overflow-y-auto px-2">
          <PayslipContent slip={slip} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
