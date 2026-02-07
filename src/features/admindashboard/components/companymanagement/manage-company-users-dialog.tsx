'use client'

import * as React from 'react'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserRoles, CompanyRoles } from '@/types/project-types'

import { addUserToCompany, removeUserFromCompany, changeUserCompanyRole ,User,Company } from '../../actions/companymanagement/company-actions'




type Props = {
    company: Company
    allUsers: User[] // fetched from server or parent
}

export function ManageCompanyUsersDialog({ company, allUsers }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = React.useState(false)

    // Local state for selection
    const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null)
    const [selectedRole, setSelectedRole] = React.useState<number>(CompanyRoles.Viewonly)

    // Filter users to exclude company if adding
    const availableUsers = allUsers.filter(u => u.companyId !== company.id)

    // Users currently in company
    const companyUsers = allUsers.filter(u => u.companyId === company.id)

    function handleAddUser() {
        if (!selectedUserId) return

        startTransition(async () => {
            await addUserToCompany(selectedUserId, company.id, selectedRole)
            setSelectedUserId(null)
            setSelectedRole(CompanyRoles.Viewonly)
            router.refresh()
        })
    }

    function handleRemoveUser(userId: number) {
        startTransition(async () => {
            await removeUserFromCompany(userId)
            router.refresh()
        })
    }

    function handleChangeRole(userId: number, role: number) {
        startTransition(async () => {
            await changeUserCompanyRole(userId, role)
            router.refresh()
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost" disabled={company.isDeleted}>
                    Manage Users
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Manage Users for {company.title}</DialogTitle>
                </DialogHeader>

                {/* -----------------------------
            ADD USER SECTION
        ----------------------------- */}
                <div className="space-y-4 mb-4">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Label htmlFor="user-select">Select user</Label>
                            <Select
                                value={selectedUserId?.toString() || ''}
                                onValueChange={(v) => setSelectedUserId(Number(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableUsers.map(u => (
                                        <SelectItem key={u.id} value={u.id.toString()}>
                                            {u.name} ({u.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-40">
                            <Label htmlFor="role-select">Role</Label>

                            <Select
                                value={selectedRole.toString()}
                                onValueChange={(v) => setSelectedRole(Number(v))}
                                disabled={isPending}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(CompanyRoles).map(([roleName, roleId]) => (
                                        <SelectItem key={roleId} value={String(roleId)}>
                                            {roleName.replace(/([A-Z])/g, ' $1').trim()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleAddUser}
                            disabled={!selectedUserId || isPending || company.isDeleted}
                        >
                            Add
                        </Button>
                    </div>
                </div>

                {/* -----------------------------
            COMPANY USERS TABLE
        ----------------------------- */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {companyUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No users in this company
                                </TableCell>
                            </TableRow>
                        )}

                        {companyUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Select
                                        defaultValue={String(user.companyRole)}
                                        onValueChange={(val) => handleChangeRole(user.id, Number(val))}
                                        disabled={isPending}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(CompanyRoles).map(([roleName, roleId]) => (
                                                <SelectItem key={roleId} value={String(roleId)}>
                                                    {roleName.replace(/([A-Z])/g, ' $1').trim()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRemoveUser(user.id)}
                                        disabled={isPending}
                                    >
                                        Remove
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <DialogFooter>
                    <Button onClick={() => setOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
