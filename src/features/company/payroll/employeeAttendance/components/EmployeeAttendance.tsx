'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { markAttendance, getAttendanceForDate } from '../actions/employeeAttendanceActions';
import { toast } from 'sonner';

interface EmployeeAttendance {
  id: number;
  employeeId: number;
  employeeName: string;
  status: string, // 'PRESENT' | 'ABSENT' | 'HALFDAY' | 'LEAVE',
  dailyNote?: string;
  checkIn?: string;
  checkOut?: string;
}

export default function EmployeeAttendance() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<EmployeeAttendance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  async function fetchAttendance() {
    setLoading(true);
    try {
      const data = await getAttendanceForDate(new Date(date));
      if (Array.isArray(data)) {
        const mapped = data.map((item) => ({
          id: item.id,
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          status: item.status,
          checkIn: item.checkIn ? item.checkIn.slice(0, 5) : '',
          checkOut: item.checkOut ? item.checkOut.slice(0, 5) : '',
          dailyNote: item.dailyNote ? item.dailyNote : '',
        }));
        setAttendance(mapped);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveAttendance() {
    setLoading(true);
    try {
      for (const item of attendance) {
        await markAttendance(
          item.employeeId,
          new Date(date),
          item.status,
          item.checkIn ? new Date(`${date}T${item.checkIn}`) : undefined,
          item.checkOut ? new Date(`${date}T${item.checkOut}`) : undefined,
          item.dailyNote ? item.dailyNote : ''
        );
      }
      toast.success('Attendance saved successfully!');
      fetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error('Error saving attendance');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl w-full mx-auto mt-6 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black space-y-5">

      <h2 className="text-xl font-semibold">Attendance for {date}</h2>

      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="max-w-xs"
      />

      {/* TABLE VIEW (md and above) */}
      <table className="hidden md:table w-full border border-gray-200 dark:border-gray-700 mt-4">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-900">
            <th className="p-2 text-left">Employee</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Check-In</th>
            <th className="p-2 text-left">Check-Out</th>
            <th className="p-2 text-left">Daily-Note</th>
          </tr>
        </thead>

        <tbody>
          {attendance.map((emp, idx) => (
            <tr key={emp.employeeId} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="p-2">{emp.employeeName}</td>

              <td className="p-2">
                <Select
                  value={emp.status}
                  onValueChange={(value) =>
                    setAttendance((prev) =>
                      prev.map((a, i) => (i === idx ? { ...a, status: value as string } : a))
                    )
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">PRESENT</SelectItem>
                    <SelectItem value="ABSENT">ABSENT</SelectItem>
                    <SelectItem value="HALFDAY">HALFDAY</SelectItem>
                    <SelectItem value="LEAVE">LEAVE</SelectItem>
                  </SelectContent>
                </Select>
              </td>

              <td className="p-2">
                <Input
                  type="time"
                  value={emp.checkIn || ''}
                  onChange={(e) =>
                    setAttendance((prev) =>
                      prev.map((a, i) => (i === idx ? { ...a, checkIn: e.target.value } : a))
                    )
                  }
                />
              </td>

              <td className="p-2">
                <Input
                  type="time"
                  value={emp.checkOut || ''}
                  onChange={(e) =>
                    setAttendance((prev) =>
                      prev.map((a, i) => (i === idx ? { ...a, checkOut: e.target.value } : a))
                    )
                  }
                />
              </td>

              <td className="p-2">
                <Input
                  type="text"
                  value={emp.dailyNote || ''}
                  placeholder="Daily note"
                  onChange={(e) =>
                    setAttendance(prev =>
                      prev.map(a =>
                        a.employeeId === emp.employeeId ? { ...a, dailyNote: e.target.value } : a
                      )
                    )
                  }
                />
              </td>

            </tr>
          ))}
        </tbody>
      </table>

      {/* CARD VIEW (mobile) */}
      <div className="md:hidden space-y-4">
        {attendance.map((emp, idx) => (
          <div
            key={emp.employeeId}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 space-y-3 shadow-sm"
          >
            <div className="font-semibold text-lg">{emp.employeeName}</div>

            <Select
              value={emp.status}
              onValueChange={(value) =>
                setAttendance((prev) =>
                  prev.map((a, i) => (i === idx ? { ...a, status: value as string } : a))
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESENT">PRESENT</SelectItem>
                <SelectItem value="ABSENT">ABSENT</SelectItem>
                <SelectItem value="HALFDAY">HALFDAY</SelectItem>
                <SelectItem value="LEAVE">LEAVE</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="time"
              value={emp.checkIn || ''}
              onChange={(e) =>
                setAttendance(prev =>
                  prev.map(a => (a.employeeId === emp.employeeId ? { ...a, checkIn: e.target.value } : a))
                )
              }
            />

            <Input
              type="time"
              value={emp.checkOut || ''}
              onChange={(e) =>
                setAttendance(prev =>
                  prev.map(a => (a.employeeId === emp.employeeId ? { ...a, checkOut: e.target.value } : a))
                )
              }
            />

            <Input
              type="text"
              value={emp.dailyNote || ''}
              placeholder="Daily note"
              onChange={(e) =>
                setAttendance(prev =>
                  prev.map(a => (a.employeeId === emp.employeeId ? { ...a, dailyNote: e.target.value } : a))
                )
              }
            />
          </div>
        ))}
      </div>

      <Button onClick={saveAttendance} disabled={loading} className="w-full md:w-auto">
        {loading ? 'Saving...' : 'Save Attendance'}
      </Button>
    </div>
  );
}
