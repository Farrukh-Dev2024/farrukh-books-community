//src\features\admindashboard\components\usermanagement\user-actions-menu.tsx
'use client'

import * as React from 'react'
import {
  banUser,
  unbanUser,
  forceLogoutUser,
  softDeleteUser,
  changeUserRole,
  forceResetPassword,
} from '../../actions/usermanagement/user-actions'
import { UserRoles } from '@/types/project-types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useAppContext } from '@/context/AppContext'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

type Props = {
  user: {
    id: number
    userRole: number
    isBanned: boolean
    isDeleted: boolean
  }
  onUserUpdated: React.Dispatch<React.SetStateAction<any[]>>
}

export default function UserActionsMenu({ user, onUserUpdated }: Props) {
  // const { data: session } = useSession()
  // const isSuperAdmin = session?.user?.role === UserRoles.SuperAdmin
  const { appData, setAppData } = useAppContext()
  const isSuperAdmin = appData.user?.userRole === UserRoles.SuperAdmin

  async function updateLocal(update: Partial<typeof user>) {
    onUserUpdated((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, ...update } : u))
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {/* Ban / Unban */}
        <DropdownMenuItem
          disabled={user.isDeleted}
          onClick={async () => {
            if (user.isBanned) {
              const result = await unbanUser(user.id)
              if (!result.success) {
                toast.error(result.message || 'Failed to unban user')
                updateLocal({ isBanned: true })
                return
              } else {
                toast.success(result.message || 'Successfully unbanned user')
                updateLocal({ isBanned: false })
                return
              }

            } else {
              const result = await banUser(user.id)
              if (!result.success) {
                toast.error(result.message || 'Failed to ban user')
                updateLocal({ isBanned: false })
                return
              } else {
                toast.success(result.message || 'Successfully banned user')
                updateLocal({ isBanned: true })
                return
              }
            }
          }}
        >
          {user.isBanned ? 'Unban User' : 'Ban User'}
        </DropdownMenuItem>

        {/* Force logout */}
        <DropdownMenuItem
          disabled={user.isDeleted}
          onClick={async () => {
            const result = await forceLogoutUser(user.id)
            if (!result.success) {
              toast.error(result.message || 'Failed to force logout user')
            } else {
              toast.success(result.message || 'Successfully forced logout user')
            }
          }}
        >
          Force Logout
        </DropdownMenuItem>

        {/* Role management */}
        {isSuperAdmin && !user.isDeleted && (
          <>
            <DropdownMenuItem
              disabled={user.userRole === UserRoles.Admin}
              onClick={async () => {
                const result = await changeUserRole(user.id, UserRoles.Admin)
                if (!result.success) {
                  toast.error(result.message || 'Failed to promote user')
                } else {
                  toast.success(result.message || 'Successfully promoted user')
                  updateLocal({ userRole: UserRoles.Admin })
                }
              }}
            >
              Promote to Admin
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={user.userRole === UserRoles.User}
              onClick={async () => {
                const result = await changeUserRole(user.id, UserRoles.User)
                if (!result.success) {
                  toast.error(result.message || 'Failed to demote user')
                } else {
                  toast.success(result.message || 'Successfully demoted user')
                  updateLocal({ userRole: UserRoles.User })
                }
              }}
            >
              Demote to User
            </DropdownMenuItem>
          </>
        )}

        {/* Delete */}
        {isSuperAdmin && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={async () => {
              const result = await softDeleteUser(user.id)
              if (!result.success) {
                toast.error(result.message || 'Failed to delete user')
              } else {
                toast.success(result.message || 'Successfully deleted user')
                updateLocal({ isDeleted: true, isBanned: true })
              }
            }}
          >
            Delete User
          </DropdownMenuItem>
        )}
        {/* Force reset password */}
        <DropdownMenuItem
          disabled={user.isDeleted}
          onClick={async () => {
            const result = await forceResetPassword(user.id)
            if (!result.success) {
              toast.error(result.message || 'Failed to force reset password')
            } else {
              toast.success(result.message || 'Password reset enforced successfully')
            }
          }}
        >
          Force Reset Password
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  )
}
