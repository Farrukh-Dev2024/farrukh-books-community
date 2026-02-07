'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Edit, Loader2 } from 'lucide-react'
import { PurchaseOrder, Vendor } from '@/types/prisma-types'


type PurchaseOrderCardProps = {
  order: PurchaseOrder & { vendor?: Vendor | null }
  onDelete: (id: number) => void
  onEdit: (order: PurchaseOrder) => void
  isPending?: boolean
}

export default function PurchaseOrderCard({
  order,
  onDelete,
  onEdit,
  isPending = false,
}: PurchaseOrderCardProps) {
  const total = Number(order.totalAmount)
 
  return (
    <Card className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100">
            PO #{order.orderNumber}
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {order.vendor?.name || 'Unknown Vendor'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(order)}
            disabled={isPending}
            className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Edit className="w-4 h-4" />
            )}
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(order.id)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="text-sm text-gray-700 dark:text-gray-300 space-y-1 pt-1">
        <p>
          Status:{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {order.orderStatus}
          </span>
        </p>
        <p>
          Total:{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {total}
          </span>
        </p>
        <p>
          Due Date:{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {order.dueDate
              ? new Date(order.dueDate).toLocaleDateString()
              : '-'}
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
