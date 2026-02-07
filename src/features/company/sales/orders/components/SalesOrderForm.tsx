'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Product, SalesOrder, OrderStatus, ORDER_STATUSES } from '@/types/prisma-types'
import { createSalesOrder, updateSalesOrder } from '../actions/salesorderactions'
import { PrevState } from '@/types/project-types'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppContext } from '@/context/AppContext'
import { toast } from 'sonner'

interface SalesOrderFormProps {
  mode: 'create' | 'edit'
  existingData?: SalesOrder
  onSuccess: () => void
}

interface ItemRow {
  id: number | null
  productId: number | null
  productTitle: string
  quantity: number
  unitPrice: number
  discountAmount: number
  totalPrice: number
}

export default function SalesOrderForm({ mode, existingData, onSuccess }: SalesOrderFormProps) {
  const { appData } = useAppContext()
  const [customerId, setCustomerId] = useState<number | null>(existingData?.customerId || null)
  const [dueDate, setDueDate] = useState<string>(
    existingData?.dueDate?.toISOString().split('T')[0] || ''
  )
  const [orderStatus, setOrderStatus] = useState<string>(
    existingData?.orderStatus || ORDER_STATUSES[0]
  )
  const [items, setItems] = useState<ItemRow[]>([])
  const [discount, setDiscount] = useState<number>(existingData?.discountAmount || 0)

  // NEW FIELDS
  const [paidAmount, setPaidAmount] = useState<number>(Number(existingData?.paidAmount || 0))
  const [orderComments, setOrderComments] = useState<string>(existingData?.orderComments || '')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (existingData?.items) {
      const initItems = existingData.items.map(i => ({
        id: i.id,
        productId: i.productId,
        productTitle: i.product?.title || '',
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discountAmount: Number(i.discountAmount || 0),
        totalPrice: Number(i.totalPrice),
      }))
      setItems(initItems)
      setCustomerId(existingData.customerId)
      setDueDate(existingData.dueDate ? existingData.dueDate.toISOString().split('T')[0] : '')
      setOrderStatus(existingData.orderStatus)
      setDiscount(existingData.discountAmount)

      // NEW
      setPaidAmount(Number(existingData.paidAmount || 0))
      setOrderComments(existingData.orderComments || '')
    } else {
      setItems([
        {
          id: null,
          productId: null,
          productTitle: '',
          quantity: 1,
          unitPrice: 0,
          discountAmount: 0,
          totalPrice: 0,
        },
      ])
    }
  }, [existingData])

  const handleItemChange = <K extends keyof ItemRow>(
    index: number,
    field: K,
    value: ItemRow[K]
  ) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }

    if (['quantity', 'unitPrice', 'discountAmount'].includes(field as string)) {
      const { quantity, unitPrice, discountAmount } = updated[index]
      updated[index].totalPrice = quantity * unitPrice - (discountAmount || 0)
    }
    setItems(updated)
  }

  const addItemRow = () => {
    setItems([
      ...items,
      { id: null, productId: null, productTitle: '', quantity: 1, unitPrice: 0, discountAmount: 0, totalPrice: 0 },
    ])
  }

  const removeItemRow = (index: number) => {
    const updated = items.filter((_, i) => i !== index)
    setItems(
      updated.length
        ? updated
        : [{ id:null, productId: null, productTitle: '', quantity: 1, unitPrice: 0, discountAmount: 0, totalPrice: 0 }]
    )
  }

  const calculateSubtotal = () => items.reduce((acc, i) => acc + i.totalPrice, 0)
  const calculateTotal = () => calculateSubtotal() - discount

  const handleSubmit = async () => {
    if (!customerId) return toast.error('Customer is required!')
    setLoading(true)

    const formData = new FormData()
    if (mode === 'edit') formData.append('id', existingData!.id.toString())
    formData.append('customerId', customerId.toString())
    formData.append('dueDate', dueDate)
    formData.append('orderStatus', orderStatus)
    formData.append('discountAmount', discount.toString())
    formData.append('totalAmount', calculateTotal().toString())
    formData.append('items', JSON.stringify(items))

    // NEW FIELDS
    formData.append('paidAmount', paidAmount.toString())
    formData.append('orderComments', orderComments)

    let result: PrevState
    if (mode === 'create') result = await createSalesOrder({}, formData)
    else result = await updateSalesOrder({}, formData)

    setLoading(false)
    if (result.success) onSuccess()
    else toast.error(result.message)
  }

  return (
    <div className="max-w-5xl w-full mx-auto mt-6 shadow-md border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-black space-y-6 overflow-y-auto max-h-[80vh]">

      {/* Header Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer */}
        <div className="space-y-2">
          <Label className="text-gray-800 dark:text-gray-200">Customer</Label>
          <Select
            value={customerId ? customerId.toString() : ''}
            onValueChange={val => setCustomerId(Number(val))}
          >
            <SelectTrigger className="w-full bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
              <SelectValue placeholder="Select Customer" />
            </SelectTrigger>
            <SelectContent>
              {appData.customers?.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Find selected customer */}
          {(() => {
            const selectedCustomer = appData.customers?.find(c => c.id === customerId);
            return (
              <h1 className="mt-2">
                Account Balance: {selectedCustomer?.arBalance ?? 0}
              </h1>
            );
          })()}
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label className="text-gray-800 dark:text-gray-200">Due Date</Label>
          <Input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-gray-800 dark:text-gray-200">Order Status</Label>
          <Select value={orderStatus} onValueChange={val => setOrderStatus(val as OrderStatus)}>
            <SelectTrigger className="w-full bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map(status => (
                <SelectItem key={status.toString()} value={status.toString()}>
                  {status.toString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[50vh] border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 min-w-[150px]">
                Product
              </th>
              <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 min-w-[80px]">
                Qty
              </th>
              <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 min-w-[120px]">
                Unit Price
              </th>
              <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 min-w-[110px]">
                Discount
              </th>
              <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 min-w-[120px]">
                Total
              </th>
              <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 text-right min-w-[90px]">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, idx) => (
              <tr
                key={idx}
                className={`${idx % 2 === 0
                    ? 'bg-gray-100 dark:bg-gray-900'
                    : 'bg-gray-50 dark:bg-gray-800'
                  } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
              >
                {/* Product */}
                <td className="px-4 py-2 min-w-[150px]">
                  <Select
                    key={idx}
                    value={item.productId ? item.productId.toString() : ''}
                    onValueChange={(val) => {
                      const selected = appData.products?.find(
                        (p: Product) => p.id === Number(val)
                      )
                      const updated = [...items]
                      updated[idx] = {
                        ...updated[idx],
                        productId: Number(val),
                        productTitle: selected?.title || '',
                        unitPrice: selected?.sellingPrice || 0,
                        totalPrice:
                          (selected?.sellingPrice || 0) * updated[idx].quantity -
                          (updated[idx].discountAmount || 0),
                      }
                      setItems(updated)
                    }}
                  >
                    <SelectTrigger className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                      <SelectValue
                        placeholder={item.productTitle || 'Select Product'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {appData.products?.map((p: Product) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>

                {/* Quantity */}
                <td className="px-4 py-2 min-w-[80px]">
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(idx, 'quantity', Number(e.target.value))
                    }
                    className="w-full bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                  />
                </td>

                {/* Unit Price */}
                <td className="px-4 py-2 min-w-[120px]">
                  <Input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleItemChange(idx, 'unitPrice', Number(e.target.value))
                    }
                    className="w-full bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                  />
                </td>

                {/* Discount */}
                <td className="px-4 py-2 min-w-[110px]">
                  <Input
                    type="number"
                    value={item.discountAmount}
                    onChange={(e) =>
                      handleItemChange(idx, 'discountAmount', Number(e.target.value))
                    }
                    className="w-full bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                  />
                </td>

                {/* Total */}
                <td className="px-4 py-2 min-w-[120px] text-gray-800 dark:text-gray-200">
                  {item.totalPrice.toFixed(2)}
                </td>

                {/* Remove */}
                <td className="px-4 py-2 text-right min-w-[90px]">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItemRow(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        type="button"
        onClick={addItemRow}
        className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
      >
        <Plus size={16} /> Add Item
      </Button>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Subtotal */}
        <div className="space-y-1">
          <Label className="text-gray-800 dark:text-gray-200">Subtotal</Label>
          <Input
            value={calculateSubtotal().toFixed(2)}
            readOnly
            className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Discount */}
        <div className="space-y-1">
          <Label className="text-gray-800 dark:text-gray-200">Discount</Label>
          <Input
            type="number"
            value={discount}
            onChange={e => setDiscount(Number(e.target.value))}
            className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Total Amount */}
        <div className="space-y-1">
          <Label className="text-gray-800 dark:text-gray-200">Total Amount</Label>
          <Input
            value={calculateTotal().toFixed(2)}
            readOnly
            className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          />
        </div>

        {/* NEW: Paid Amount */}
        <div className="space-y-1">
          <Label className="text-gray-800 dark:text-gray-200">Paid Amount</Label>
          <Input
            type="number"
            value={paidAmount}
            onChange={e => setPaidAmount(Number(e.target.value))}
            className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
          />
        </div>
      </div>

      {/* NEW: Order Comments */}
      <div className="space-y-2">
        <Label className="text-gray-800 dark:text-gray-200">Order Comments</Label>
        <textarea
          value={orderComments}
          onChange={(e) => setOrderComments(e.target.value)}
          rows={4}
          className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-800 dark:text-gray-200"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading && <Loader2 className="animate-spin" />}
          {mode === 'create' ? 'Create Order' : 'Update Order'}
        </Button>
      </div>

    </div>
  )
}
