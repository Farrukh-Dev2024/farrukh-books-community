'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { getPurchaseOrders, deletePurchaseOrder } from '../actions/purchaseorderactions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Plus, Trash2, Edit } from 'lucide-react'
import PurchaseOrderForm from './PurchaseOrderForm'
import { PurchaseOrder } from '@/types/prisma-types'
import { format } from 'date-fns'
import { useAppContext } from '@/context/AppContext'

export default function PurchaseOrderList() {
  const { appData, setAppData } = useAppContext()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)

  async function loadOrders() {
    setLoading(true)
    const res = await getPurchaseOrders()
    if (Array.isArray(res)) setOrders(res as unknown as PurchaseOrder[])
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
  }, [])

  function handleAdd() {
    setSelectedOrder(null)
    setShowForm(true)
  }

  function handleEdit(order: PurchaseOrder) {
    setSelectedOrder(order)
    setShowForm(true)
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const res = await deletePurchaseOrder(id)
      if (res.success) loadOrders()
    })
  }

  return (
    <div className="max-w-5xl w-full mx-auto mt-6 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Purchase Orders</h2>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Purchase Order
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-500">No purchase orders found.</p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900 text-left">
                  <th className="py-2 px-3">Order #</th>
                  <th className="py-2 px-3">Vendor</th>
                  <th className="py-2 px-3">Total {appData.company?.currencyCode}</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Due Date</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-2 px-3">{order.orderNumber}</td>
                    <td className="py-2 px-3">{order.vendor?.name || '-'}</td>
                    <td className="py-2 px-3">{order.totalAmount.toString()}</td>
                    <td className="py-2 px-3">{order.orderStatus}</td>
                    <td className="py-2 px-3">
                      {order.dueDate ? format(new Date(order.dueDate), 'dd-MMM-yyyy') : '-'}
                    </td>
                    <td className="py-2 px-3 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(order)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => handleDelete(order.id)}
                      >
                        {isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="p-4 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{order.orderNumber}</span>
                  <span className="text-sm text-gray-500">{order.orderStatus}</span>
                </div>
                <p className="text-sm">Vendor: {order.vendor?.name || '-'}</p>
                <p className="text-sm">Total: {order.totalAmount.toString()} {appData.company?.currencyCode}</p>
                <p className="text-sm">
                  Due: {order.dueDate ? format(new Date(order.dueDate), 'dd-MMM-yyyy') : '-'}
                </p>
                <div className="flex justify-end mt-3 space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(order)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => handleDelete(order.id)}
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Modal Form */}
      {showForm && (
        <PurchaseOrderForm
          order={selectedOrder}
          onClose={() => setShowForm(false)}
          onSaved={loadOrders}
        />
      )}
    </div>
  )
}
