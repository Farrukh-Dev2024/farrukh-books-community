'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { getProducts, updateProduct, deleteProduct } from '../actions/productactions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Product } from '@/types/prisma-types'
import ProductForm from './ProductForm'
import { useYesNoDialog } from '@/features/yesnodialog/useYesNoDialog'
import { useAppContext } from '@/context/AppContext';

export default function ProductList() {
    const { showYesNoDialog, YesNoDialog } = useYesNoDialog()
    const [products, setProducts] = useState<Product[]>([])
    const [isPending, startTransition] = useTransition()
    const [search, setSearch] = useState('')
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const { appData, setAppData } = useAppContext();

    const handleEdit = (p: Product) => setEditingProduct(p)

    const handleDelete = async (p: Product) => {
        try {
            const confirmed = await showYesNoDialog({
                title: 'Delete Product',
                content: (
                    <div>
                        Are you sure you want to delete product
                        <b> {p.title} </b>?<br />
                        This action{' '}
                        <span className="text-red-500 font-semibold">cannot</span> be undone.
                    </div>
                ),
            })

            if (!confirmed) return

            const res = await deleteProduct(p.id)
            if (res.success) {
                toast.success(res.message)
                setProducts((prev) => prev.filter((prod) => prod.id !== p.id))
            } else {
                toast.error(res.message)
            }
        } catch (err) {
            console.error(err)
            toast.error('An error occurred while deleting the product.')
        }
    }

    async function refreshProducts() {
        startTransition(async () => {
            const res = await getProducts()
            if (res) {
                setProducts(res as unknown as Product[]);
                setAppData((prev)=>({ ...prev, products: res}));
            } else {
                setProducts([])
                toast.error('No products found or error fetching products')
            }
        })
    }

    useEffect(() => {
        refreshProducts()
    }, [])

    const filtered = products.filter(
        (p) =>
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <Card className="mt-6 max-w-5xl mx-auto w-full">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center justify-between w-full md:w-auto gap-2">
                    <CardTitle>Product List</CardTitle>

                </div>

                <Input
                    placeholder="Search by name, SKU, or barcode..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-64"
                />
                <Button
                    className="ml-auto"
                    onClick={() => setIsAdding(true)}
                >
                    + Add Product
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
                    <p className="text-center text-gray-500 py-4">No products found</p>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="min-w-full border border-gray-200 text-sm w-full">
                            <thead className="bg-gray-50 text-gray-700 hidden md:table-header-group">
                                <tr>
                                    <th className="px-4 py-2 border">ID</th>
                                    <th className="px-4 py-2 border">Title</th>
                                    <th className="px-4 py-2 border">SKU</th>
                                    <th className="px-4 py-2 border">Category</th>
                                    <th className="px-4 py-2 border">Selling Price</th>
                                    <th className="px-4 py-2 border">Cost Price</th>
                                    <th className="px-4 py-2 border">Stock</th>
                                    <th className="px-4 py-2 border">Barcode</th>
                                    <th className="px-4 py-2 border">Status</th>
                                    <th className="px-4 py-2 border">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="block md:table-row-group w-full">
                                {filtered.map((p) => (
                                    <tr key={p.id} className="block md:table-row mb-4 border p-4 md:p-0 w-full">
                                        <td className="block md:table-cell px-4 py-1 text-center">
                                            <span className="font-medium md:hidden">ID: </span>
                                            {p.id}
                                        </td>
                                        <td className="block md:table-cell px-4 py-1 text-center">
                                            <span className="font-medium md:hidden">Title: </span>
                                            {p.title}
                                        </td>
                                        <td className="block md:table-cell px-4 py-1 text-center">
                                            <span className="font-medium md:hidden">SKU: </span>
                                            {p.sku}
                                        </td>
                                        <td className="block md:table-cell px-4 py-1 text-center">
                                            <span className="font-medium md:hidden">Category: </span>
                                            {p.category?.name ?? '—'}
                                        </td>
                                        <td className="block md:table-cell px-4 py-1 text-center">
                                            <span className="font-medium md:hidden">Selling Price: </span>
                                            {p.sellingPrice.toFixed(2)}
                                        </td>
                                        <td className="block md:table-cell px-4 py-1 text-center">
                                            <span className="font-medium md:hidden">Cost Price: </span>
                                            {p.costPrice.toFixed(2)}
                                        </td>
                                        <td className="block md:table-cell px-4 py-1 text-center">
                                            <span className="font-medium md:hidden">Stock: </span>
                                            {p.stockQuantity}
                                        </td>
                                        <td className="block md:table-cell px-4 py-1 text-center">
                                            <span className="font-medium md:hidden">Barcode: </span>
                                            {p.barcode || '-'}
                                        </td>
                                        <td className="block md:table-cell px-4 py-1 text-center">
                                            <span className="font-medium md:hidden">Status: </span>
                                            {p.isActive ? (
                                                <span className="text-green-600 font-medium">Active</span>
                                            ) : (
                                                <span className="text-gray-500">Inactive</span>
                                            )}
                                        </td>
                                        <td className="block md:table-cell px-4 py-1 text-center ">
                                            <div className="flex gap-2 justify-center flex-wrap">
                                                <Button size="sm" className="w-20" variant="outline" onClick={() => handleEdit(p)}>
                                                    Edit
                                                </Button>
                                                <Button size="sm" className="w-20" variant="destructive" onClick={() => handleDelete(p)}>
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

            {(isAdding || editingProduct) && (
                <div className="fixed inset-0 bg-background bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
                    <div className="p-6 rounded-lg w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">
                            {editingProduct ? 'Edit Product' : 'Add Product'}
                        </h2>

                        <ProductForm
                            product={editingProduct || undefined}
                            onSuccess={async () => {
                                toast.success(editingProduct ? 'Product updated' : 'Product added')
                                setEditingProduct(null)
                                setIsAdding(false)
                                await refreshProducts()
                            }}
                            onCancel={() => {
                                setEditingProduct(null)
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

