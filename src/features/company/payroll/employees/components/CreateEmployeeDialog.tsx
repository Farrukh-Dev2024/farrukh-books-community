"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EmployeeForm from "./EmployeeForm";
import { createEmployee } from "../actions/employeeActions";
import { EmployeeSchema } from "../schemas/employeeSchemas";
import { useAppContext } from '@/context/AppContext'

export default function CreateEmployeeDialog() {
  const { appData, setAppData } = useAppContext()
  const [open, setOpen] = useState(false);

async function handleSubmit(values: EmployeeSchema) {
  const res = await createEmployee(values);

  if (res.success && res.data) {
    setAppData({
      ...appData,
      payrollemployees: [...appData.payrollemployees??[], res.data],
    });
  }

  setOpen(false);
}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Employee</Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogTitle>Create Employee</DialogTitle>        
        {/* <h2 className="font-semibold text-lg mb-4">Create Employee</h2> */}
        <EmployeeForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
