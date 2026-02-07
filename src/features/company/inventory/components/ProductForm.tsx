'use client'

import React, { useTransition, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Switch } from "@/components/ui/switch"
import { createProduct, updateProduct } from '../actions/productactions'
import { toast } from 'sonner'
import { Product, ProductCategory } from '@/types/prisma-types'
import { getCategories } from '../actions/categoryactions'

// ✅ Zod Schema
const ProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  sellingPrice: z.coerce.number().nonnegative({ message: 'Selling price must be non-negative' }),
  costPrice: z.coerce.number().nonnegative({ message: 'Cost price must be non-negative' }),
  reorderLevel: z.coerce.number().optional(),
  stockQuantity: z.coerce.number().optional(),
  defaultLocation: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  isActive: z.boolean().default(false).optional(),
})

type ProductFormData = z.infer<typeof ProductSchema>

interface ProductFormProps {
  product?: Product
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [categoryId, setCategoryId] = useState(product?.categoryId?.toString() || '')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema),
    defaultValues: product
      ? {
        title: product.title,
        sku: product.sku,
        barcode: product.barcode ?? '',
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        reorderLevel: product.reorderLevel ?? undefined,
        stockQuantity: product.stockQuantity ?? undefined,
        description: product.description ?? '',
        categoryId: product.categoryId ?? undefined,
        defaultLocation: product.defaultLocation ?? '',
        isActive: product.isActive,
      }
      : undefined,
  })

  // 🔹 Load categories
  useEffect(() => {
    const load = async () => {
      const res = await getCategories()
      if (Array.isArray(res)) setCategories(res)
    }
    load()
  }, [])

  // 🔹 Sync category if editing existing product
  useEffect(() => {
    if (product?.categoryId) setCategoryId(product.categoryId.toString())
  }, [product])

  // 🔹 Reset form when editing different product
  useEffect(() => {
    if (product) {
      reset({
        title: product.title,
        sku: product.sku,
        barcode: product.barcode ?? '',
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        reorderLevel: product.reorderLevel ?? undefined,
        stockQuantity: product.stockQuantity ?? undefined,
        description: product.description ?? '',
        categoryId: product.categoryId ?? undefined,
        defaultLocation: product.defaultLocation ?? '',
        isActive: product.isActive,
      })
    }
  }, [product, reset])

  // 🔹 Submit handler
  const onSubmit = async (data: ProductFormData) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value.toString())
    })


    startTransition(async () => {
      const res = product
        ? await updateProduct(product.id, formData)
        : await createProduct({}, formData)

      if (res?.success) {
        toast.success(res.message)
        reset()
        if (onSuccess) onSuccess()
      } else {
        if (res?.success == false) {
          toast.info(
            (res.errors ? Object.values(res.errors).join(', ') : null) ||
            res.message ||
            'Cannot create product'
          );
          console.error(res?.errors)
        }

      }
    })
  }

  return (
    <Card className="max-w-lg w-full mx-auto mt-6 shadow-md border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-semibold">
          {product ? 'Edit Product' : 'Add New Product'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
          {/* Category */}
          <div className="flex flex-col w-full space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            {/* {<Select value={categoryId} onValueChange={setCategoryId}>} */}
            <Select
              value={watch('categoryId')?.toString()}
              onValueChange={(value) => setValue('categoryId', Number(value), { shouldValidate: true })}
            >

              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="flex flex-col w-full space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Laptop - Dell XPS" {...register('title')} />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          {/* SKU / Barcode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col w-full space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" placeholder="Unique stock code" {...register('sku')} />
              {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku.message}</p>}
            </div>
            <div className="flex flex-col w-full space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" placeholder="Optional barcode" {...register('barcode')} />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col w-full space-y-2">
              <Label htmlFor="sellingPrice">Selling Price</Label>
              <Input
                type="number"
                step="0.01"
                id="sellingPrice"
                {...register('sellingPrice', { valueAsNumber: true })}
              />
              {errors.sellingPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.sellingPrice.message}</p>
              )}
            </div>
            <div className="flex flex-col w-full space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input
                type="number"
                step="0.01"
                id="costPrice"
                {...register('costPrice', { valueAsNumber: true })}
              />
              {errors.costPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.costPrice.message}</p>
              )}
            </div>
          </div>

          {/* Stock & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col w-full space-y-2">
              <Label htmlFor="stockQuantity">Stock Quantity (Stock-&gt;Capital)</Label>
              <Input
                type="number"
                id="stockQuantity"
                {...register('stockQuantity', { valueAsNumber: true })}
              />
            </div>
            <div className="flex flex-col w-full space-y-2">
              <Label htmlFor="defaultLocation">Default Location</Label>
              <Input
                id="defaultLocation"
                placeholder="e.g. Warehouse A"
                {...register('defaultLocation')}
              />
            </div>
          </div>

          {/* Reorder & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col w-full space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input
                type="number"
                id="reorderLevel"
                {...register('reorderLevel', { valueAsNumber: true })}
              />
            </div>
            <div className="flex flex-col w-full space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register('description')} placeholder="Optional notes" />
            </div>
          </div>
          {/* Active / Inactive */}
          <div className="flex items-center space-x-3">
            <Label htmlFor="isActive" className="font-medium">Active</Label>
            <Switch
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(value) => setValue('isActive', value)}
            />
          </div>
          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? product
                  ? 'Updating...'
                  : 'Creating...'
                : product
                  ? 'Update Product'
                  : 'Create Product'}
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
