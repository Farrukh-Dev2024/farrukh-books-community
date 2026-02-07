'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCategories, deleteCategory } from '../actions/categoryactions'
import CategoryForm from './CategoryForm'
import { ProductCategory } from '@/types/prisma-types'
import { useYesNoDialog } from '@/features/yesnodialog/useYesNoDialog'
import { useAppContext } from '@/context/AppContext';
import { toast } from 'sonner'

export default function CategoryList() {
  const { showYesNoDialog, YesNoDialog } = useYesNoDialog()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)
  const [isPending, startTransition] = useTransition()
  const { appData, setAppData } = useAppContext();


  useEffect(() => {
    startTransition(async () => {
      const cats = await getCategories()
      setCategories(cats)
    })
  }, [])
  const loadCategories = async () => {
    const cats = await getCategories()
    setCategories(cats)
    setAppData((prev)=>({ ...prev, productCategories: cats || null }));
  }
  const handleSaved = async () => {
    setEditingCategory(null)
    startTransition(loadCategories)
  }
  const handleDelete = async (id: number) => {
    const category = categories.find(c => c.id === id)
    const confirmed = await showYesNoDialog({
      title: 'Delete Category',
      content: (
        <div>
          Are you sure you want to delete category
          <b> {category?.name ?? '(Unknown)'} </b>?<br />
          This action{' '}
          <span className="text-red-500 font-semibold">cannot</span> be undone.
        </div>
      ),
    })
    if (!confirmed) return
    const res = await deleteCategory(id)
    toast.error(res.message)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="max-w-3xl mx-auto p-4 mt-6 w-full">
      <Card>
        <CardHeader>
          <CardTitle>Product Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm existingCategory={editingCategory ?? undefined} onSaved={handleSaved} />
          <hr className="my-4" />
          <div className="space-y-2 w-full">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div>
                  <p className="font-medium">{cat.name}</p>
                  {cat.description && (
                    <p className="text-sm text-muted-foreground">
                      {cat.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCategory(cat)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(cat.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <p className="text-center text-muted-foreground">No categories found.</p>}
          </div>
        </CardContent>
        {YesNoDialog}
      </Card>
    </div>
  )
}
