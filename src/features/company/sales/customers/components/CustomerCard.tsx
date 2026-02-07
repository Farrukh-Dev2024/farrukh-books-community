'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CustomerCardProps {
  customer: {
    id: number
    name: string
    email?: string | null
    phone?: string | null
    address?: string | null
    city?: string | null
    country?: string | null
  }
  onDelete?: (id: number) => void
  compact?: boolean // true → smaller variant for inline or embedded views
}

export default function CustomerCard({ customer, onDelete, compact = false }: CustomerCardProps) {
  const router = useRouter()

  return (
    <Card className={`border shadow-sm ${compact ? 'p-2' : ''}`}>
      <CardContent className={`${compact ? 'p-2' : 'p-4'} space-y-2`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-lg">{customer.name}</p>
            {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
            {customer.phone && <p className="text-sm">{customer.phone}</p>}
            {(customer.city || customer.country) && (
              <p className="text-sm text-muted-foreground">
                {[customer.city, customer.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size={compact ? 'sm' : 'icon'}
              onClick={() => router.push(`/company/sales/customers/edit/${customer.id}`)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            {onDelete && (
              <Button
                variant="destructive"
                size={compact ? 'sm' : 'icon'}
                onClick={() => onDelete(customer.id)}
              >
                <Trash className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {!compact && customer.address && (
          <p className="text-sm text-muted-foreground">{customer.address}</p>
        )}
      </CardContent>
    </Card>
  )
}
