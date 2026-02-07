'use client'

import React, { useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, Edit } from 'lucide-react'
import { Vendor } from '@/types/prisma-types'

export default function VendorCard({
  vendor,
  onDelete,
  onEdit,
}: {
  vendor: Vendor
  onDelete: (id: number) => void
  onEdit: (vendor: Vendor) => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(() => onDelete(vendor.id))
  }

  return (
    <Card className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold truncate">
          {vendor.name}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(vendor)}
            title="Edit Vendor"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleDelete}
            title="Delete Vendor"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
        <p>
          <span className="font-medium">Email:</span>{' '}
          {vendor.email || <span className="text-gray-500">—</span>}
        </p>
        <p>
          <span className="font-medium">Phone:</span>{' '}
          {vendor.phone || <span className="text-gray-500">—</span>}
        </p>
        <p>
          <span className="font-medium">Address:</span>{' '}
          {vendor.address || <span className="text-gray-500">—</span>}
        </p>
        <p>
          <span className="font-medium">City:</span>{' '}
          {vendor.city || <span className="text-gray-500">—</span>}
        </p>
        <p>
          <span className="font-medium">Country:</span>{' '}
          {vendor.country || <span className="text-gray-500">—</span>}
        </p>                
      </CardContent>
    </Card>
  )
}
