'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

import {
    getEmployeePayItems,
    assignPayItemToEmployee,
    updateEmployeePayItem,
    removeEmployeePayItem
} from '@/features/company/payroll/employeepayitems/actions/employeePayItemActions'
import { getAllPayItems } from '@/features/company/payroll/payitems/actions/payitemactions'
import { useAppContext } from '@/context/AppContext'
import { PayrollEmployee } from '@/types/prisma-types'
import { useYesNoDialog } from '@/features/yesnodialog/useYesNoDialog'


type PayItemOption = { id: number; title: string; type: string; defaultAmount?: number }
type Assignment = {
    id: number
    employeeId: number
    payItemId: number
    amount?: number | null
    isPercentage: boolean
    payItem?: PayItemOption
}

export default function EmployeePayItemListPage() {
const { showYesNoDialog, YesNoDialog } = useYesNoDialog()
    const { appData, setAppData } = useAppContext()
    const [loading, setLoading] = useState(false)
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [payItems, setPayItems] = useState<PayItemOption[]>([])
    const [employees, setEmployees] = useState<PayrollEmployee[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployee | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<Assignment | null>(null)

    const [formPayItemId, setFormPayItemId] = useState<number | null>(null)
    const [formAmount, setFormAmount] = useState<string>('')
    const [formIsPercentage, setFormIsPercentage] = useState(false)
    const [saving, setSaving] = useState(false)

    async function fetchPayItems() {
        try {
            const items = await getAllPayItems()
            setPayItems(items)
        } catch (err) {
            console.error(err)
            setPayItems([])
        }
    }

    async function fetchEmployees() {
        try {
            const list = appData.payrollemployees
            setEmployees(list ?? [])
        } catch (err) {
            console.error(err)
            setEmployees([])
        }
    }

    async function fetchAssignments(empId: number) {
        setLoading(true)
        try {
            const res = await getEmployeePayItems(empId)
            if (res.success) {
                setAssignments(res.safeItems || [])
            } else {
                setAssignments([])
            }
        } catch (err) {
            console.error(err)
            setAssignments([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPayItems()
    }, [])

    useEffect(() => {
        fetchEmployees()
    }, [appData.payrollemployees])

    useEffect(() => {
        if (selectedEmployee?.id) {
            fetchAssignments(selectedEmployee.id)
        } else {
            setAssignments([])
        }
    }, [selectedEmployee])

    function openCreate() {
        if (!selectedEmployee) {
            toast.error('Select an employee first')
            return
        }
        setEditing(null)
        setFormPayItemId(null)
        setFormAmount('')
        setFormIsPercentage(false)
        setDialogOpen(true)
    }

    function openEdit(item: Assignment) {
        setEditing(item)
        setFormPayItemId(item.payItemId)
        setFormAmount(item.amount != null ? String(item.amount) : '')
        setFormIsPercentage(item.isPercentage)
        setDialogOpen(true)
    }

    async function handleSubmit() {
        if (!selectedEmployee) {
            toast.error('Select an employee first')
            return
        }
        if (!formPayItemId) {
            toast.error('Select a pay item first')
            return
        }

        setSaving(true)
        try {
            const payload = {
                employeeId: selectedEmployee.id,
                payItemId: Number(formPayItemId),
                amount: formAmount === '' ? null : Number(formAmount),
                isPercentage: formIsPercentage,
            }

            if (editing) {
                const res = await updateEmployeePayItem({ id: editing.id, ...payload })
                if (!res.success) throw new Error(res.message)
                toast.success('Updated')
            } else {
                const res = await assignPayItemToEmployee(payload)
                if (!res.success) throw new Error(res.message)
                toast.success('Assigned')
            }

            setDialogOpen(false)
            fetchAssignments(selectedEmployee.id)
        } catch (err) {
            console.error(err)
            if (err instanceof Error){
                toast.error(err?.message || 'Network error')
            }else{
                toast.error('Network error')
            }
            
        } finally {
            setSaving(false)
        }
    }

    async function handleRemove(id: number) {
        const confirmed = await showYesNoDialog({
            title: 'Remove Assignment',
            content: (
                <div>
                    Are you sure you want to remove selected assignment
                    This action{' '}
                    <span className="text-red-500 font-semibold">cannot</span> be undone.
                </div>
            ),
        })
        if (!confirmed) return
        try {
            const res = await removeEmployeePayItem(id)
            if (!res.success) throw new Error(res.message)
            toast.success('Removed')
            if (selectedEmployee) fetchAssignments(selectedEmployee.id)
        } catch (err) {
            console.error(err)
            if (err instanceof Error){
                toast.error(err?.message || 'Network error')
            }else{
                toast.error('Network error')
            }
            
        }
    }

    function displayAmount(amount?: number | null, payItem?: PayItemOption, isPercentage?: boolean) {
        if (amount != null) return `${amount}${isPercentage ? '%' : ''}`
        if (payItem?.defaultAmount != null) return `${payItem.defaultAmount}`
        return '-'
    }

    return (
        <div className="max-w-5xl w-full mx-auto mt-6 space-y-5 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="w-full sm:w-1/2 space-y-1">
                    <Label className="font-semibold">Employee</Label>

                    <Select
                        value={selectedEmployee?.id ? String(selectedEmployee.id) : ""}
                        onValueChange={(val) => {
                            const emp = employees.find(e => e.id === Number(val)) ?? null
                            setSelectedEmployee(emp)
                        }}
                    >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                            <SelectValue placeholder="Select Employee" />
                        </SelectTrigger>

                        <SelectContent className="bg-white dark:bg-gray-900">
                            {employees.map(emp => (
                                <SelectItem key={emp.id} value={String(emp.id)}>
                                    {emp.firstName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    size="sm"
                    onClick={openCreate}
                    className="rounded-lg shadow-sm"
                >
                    Assign Pay Item
                </Button>
            </div>

            {selectedEmployee && (
                <div className="border rounded-lg bg-gray-100 dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">

                    {loading ? (
                        <div className="p-4">Loading…</div>
                    ) : assignments.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">No items assigned</div>
                    ) : (
                        assignments.map(it => (
                            <div
                                key={it.id}
                                className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <div>
                                    <div className="font-semibold">{it.payItem?.title}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {it.payItem?.type} · {displayAmount(it.amount, it.payItem, it.isPercentage)}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="rounded-md"
                                        onClick={() => openEdit(it)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="rounded-md"
                                        onClick={() => handleRemove(it.id)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="font-semibold text-lg">
                            {editing ? 'Edit Assignment' : 'Assign Pay Item'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">

                        <div className="space-y-1">
                            <Label className="font-medium">Pay Item</Label>

                            <Select
                                value={formPayItemId != null ? String(formPayItemId) : undefined}
                                onValueChange={(val) => setFormPayItemId(val ? Number(val) : null)}
                            >
                                <SelectTrigger className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                                    <SelectValue placeholder="Select pay item" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-900">
                                    {payItems.map(pi => (
                                        <SelectItem key={pi.id} value={String(pi.id)}>
                                            {pi.title} · {pi.type} {pi.defaultAmount != null ? `— ${pi.defaultAmount}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="font-medium">Amount (leave blank to use default)</Label>
                            <Input
                                placeholder="e.g. 3000 or leave empty"
                                value={formAmount}
                                onChange={(e) => setFormAmount(e.target.value)}
                                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <Switch checked={formIsPercentage} onCheckedChange={(v) => setFormIsPercentage(Boolean(v))} />
                            <Label className="text-sm">Is Percentage</Label>
                        </div>

                    </div>

                    <DialogFooter className="pt-4">
                        <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving ? (editing ? 'Saving…' : 'Assigning…') : (editing ? 'Save' : 'Assign')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {YesNoDialog}	
        </div>
    )
}
