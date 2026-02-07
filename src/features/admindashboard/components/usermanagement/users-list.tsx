//path: src/features/admindashboard/components/usermanagement/users-list.tsx
'use client'

import * as React from 'react'
import { getUsersForAdmin } from '../../actions/usermanagement/user-actions'
import { USER_ROLE_LABELS, UserRoles, UserRoleType } from '@/types/project-types'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import UserActionsMenu from './user-actions-menu'

type AdminUser = Awaited<ReturnType<typeof getUsersForAdmin>>[number]

function roleLabel(role: UserRoleType | number) {
  return USER_ROLE_LABELS[role as UserRoleType] ?? 'User'
}

export default function UsersList() {
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    getUsersForAdmin().then((data) => {
      setUsers(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading users…</div>
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name ?? '—'}</TableCell>
              <TableCell className="font-mono text-sm">{user.email}</TableCell>

              <TableCell>
                <Badge variant="secondary">{roleLabel(user.userRole)}</Badge>
              </TableCell>

              <TableCell>
                {user.isDeleted ? (
                  <Badge variant="destructive">Deleted</Badge>
                ) : user.isBanned ? (
                  <Badge variant="destructive">Banned</Badge>
                ) : (
                  <Badge variant="default">Active</Badge>
                )}
              </TableCell>

              <TableCell className="text-right">
                <UserActionsMenu user={user} onUserUpdated={setUsers} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
