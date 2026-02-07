'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { getCustomers, deleteCustomer } from '../actions/customeractions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useYesNoDialog } from '@/features/yesnodialog/useYesNoDialog'
import { Customer } from '@/types/prisma-types'
import CustomerForm from './CustomerForm'
import { useAppContext } from '@/context/AppContext';


export default function CustomerList() {
  const { showYesNoDialog, YesNoDialog } = useYesNoDialog()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const { appData, setAppData } = useAppContext();

  async function refreshCustomers() {
    startTransition(async () => {
      const res = await getCustomers()
      if (Array.isArray(res)) {
        setCustomers(res);
        setAppData((prev)=>({ ...prev,customers: res || null}));
      } else {
        toast.error('Failed to fetch customers')
        setCustomers([])
      }
    })
  }

  useEffect(() => {
    refreshCustomers()
  }, [])

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase()) ||
      c.country?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (c: Customer) => {
    const confirmed = await showYesNoDialog({
      title: 'Delete Customer',
      content: (
        <div>
          Are you sure you want to delete customer
          <b> {c.name}</b>?<br />
          This action{' '}
          <span className="text-red-500 font-semibold">cannot</span> be undone.
        </div>
      ),
    })

    if (!confirmed) return

    const res = await deleteCustomer(c.id)
    if (res?.success) {
      toast.success(res.message)
      setCustomers((prev) => prev.filter((cust) => cust.id !== c.id))
    } else {
      toast.error(res?.message || 'Failed to delete customer')
    }
  }

  return (
    <Card className="mt-6 max-w-5xl mx-auto w-full">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <CardTitle>Customer List</CardTitle>
        </div>

        <Input
          placeholder="Search by name, email, phone, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64"
        />

        <Button className="ml-auto" onClick={() => setIsAdding(true)}>
          + Add Customer
        </Button>
      </CardHeader>

      <CardContent className="w-full">
        {isPending ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No customers found</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full border border-gray-200 text-sm w-full">
              <thead className="bg-gray-50 text-gray-700 hidden md:table-header-group">
                <tr>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Email</th>
                  <th className="px-4 py-2 border">Phone</th>
                  <th className="px-4 py-2 border">Address</th>
                  <th className="px-4 py-2 border">City</th>
                  <th className="px-4 py-2 border">Country</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>

              <tbody className="block md:table-row-group w-full">
                {filtered.map((c) => (
                  <tr key={c.id} className="block md:table-row mb-4 border p-4 md:p-0 w-full">
                    <td className="block md:table-cell px-4 py-1 text-center">
                      <span className="font-medium md:hidden">Name: </span>
                      {c.name}
                    </td>
                    <td className="block md:table-cell px-4 py-1 text-center">
                      <span className="font-medium md:hidden">Email: </span>
                      {c.email || '-'}
                    </td>
                    <td className="block md:table-cell px-4 py-1 text-center">
                      <span className="font-medium md:hidden">Phone: </span>
                      {c.phone || '-'}
                    </td>
                    <td className="block md:table-cell px-4 py-1 text-center">
                      <span className="font-medium md:hidden">Address: </span>
                      {c.address || '-'}
                    </td>                    
                    <td className="block md:table-cell px-4 py-1 text-center">
                      <span className="font-medium md:hidden">City: </span>
                      {c.city || '-'}
                    </td>
                    <td className="block md:table-cell px-4 py-1 text-center">
                      <span className="font-medium md:hidden">Country: </span>
                      {c.country || '-'}
                    </td>
                    <td className="block md:table-cell px-4 py-1 text-center">
                      <div className="flex gap-2 justify-center flex-wrap">
                        <Button
                          size="sm"
                          className="w-20"
                          variant="outline"
                          onClick={() => setEditingCustomer(c)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          className="w-20"
                          variant="destructive"
                          onClick={() => handleDelete(c)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {(isAdding || editingCustomer) && (
        <div className="fixed inset-0 bg-background bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
          <div className="p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </h2>

            <CustomerForm
              customer={editingCustomer || undefined}
              mode={editingCustomer ? 'edit' : 'create'}
              onSuccess={async () => {
                toast.success(editingCustomer ? 'Customer updated' : 'Customer added')
                setEditingCustomer(null)
                setIsAdding(false)
                await refreshCustomers()
              }}
              onCancel={() => {
                setEditingCustomer(null)
                setIsAdding(false)
              }}
            />
          </div>
        </div>
      )}

      {YesNoDialog}
    </Card>
  )
}
