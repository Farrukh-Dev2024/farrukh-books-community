'use client'

import React, { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createaccount, updateaccount } from '@/features/company/accounts/actions/accountsactions'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { AccountTypes, AccountSubTypes } from '@/types/project-types'
import { User, Company, Account, Journal, Image, CompanyInvite } from '@/types/prisma-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function EditAccountDialog({
  children,
  companyId,
  account,
  onSuccess,
}: {
  children: React.ReactNode
  companyId: number
  account?: Account
  onSuccess: (acc: Account) => void
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    title: account?.title || '',
    description: account?.description || '',
    accountType: account?.accountType || 0,
    accountSubType: account?.accountSubType || 0,
    id: account?.id || undefined,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const action = account ? updateaccount : createaccount

      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('accountType', String(form.accountType))
      formData.append('accountSubType', String(form.accountSubType))
      formData.append('companyId', String(companyId))
      if (form.id) formData.append('id', String(form.id))

      const res = await action({}, formData)

      if (res.success) {
        toast.success(account ? 'Account updated' : 'Account created')
        if ('account' in res && res.account) {
          onSuccess(res.account)
        }
        setForm({
          title: '',
          description: '',
          accountType: 0,
          accountSubType: 0,
          id: undefined,
        })
        setOpen(false)
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? 'Edit Account' : 'Add Account'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Account title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Short description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* ✅ Account Type - using shadcn Select */}
          <div className="space-y-1">
            <Label htmlFor="accountType">Account Type</Label>
            <Select
              value={form.accountType ? String(form.accountType) : ''}
              onValueChange={(val) =>
                setForm({ ...form, accountType: Number(val) })
              }
            >
              <SelectTrigger id="accountType" className="w-full">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AccountTypes).map(([name, id]) => (
                  <SelectItem key={id} value={String(id)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ✅ Account SubType - using shadcn Select */}
          <div className="space-y-1">
            <Label htmlFor="accountSubType">Account SubType</Label>
            <Select
              value={form.accountSubType ? String(form.accountSubType) : ''}
              onValueChange={(val) =>
                setForm({ ...form, accountSubType: Number(val) })
              }
            >
              <SelectTrigger id="accountSubType" className="w-full">
                <SelectValue placeholder="Select sub type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AccountSubTypes).map(([name, id]) => (
                  <SelectItem key={id} value={String(id)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {account ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
