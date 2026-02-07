'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

import { useAppContext } from '@/context/AppContext'
import { modifycompany, deletecompany, leavecompany } from '@/features/company/admin/actions/companyactions'
import { getcompanyusers, updatecompanyuserrole, removecompanyuser } from '@/features/company/admin/actions/companyactions'
import { BASE_PATH, PrevState } from '@/types/project-types'
import { useYesNoDialog } from '@/features/yesnodialog/useYesNoDialog'
import { CompanyRoles } from '@/types/project-types'
import { User, Company } from '@/types/prisma-types';

const EditCompany: React.FC = () => {
  const { appData, setAppData } = useAppContext()
  const router = useRouter()
  const { showYesNoDialog, YesNoDialog } = useYesNoDialog()

  const [formData, setFormData] = React.useState<Partial<Company>>({
    title: '',
    description: '',
    avatarUrl: '',

    currencyCode: '',
    currencySymbol: '',
    currencyName: '',    
  })

  const [users, setUsers] = React.useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = React.useState(false)

  const initialState: PrevState = {}
  const [state, formAction, isPending] = React.useActionState(
    async (prevState: PrevState | null, formData: FormData) => {
      return await modifycompany(prevState ?? {}, formData)
    },
    initialState
  )

  React.useEffect(() => {
    const loadUsers = async () => {
      if (!appData.company) return
      setLoadingUsers(true)
      const res = await getcompanyusers(appData.company.id)
      if (res !== null) setUsers(res)
      setLoadingUsers(false)
    }
    if (appData.company) loadUsers()
  }, [appData.company])

  React.useEffect(() => {
    if (appData.company === null) router.push(BASE_PATH + '/?page=welcomepage')
  }, [appData.company, router])

  React.useEffect(() => {
    if (appData.company) {
      setFormData({
        title: appData.company.title,
        description: appData.company.description,
        avatarUrl: appData.company.avatarUrl,

      currencyCode: appData.company.currencyCode,
      currencySymbol: appData.company.currencySymbol,
      currencyName: appData.company.currencyName,        
      })
    }
  }, [appData.company])

  React.useEffect(() => {
    if (state?.success === true) {
      toast.success(state.message || 'Company modified successfully')
      setAppData((prev) => ({ ...prev, userUpdated: true }))
      router.push('/?page=viewcompany')
    } else if (state?.success === false) {
      toast.error(state.message || 'Cannot modify company')
    }
  }, [state])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    const fd = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      fd.append(key, value !== undefined && value !== null ? String(value) : '')
    })
    React.startTransition(() => {
      formAction(fd)
    })
  }

  const handleRoleChange = async (userId: number, newRole: number) => {
    const tmpform = new FormData()
    tmpform.append('userId', String(userId))
    tmpform.append('roleId', String(newRole))
    tmpform.append('companyId', String(appData.company?.id || ''))
    const res = await updatecompanyuserrole({}, tmpform)
    if (res?.success) {
      toast.success('User role updated')
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, companyRole: newRole } : u))
      )
    } else {
      toast.error(res?.message || 'Failed to update role')
    }
  }

  const handleRemoveUser = (userId: number, userName: string) => {
    showYesNoDialog({
      title: 'Remove user?',
      content: (
        <div>
          Are you sure you want to remove <b>{userName}</b> from this company?
        </div>
      ),
      onYes: async () => {
        const tmpform = new FormData()
        tmpform.append('userId', String(userId))
        const res = await removecompanyuser({}, tmpform)
        if (res?.success) {
          toast.success('User removed')
          setUsers((prev) => prev.filter((u) => u.id !== userId))
        } else {
          toast.error(res?.message || 'Failed to remove user')
        }
      },
    })
  }

  return (
    <div className="w-full flex justify-center px-2 sm:px-4 mt-8">
      <div className="w-full sm:max-w-lg bg-card border rounded-2xl shadow-md p-4 sm:p-6 space-y-4">
        <h2 className="text-xl font-semibold text-center">Edit Company</h2>

        {/* Company Info Section */}
        <div className="grid gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input name="title" value={formData.title ?? ''} onChange={handleChange} placeholder="Company Title" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea name="description" value={formData.description ?? ''} onChange={handleChange} placeholder="Company Description" />
          </div>

{/* 🔴 ADDED: Currency Code */}
<div>
  <label className="block text-sm font-medium mb-1">Currency Code</label>
  <Input
    name="currencyCode"
    value={formData.currencyCode ?? ''}
    onChange={handleChange}
    placeholder="USD"
  />
</div>

{/* 🔴 ADDED: Currency Symbol */}
<div>
  <label className="block text-sm font-medium mb-1">Currency Symbol</label>
  <Input
    name="currencySymbol"
    value={formData.currencySymbol ?? ''}
    onChange={handleChange}
    placeholder="$"
  />
</div>

{/* 🔴 ADDED: Currency Name */}
<div>
  <label className="block text-sm font-medium mb-1">Currency Name</label>
  <Input
    name="currencyName"
    value={formData.currencyName ?? ''}
    onChange={handleChange}
    placeholder="US Dollar"
  />
</div>

          <div>
            <label className="block text-sm font-medium mb-1">Logo URL</label>
            <Input name="avatarUrl" value={formData.avatarUrl ?? ''} onChange={handleChange} placeholder="https://example.com/logo.png" />
          </div>

          <Button className="w-full mt-2" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Company'}
          </Button>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                showYesNoDialog({
                  title: 'Delete company?',
                  content: (
                    <div>
                      Are you sure you want to delete <b>Company</b>? <br />
                      This action <span className="text-red-500 font-semibold">cannot</span> be undone.
                    </div>
                  ),
                  onYes: async () => {
                    const result = await deletecompany()
                    if (result?.success) {
                      toast.success(result.message || 'Company deleted successfully')
                      setAppData((prev) => ({ ...prev, company: null, userUpdated: true }))
                      router.push('/?page=welcomepage')
                    } else {
                      toast.error(result?.message || 'Company deletion failed')
                    }
                  },
                })
              }}
            >
              Delete Company
            </Button>

            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                showYesNoDialog({
                  title: 'Leave company?',
                  content: (
                    <div>
                      Are you sure you want to leave <b>Company</b>? <br />
                      This action <span className="text-red-500 font-semibold">cannot</span> be undone.
                    </div>
                  ),
                  onYes: async () => {
                    const result = await leavecompany()
                    if (result?.success) {
                      toast.success(result.message || 'Company left')
                      setAppData((prev) => ({ ...prev, company: null, userUpdated: true }))
                      router.push('/?page=welcomepage')
                    } else {
                      toast.error(result?.message || 'Company leave failed')
                    }
                  },
                })
              }}
            >
              Leave Company
            </Button>
          </div>
        </div>

        {/* Manage Users Section */}
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Manage Users</h3>
          {loadingUsers ? (
            <p>Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-3 sm:p-4 bg-background shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveUser(user.id, user.name ?? '')}
                    >
                      Remove
                    </Button>
                  </div>

                  <Select
                    defaultValue={String(user.companyRole)}
                    onValueChange={(val) => handleRoleChange(user.id, Number(val))}
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
              ))}
            </div>
          )}
        </div>
      </div>
      {YesNoDialog}
    </div>
  )
}

export default EditCompany
