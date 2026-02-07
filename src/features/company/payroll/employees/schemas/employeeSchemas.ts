import { id } from "date-fns/locale";
import { z } from "zod";

// export const employeeSchema = z.object({
//   firstName: z.string().min(1, "Required"),
//   lastName: z.string().min(1, "Required").optional(),
//   baseSalary: z.number().min(0, "Must be 0 or above"),
//   joinDate: z.string().min(1, "Required"),
//   status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']),
//   salaryType: z.enum(['MONTHLY', 'HOURLY']),
// });

export const employeeSchema = z.object({
  id: z.number().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().optional().nullable(),
  baseSalary: z.coerce.number().min(0, "Salary must be 0 or above"),
  joinDate: z.coerce.date({
    required_error: "Join date is required",
    invalid_type_error: "Invalid date format",
    }),
  // status: z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]),
  // salaryType: z.enum(["MONTHLY", "HOURLY"]),
  status: z.string().min(1, "Status is required"),
  salaryType: z.string().min(1, "Salary type is required"),
  // createdById: z.number().optional(), // optional if handled server-side
  // updatedById: z.number().optional(), // optional if handled server-side
  // companyId: z.number().optional(),   // optional if handled server-side
});
export type EmployeeSchema = z.infer<typeof employeeSchema>;
