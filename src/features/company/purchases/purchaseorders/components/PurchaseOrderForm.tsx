'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, X, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { createPurchaseOrder, updatePurchaseOrder } from '../actions/purchaseorderactions'
import { PrevState } from '@/types/project-types'
import { PurchaseOrder, PurchaseOrderItem } from '@/types/prisma-types'
import { useAppContext } from '@/context/AppContext'



const ORDER_STATUSES = ['DRAFT', 'OPEN', 'INVOICED', 'PAID', 'CANCELED']



export default function PurchaseOrderForm({
  order,
  onClose,
  onSaved,
}: {
  order: PurchaseOrder | null
  onClose: () => void
  onSaved: () => void
}) {
  const { appData } = useAppContext()
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<PrevState>({ success: false, message: '', errors: {} })

  const [vendorId, setVendorId] = useState<number | null>(order?.vendorId || null)
  const [issueDate, setIssueDate] = useState(
    order?.dateIssued ? new Date(order.dateIssued).toISOString().split('T')[0] : ''
  )
  const [dueDate, setDueDate] = useState(
    order?.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : ''
  )
  const [orderStatus, setOrderStatus] = useState(order?.orderStatus || 'DRAFT')
  const [discountAmount, setDiscountAmount] = useState(order?.discountAmount || 0)
  const [paidAmount, setPaidAmount] = useState(order?.paidAmount || 0)
  const [orderComments, setOrderComments] = useState(order?.orderComments || '')

  const [items, setItems] = useState<PurchaseOrderItem[]>(
    order?.items && Array.isArray(order.items)
      ? order.items.map((i) => ({
        id: i.id ?? 0,
        purchaseOrderId: i.purchaseOrderId ?? 0,
        productId: i.productId ?? 0,
        quantity: Number(i.quantity ?? i.quantity ?? 1),
        unitCost: Number(i.unitCost ?? i.unitCost ?? 0),
        discountAmount: Number(i.discountAmount ?? i.discountAmount ?? 0),
        totalCost: Number(i.totalCost ?? i.totalCost ?? 0),
        isDeleted: i.isDeleted ?? false,
        extraData: i.extraData ?? null,
        createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
        updatedAt: i.updatedAt ? new Date(i.updatedAt) : new Date(),
      }))
      : [
        {
          id: 0,
          purchaseOrderId: 0,
          productId: null,
          quantity: 1,
          unitCost: 0,
          discountAmount: 0,
          totalCost: 0,
          isDeleted: false,
          extraData: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
  )

  const isEdit = !!order

  // 🔹 Handle product/field changes
  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    const updated = [...items]

    if (field === 'productId') {
      const selectedProduct = appData.products?.find((p) => p.id.toString() === value)
      if (selectedProduct) {
        updated[index] = {
          ...updated[index],
          productId: selectedProduct.id,
          //productTitle: selectedProduct.title,
          unitCost: Number(selectedProduct.costPrice) || 0,
        }
      }
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) }
    }

    const item = updated[index]
    item.totalCost = item.quantity * item.unitCost - item.discountAmount
    setItems(updated)
  }

  const addItemRow = () => {
    setItems((prev) => [...prev,
    {
      id: 0,
      purchaseOrderId: 0,
      productId: null,
      quantity: 1,
      unitCost: 0,
      discountAmount: 0,
      totalCost: 0,
      isDeleted: false,
      extraData: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },])
  }

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  // 🔹 Totals
  const subtotal = items.reduce((sum, i) => sum + i.totalCost, 0)
  const grandTotal = subtotal - discountAmount

  // 🔹 Submit
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!vendorId) return toast.error('Please select a vendor.')

    const formData = new FormData()
    if (order?.id) formData.append('id', order.id.toString())
    formData.append('vendorId', vendorId.toString())
    formData.append('dateIssued', issueDate)
    formData.append('dueDate', dueDate)
    formData.append('orderStatus', orderStatus)
    formData.append('totalAmount', grandTotal.toString())
    formData.append('items', JSON.stringify(items))
    formData.append('discountAmount', discountAmount.toString())
    formData.append('paidAmount', paidAmount.toString())
    formData.append('orderComments', orderComments)
    startTransition(async () => {
      const res = isEdit ? await updatePurchaseOrder(state, formData) : await createPurchaseOrder(state, formData)
      setState(res)

      if (res.success) {
        toast.success(isEdit ? 'Purchase order updated' : 'Purchase order created')
        onSaved()
        onClose()
      } else if (res.message) {
        toast.error(res.message)
      }
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-3xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 relative max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <Button variant="ghost" size="icon" className="absolute top-3 right-3" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>

        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">



            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">

              {/* Vendor */}
              <div className='space-y-2'>
                <Label>Vendor</Label>
                <Select value={vendorId?.toString()} onValueChange={(val) => setVendorId(val ? Number(val) : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {appData.vendors?.map((v) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Find selected vendor */}
                {(() => {
                  const selectedVendor = appData.vendors?.find(c => c.id === vendorId);
                  return (
                    <h1 className="mt-2">
                      Account Balance: {selectedVendor?.apBalance ?? 0}
                    </h1>
                  );
                })()}
              </div>
              {/* Dates */}
              <div className='space-y-2'>
                <Label>Issue Date</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className='space-y-2'>
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select order status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Order Comments */}
            <div className="space-y-2">
              <Label>Order Comments</Label>
              <textarea
                className="w-full border rounded-md p-2 dark:bg-gray-800 dark:text-white"
                value={orderComments}
                onChange={(e) => setOrderComments(e.target.value)}
                placeholder="Add any comments for this order..."
                rows={3}
              />
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto border rounded-md w-full max-w-full">
              <table className="w-full min-w-[650px] text-sm">
                <thead className="bg-gray-200 dark:bg-gray-800">
                  <tr>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Discount</th>
                    <th className="p-2 text-right">Total {appData.company?.currencyCode}</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const total = item.quantity * item.unitCost - item.discountAmount
                    return (
                      <tr key={i} className="border-t">
                        <td className="p-2">
                          <Select
                            value={item.productId?.toString() || ''}
                            onValueChange={(val) => handleItemChange(i, 'productId', val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={item.productId || 'Select Product'} />
                            </SelectTrigger>
                            <SelectContent>
                              {appData.products?.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2 text-right">
                          <Input
                            type="number"
                            value={item.quantity}
                            min={1}
                            onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
                            className="text-right"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <Input
                            type="number"
                            value={item.unitCost}
                            step="0.01"
                            onChange={(e) => handleItemChange(i, 'unitCost', e.target.value)}
                            className="text-right"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <Input
                            type="number"
                            value={item.discountAmount}
                            step="0.01"
                            onChange={(e) => handleItemChange(i, 'discountAmount', e.target.value)}
                            className="text-right"
                          />
                        </td>
                        <td className="p-2 text-right">{total}</td>
                        <td className="p-2 text-center">
                          <Button type="button" size="icon" variant="ghost" onClick={() => removeItemRow(i)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Add Line */}
            <div className="flex justify-end">
              <Button type="button" onClick={addItemRow} variant="secondary" className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Line</span>
              </Button>
            </div>


            {/* Totals + Paid Amount */}
            <div className="flex flex-col sm:flex-row justify-between border-t pt-3">
              <div className="space-y-2">
                <Label>Overall Discount</Label>
                <Input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-40"
                />
                <Label>Paid Amount</Label>
                <Input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-40"
                />
              </div>
              <div className="text-right space-y-1 mt-3 sm:mt-0">
                <p className="font-semibold">Subtotal: {subtotal.toLocaleString()}</p>
                <p className="font-semibold">Grand Total: {grandTotal.toLocaleString()}</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 pt-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {/* Submit */}
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Saving...
                  </>
                ) : isEdit ? (
                  'Update Order'
                ) : (
                  'Create Order'
                )}
              </Button>
            </div>

            {state.message && (
              <p className={`text-sm mt-2 ${state.success ? 'text-green-600' : 'text-red-600'}`}>{state.message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
