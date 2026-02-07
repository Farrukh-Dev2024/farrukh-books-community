"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EmployeeForm from "./EmployeeForm";
import { updateEmployee } from "../actions/employeeActions";
import { EmployeeSchema } from "../schemas/employeeSchemas";
import { useAppContext } from '@/context/AppContext'

type Props = {
  employee: EmployeeSchema
};

export default function EditEmployeeDialog({ employee }: Props) {
  const { appData, setAppData } = useAppContext()
  const [open, setOpen] = useState(false);

  async function handleSubmit(values: EmployeeSchema) {
    if (!employee.id) return;
    const ret = await updateEmployee(employee.id, values);

    if (appData.payrollemployees && ret.data) {
      setAppData({
        ...appData,
        payrollemployees: appData.payrollemployees.map((emp) =>
          emp.id === ret.data.id ? ret.data : emp
        ),
      });

    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit</Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogTitle>Edit Employee</DialogTitle>
        {/* <h2 className="font-semibold text-lg mb-4">Edit Employee</h2> */}
        <EmployeeForm initialData={employee} onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
