'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { getVendors, deleteVendor } from '../actions/vendoractions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Plus, Trash2, Edit } from 'lucide-react'
import VendorForm from './VendorForm'
import VendorCard from './VendorCard'
import { Vendor } from '@/types/prisma-types'
import { useAppContext } from '@/context/AppContext';
import { toast } from 'sonner'


export default function VendorList() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editVendor, setEditVendor] = useState<Vendor | null>(null)
  const { appData, setAppData } = useAppContext();

  useEffect(() => {
    loadVendors()
  }, [])

  async function loadVendors() {
    setLoading(true)
    const res = await getVendors()
    if (Array.isArray(res)) {
      setVendors(res || [])
      setAppData((prev)=>({ ...prev, vendors: res || [] }));
      
    }
    setLoading(false)
  }

  async function handleDelete(id: number) {
    startTransition(async () => {
      const res = await deleteVendor(id)
      if (res.success) loadVendors()
      else toast.error(res.message)
    })
  }

  function handleEdit(vendor: Vendor) {
    setEditVendor(vendor)
    setOpenForm(true)
  }

  const filtered = vendors.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-5xl w-full mx-auto mt-6 space-y-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl w-full mx-auto mt-6 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <Button
          onClick={() => {
            setEditVendor(null)
            setOpenForm(true)
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Add Vendor
        </Button>
      </div>

      {/* Table view (Desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Address</th>
              <th className="p-3 text-left">City</th>
              <th className="p-3 text-left">Country</th>              
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-500">
                  No vendors found
                </td>
              </tr>
            ) : (
              filtered.map(v => (
                <tr
                  key={v.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="p-3 font-medium">{v.name}</td>
                  <td className="p-3">{v.email || '-'}</td>
                  <td className="p-3">{v.phone || '-'}</td>
                  <td className="p-3">{v.address || '-'}</td>
                  <td className="p-3">{v.city || '-'}</td>
                  <td className="p-3">{v.country || '-'}</td>                                    
                  <td className="p-3  space-x-2 flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(v)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDelete(v.id)}
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile view (Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {filtered.map(v => (
          <VendorCard
            key={v.id}
            vendor={v}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {/* Modal form */}
      {openForm && (
        <VendorForm
          vendor={editVendor ?? undefined}
          onClose={() => {
            setOpenForm(false)
            setEditVendor(null)
          }}
          onSaved={loadVendors}
        />
      )}
    </div>
  )
}
