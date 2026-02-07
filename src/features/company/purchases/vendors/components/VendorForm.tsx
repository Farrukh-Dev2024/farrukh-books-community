'use client'

import React, { useTransition } from 'react'
import { createVendor, updateVendor } from '../actions/vendoractions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, X } from 'lucide-react'
import { Vendor } from '@/types/prisma-types'
import { toast } from 'sonner'

export default function VendorForm({
  onClose,
  onSaved,
  vendor,
}: {
  onClose?: () => void
  onSaved?: () => void
  vendor?: Vendor
}) {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = vendor
        ? await updateVendor({}, formData)
        : await createVendor({}, formData)

      if (res.success) {
        onSaved?.()
        onClose?.()
      } else {
        toast.error(res.message)
      }
    })
  }

  // detect if opened directly (not from Vendor List)
  const isDirect = !onClose && !onSaved

  return (
    <div
      className={
        isDirect
          ? 'p-4 flex justify-center'
          : 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
      }
    >
      <Card className="w-full max-w-md">
        <CardHeader className="flex justify-between items-center flex-row">
          <CardTitle>{vendor ? 'Edit Vendor' : 'Add Vendor'}</CardTitle>
          {!isDirect && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input hidden name="id" defaultValue={vendor?.id || ''} />
            <Input
              name="name"
              placeholder="Name"
              defaultValue={vendor?.name || ''}
              required
            />
            <Input
              name="email"
              placeholder="Email (optional)"
              type="email"
              defaultValue={vendor?.email || ''}
            />
            <Input
              name="phone"
              placeholder="Phone (optional)"
              defaultValue={vendor?.phone || ''}
            />
            <Input
              name="address"
              placeholder="Address (optional)"
              defaultValue={vendor?.address || ''}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
