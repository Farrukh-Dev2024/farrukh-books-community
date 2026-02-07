'use client'

import * as React from 'react'
import { useEffect, useTransition } from 'react'
import { MoreVertical } from 'lucide-react'
import type { User } from '@/features/admindashboard/actions/companymanagement/company-actions.ts'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

import {
    suspendCompany,
    unsuspendCompany,
    deleteCompany,
    undeleteCompany,
    getAllPlatformUsers,
} from '../../actions/companymanagement/company-actions'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { UserRoles } from '@/types/project-types'
import { EditCompanyDialog } from './edit-company-dialog'
import { ManageCompanyUsersDialog } from './manage-company-users-dialog'

type CompanyRow = {
    id: number
    title: string
    description?: string | null
    isSuspended: boolean
    isDeleted: boolean
}

export function CompanyActionsMenu({ company }: { company: CompanyRow }) {
    const router = useRouter()
    const { data: session } = useSession()
    const [isPending, startTransition] = useTransition()
    const [allUsers, setAllUsers] = React.useState<User[]>([])

    useEffect(() => {
        async function loadUsers() {
            const users = await getAllPlatformUsers()
            setAllUsers(users)
        }

        loadUsers()
    }, [])

    function refresh() {
        router.refresh()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                >
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-52"
                // onOpenAutoFocus={(e: Event) => e.preventDefault()}
                onCloseAutoFocus={(e: Event) => e.preventDefault()}
            >
                {/* EDIT COMPANY */}
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault()
                    }}
                >
                    <EditCompanyDialog company={company} />
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* MANAGE USERS */}
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault()
                    }}
                >
                    <ManageCompanyUsersDialog
                        company={company}
                        allUsers={allUsers}
                    />
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* SUSPEND / UNSUSPEND */}
                {!company.isDeleted && !company.isSuspended && (
                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault()
                            startTransition(async () => {
                                await suspendCompany(company.id)
                                refresh()
                            })
                        }}
                    >
                        Suspend company
                    </DropdownMenuItem>
                )}

                {!company.isDeleted && company.isSuspended && (
                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault()
                            startTransition(async () => {
                                await unsuspendCompany(company.id)
                                refresh()
                            })
                        }}
                    >
                        Unsuspend company
                    </DropdownMenuItem>
                )}

                {/* DELETE / RESTORE */}
                {true && (
                    <>
                        <DropdownMenuSeparator />

                        {!company.isDeleted && (
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onSelect={(e) => {
                                    e.preventDefault()
                                    startTransition(async () => {
                                        await deleteCompany(company.id)
                                        refresh()
                                    })
                                }}
                            >
                                Delete company
                            </DropdownMenuItem>
                        )}

                        {company.isDeleted && (
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault()
                                    startTransition(async () => {
                                        await undeleteCompany(company.id)
                                        refresh()
                                    })
                                }}
                            >
                                Restore company
                            </DropdownMenuItem>
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
