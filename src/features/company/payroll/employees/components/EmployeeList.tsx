'use client';
import { getEmployees, deleteEmployee } from "../actions/employeeActions";
import EditEmployeeDialog from "./EditEmployeeDialog";
import CreateEmployeeDialog from "./CreateEmployeeDialog";
import { Button } from "@/components/ui/button";
import React from "react";
import { EmployeeSchema } from "../schemas/employeeSchemas";
import { useAppContext } from '@/context/AppContext'
import { useYesNoDialog } from '@/features/yesnodialog/useYesNoDialog'

export default function EmployeeList() {
  const { showYesNoDialog, YesNoDialog } = useYesNoDialog()
  const { appData, setAppData } = useAppContext()
  const [employees, setEmployees] = React.useState<EmployeeSchema[]>([]);

  React.useEffect(() => {
    let mounted = true;
    const loadEmployees = async () => {
      const result = await getEmployees();
      const data = result?.data ?? [];
      if (mounted && data) {
        setEmployees(data);
        setAppData({ ...appData, payrollemployees: data })
      }
    };
    loadEmployees();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-5xl w-full mx-auto mt-6 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Employees
        </h1>
        <CreateEmployeeDialog />
      </div>

      {/* List Container */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-black divide-y dark:divide-gray-800">
        {appData.payrollemployees?.map((emp: EmployeeSchema) => (
          <div
            key={emp.id}
            className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            {/* Employee Info */}
            <div className="space-y-1">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {emp.firstName} {emp.lastName}
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="mr-2">
                  Salary: <span className="font-medium">{emp.baseSalary}</span>
                </span>
                |
                <span className="ml-2">
                  Joined:{" "}
                  <span className="font-medium">
                    {new Date(emp.joinDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <EditEmployeeDialog employee={emp} />

              <Button
                variant="destructive"
                onClick={async () => {
                  if (!emp.id) return;

                          const confirmed = await showYesNoDialog({
            title: 'Delete Employee',
            content: (
                <div>
                    Are you sure you want to delete selected Employee
                    This action{' '}
                    <span className="text-red-500 font-semibold">cannot</span> be undone.
                </div>
            ),
        })
        if (!confirmed) return
                  const res = await deleteEmployee(emp.id);
                  if (res.success && appData.payrollemployees) {
                    setAppData({
                      ...appData,
                      payrollemployees: appData.payrollemployees.filter(
                        (e) => e.id !== emp.id
                      ),
                    });
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}

        {appData.payrollemployees?.length === 0 && (
          <div className="p-6 text-center text-gray-600 dark:text-gray-400">
            No employees found.
          </div>
        )}
      </div>
      {YesNoDialog}
    </div>
  );
}
