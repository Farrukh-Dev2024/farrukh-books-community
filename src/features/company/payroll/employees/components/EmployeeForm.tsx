"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employeeSchema } from "../schemas/employeeSchemas";
import { date, z } from "zod";

type EmployeeSchema = z.infer<typeof employeeSchema>;

type Props = {
  initialData?: EmployeeSchema;
  onSubmit?: (values: EmployeeSchema) => Promise<void>;
  submitting?: boolean;
};

export default function EmployeeForm({
  initialData,
  onSubmit,
  submitting,
}: Props) {
  const [form, setForm] = useState<EmployeeSchema>(
    initialData || {
      firstName: "",
      lastName: "",
      baseSalary: 0,
      joinDate: new Date(),
      status: "ACTIVE",
      salaryType: "MONTHLY",
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange<T extends keyof EmployeeSchema>(
    field: T,
    value: EmployeeSchema[T]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = employeeSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};

      parsed.error.errors.forEach((err) => {
        const key = err.path?.[0] as string;
        fieldErrors[key] = err.message;
      });

      setErrors(fieldErrors);
      return;
    }

    if (onSubmit) await onSubmit(parsed.data);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label>First Name</Label>
        <Input
          value={form.firstName ?? ""}
          onChange={(e) => handleChange("firstName", e.target.value)}
          className="border-gray-300 dark:border-gray-700"
        />
        {errors.firstName && (
          <p className="text-red-500 text-sm">{errors.firstName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Last Name</Label>
        <Input
          value={form.lastName ?? ""}
          onChange={(e) => handleChange("lastName", e.target.value)}
          className="border-gray-300 dark:border-gray-700"
        />
        {errors.lastName && (
          <p className="text-red-500 text-sm">{errors.lastName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Base Salary</Label>
        <Input
          type="number"
          value={form.baseSalary}
          onChange={(e) =>
            handleChange("baseSalary", Number(e.target.value) || 0)
          }
          className="border-gray-300 dark:border-gray-700"
        />
        {errors.baseSalary && (
          <p className="text-red-500 text-sm">{errors.baseSalary}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Join Date</Label>
        <Input
          type="date"
          value={form.joinDate.toISOString().split("T")[0] || ""}
          onChange={(e) => handleChange("joinDate", new Date(e.target.value))}
          className="border-gray-300 dark:border-gray-700"
        />
        {errors.joinDate && (
          <p className="text-red-500 text-sm">{errors.joinDate}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={form.status}
          onValueChange={(value) =>
            handleChange("status", value as EmployeeSchema["status"])
          }
        >
          <SelectTrigger className="w-full border-gray-300 dark:border-gray-700">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
            <SelectItem value="INACTIVE">INACTIVE</SelectItem>
            <SelectItem value="TERMINATED">TERMINATED</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-red-500 text-sm">{errors.status}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Salary Type</Label>
        <Select
          value={form.salaryType}
          onValueChange={(value) =>
            handleChange("salaryType", value as EmployeeSchema["salaryType"])
          }
        >
          <SelectTrigger className="w-full border-gray-300 dark:border-gray-700">
            <SelectValue placeholder="Select salary type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
            <SelectItem value="HOURLY">Hourly</SelectItem>
          </SelectContent>
        </Select>
        {errors.salaryType && (
          <p className="text-red-500 text-sm">{errors.salaryType}</p>
        )}
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
