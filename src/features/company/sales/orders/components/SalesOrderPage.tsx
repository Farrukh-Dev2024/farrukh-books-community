'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Plus, Trash2, Edit } from 'lucide-react'
import { SalesOrder } from '@/types/prisma-types'
import { useYesNoDialog } from '@/features/yesnodialog/useYesNoDialog'
import SalesOrderForm from './SalesOrderForm'
import { getSalesOrders, deleteSalesOrder } from '../actions/salesorderactions'
import { useAppContext } from '@/context/AppContext'

export default function SalesOrderPage() {
  const { appData, setAppData } = useAppContext()
  const { showYesNoDialog, YesNoDialog } = useYesNoDialog()
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    const data = await getSalesOrders()
    if (Array.isArray(data)) setOrders(data as unknown as SalesOrder[])
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleDelete = async (id: number) => {
    const confirmed = await showYesNoDialog({
      title: 'Delete Order',
      content: (
        <div>
          Are you sure you want to delete order <b>Order ID: {id}</b>?<br />
          This action <span className="text-red-500 font-semibold">cannot</span> be undone.
        </div>
      ),
    })

    if (!confirmed) return
    setDeletingId(id)
    await deleteSalesOrder(id)
    await fetchOrders()
    setDeletingId(null)
  }

  const handleSuccess = async () => {
    setShowForm(false)
    setEditingOrder(null)
    await fetchOrders()
  }

  return (
    <div className="max-w-5xl w-full mx-auto mt-6 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Sales Orders</h2>
        <Button
          onClick={() => {
            setEditingOrder(null)
            setShowForm(true)
          }}
          className="flex items-center bg-gray-800 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-black dark:hover:bg-gray-300"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Order
        </Button>
      </div>

      {/* Orders List */}
      <Card className="overflow-x-auto border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg">
{loading ? (
  <div className="flex justify-center items-center py-10 text-gray-600 dark:text-gray-300">
    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading orders...
  </div>
) : orders.length === 0 ? (
  <p className="text-center py-8 text-gray-500 dark:text-gray-400">No orders found.</p>
) : (
  <>
    {/* Desktop Table */}
    <div className="hidden md:block">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200">Order #</th>
            <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200">Customer</th>
            <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200">Total {appData.company?.currencyCode}</th>
            <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200">Due Date</th>
            <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200">Status</th>
            <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, idx) => (
            <tr
              key={o.id}
              className={`${
                idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
              } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            >
              <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{o.orderNumber}</td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{o.customer?.name || '-'}</td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{Number(o.totalAmount).toFixed(2)}</td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                {o.dueDate ? new Date(o.dueDate).toLocaleDateString() : '-'}
              </td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{o.orderStatus}</td>
              <td className="px-4 py-2 flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    setEditingOrder(o)
                    setShowForm(true)
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deletingId === o.id}
                  onClick={() => handleDelete(o.id)}
                >
                  {deletingId === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Mobile Card View */}
    <div className="md:hidden space-y-4">
      {orders.map((o) => (
        <Card
          key={o.id}
          className="p-4 m-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Order #{o.orderNumber}</h3>
            <span className="text-sm text-gray-600 dark:text-gray-300">{o.orderStatus}</span>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p>
              <span className="font-medium">Customer:</span> {o.customer?.name || '-'}
            </p>
            <p>
              <span className="font-medium">Total:</span> {Number(o.totalAmount).toFixed(2)} {appData.company?.currencyCode}
            </p>
            <p>
              <span className="font-medium">Due Date:</span>{' '}
              {o.dueDate ? new Date(o.dueDate).toLocaleDateString() : '-'}
            </p>
          </div>
          <div className="flex justify-end space-x-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setEditingOrder(o)
                setShowForm(true)
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={deletingId === o.id}
              onClick={() => handleDelete(o.id)}
            >
              {deletingId === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  </>
)}

      </Card>

      {/* Modal for Create/Edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 p-4 max-w-4xl w-full">
            <SalesOrderForm mode={editingOrder ? 'edit' : 'create'} existingData={editingOrder ?? undefined} onSuccess={handleSuccess} />
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingOrder(null)
                }}
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {YesNoDialog}
    </div>
  )
}
