//CustomerForm.tsx
'use client'

import { useActionState, useEffect, useState } from 'react'
import { createCustomer, updateCustomer } from '../actions/customeractions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PrevState } from '@/types/project-types'

interface CustomerFormProps {
  customer?: {
    id: number
    name: string
    email?: string | null
    phone?: string | null
    address?: string | null
    city?: string | null
    country?: string | null
  }
  mode?: 'create' | 'edit'
  onSuccess?: () => void
  onCancel?: () => void
}

export default function CustomerForm({
  customer,
  mode = 'create',
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const [state, formAction] = useActionState<PrevState, FormData>(
    mode === 'create' ? createCustomer : updateCustomer,
    { success: false, message: '', errors: {} }
  )

  const [message, setMessage] = useState('')

  useEffect(() => {
    if (state.success && onSuccess) onSuccess()
    if (state.message) setMessage(state.message)
  }, [state, onSuccess])

  return (
    <Card className="max-w-lg w-full mx-auto mt-6 shadow-md border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-semibold">
          {mode === 'create' ? 'Add New Customer' : 'Edit Customer'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6 w-full">
          {mode === 'edit' && (
            <input type="hidden" name="id" value={customer?.id} />
          )}

          {/* Name */}
          <div className="flex flex-col w-full space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={customer?.name || ''}
              placeholder="Customer Name"
              required
            />
            {state.errors?.name && (
              <p className="text-red-500 text-sm mt-1">{state.errors.name}</p>
            )}
          </div>

          {/* Email / Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col w-full space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={customer?.email || ''}
                placeholder="customer@example.com"
              />
              {state.errors?.email && (
                <p className="text-red-500 text-sm mt-1">{state.errors.email}</p>
              )}
            </div>
            <div className="flex flex-col w-full space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={customer?.phone || ''}
                placeholder="e.g. +92 300 1234567"
              />
              {state.errors?.phone && (
                <p className="text-red-500 text-sm mt-1">{state.errors.phone}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col w-full space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={customer?.address || ''}
              placeholder="Street, Area, ZIP"
            />
            {state.errors?.address && (
              <p className="text-red-500 text-sm mt-1">{state.errors.address}</p>
            )}
          </div>

          {/* City / Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col w-full space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={customer?.city || ''}
                placeholder="City"
              />
              {state.errors?.city && (
                <p className="text-red-500 text-sm mt-1">{state.errors.city}</p>
              )}
            </div>
            <div className="flex flex-col w-full space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                defaultValue={customer?.country || ''}
                placeholder="Country"
              />
              {state.errors?.country && (
                <p className="text-red-500 text-sm mt-1">{state.errors.country}</p>
              )}
            </div>
          </div>

          {/* Form messages */}
          {message && (
            <p
              className={`text-sm ${
                state.success ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={state.success === null}>
              {mode === 'create'
                ? state.success === null
                  ? 'Creating...'
                  : 'Create Customer'
                : state.success === null
                ? 'Updating...'
                : 'Update Customer'}
            </Button>

            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
