'use server';

import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions';
import { canManageEmployees } from '@/lib/permissions/permissions';
import { prisma } from '../../../../../lib/prisma';

/**
 * Normalize date to YYYY-MM-DD (midnight)
 */
function normalizeDate(d: Date) {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
}

/**
 * Mark or update attendance for a single employee on a given date
 * Uses upsert to create or update the record in one query
 */
export async function markAttendance(
    employeeId: number,
    date: Date,
    status: string, //'PRESENT' | 'ABSENT' | 'HALFDAY' | 'LEAVE',
    checkIn?: Date,
    checkOut?: Date,
    dailyNote?: string
) {
    'use server';

    try {
        // // Auth check
        // const session = await auth();
        // if (!session?.user) {
        //     return { success: false, message: "User not logged in", errors: {} };
        // }

        // // Fetch DB user
        // const tmpform = new FormData();
        // tmpform.append("email", session.user.email || "");
        // const userdb = await getuser({}, tmpform);

        const userdb = await getAuthUserCompanyOrThrow();

        if (!userdb || !userdb.companyId) {
            return { success: false, message: "Invalid company or user not found", errors: {} };
        }

        // Permission check
        if (!canManageEmployees(userdb, 'create')) {
            return { success: false, message: "Permission denied", errors: {} };
        }

        const normalizedDate = normalizeDate(date);

        // Ensure employee belongs to same company
        const emp = await prisma.payrollEmployee.findUnique({
            where: { id: employeeId }
        });

        if (!emp || emp.companyId !== userdb.companyId) {
            return { success: false, message: "Employee does not belong to your company", errors: {} };
        }

        // Upsert
        return await prisma.payrollEmployeeAttendance.upsert({
            where: { employeeId_date: { employeeId, date: normalizedDate } },
            update: { status, checkIn, checkOut, dailyNote },
            create: { companyId: userdb.companyId ,employeeId, date: normalizedDate, status, checkIn, checkOut, dailyNote },
        });

    } catch (error) {
        console.error('Error marking attendance:', error);
        throw new Error('Unable to mark attendance. Please try again.');
    }
}

/**
 * Fetch attendance for all employees for a specific date
 */
export async function getAttendanceForDate(date: Date) {
    'use server';

    // // Auth check
    // const session = await auth();
    // if (!session?.user) {
    //     return { success: false, message: "User not logged in", errors: {} };
    // }

    // // Fetch DB user
    // const tmpform = new FormData();
    // tmpform.append("email", session.user.email || "");
    // const userdb = await getuser({}, tmpform);
    try {
        const userdb = await getAuthUserCompanyOrThrow();        
        if (!userdb || !userdb.companyId) {
            return { success: false, message: "Invalid company or user not found", errors: {} };
        }

        // Permission check
        if (!canManageEmployees(userdb, 'read')) {
            return { success: false, message: "Permission denied", errors: {} };
        }

        const normalizedDate = normalizeDate(date);

        // 1️⃣ Fetch employees of the company
        const employees = await prisma.payrollEmployee.findMany({
            where: {
                companyId: userdb.companyId,
                status: 'ACTIVE',
                isDeleted: false,
            },
            orderBy: { firstName: 'asc' }
        });

        // 2️⃣ Fetch attendance for that date
        const attendanceRecords = await prisma.payrollEmployeeAttendance.findMany({
            where: { date: normalizedDate },
        });

        // 3️⃣ Merge into final object list
        const merged = employees.map(emp => {
            const record = attendanceRecords.find(r => r.employeeId === emp.id);

            return {
                id: record?.id || 0,
                employeeId: emp.id,
                employeeName: emp.firstName + " " + (emp.lastName || ""),
                status: record?.status || 'ABSENT',
                dailyNote: record?.dailyNote || '',
                checkIn: record?.checkIn?.toISOString().slice(11, 16) || '',
                checkOut: record?.checkOut?.toISOString().slice(11, 16) || '',
            };
        });

        return merged;

    } catch (error) {
        console.log("Error employeeAttenanceActions %O" , error)
         return { success: false, message: "Error employeeAttenanceActions", errors: {} };
    }
}
