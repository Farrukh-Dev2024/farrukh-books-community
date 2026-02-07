'use client'
import * as React from 'react'
import { useTransition, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createCategory, updateCategory } from '../actions/categoryactions'
import { ProductCategory } from '@/types/prisma-types'

export default function CategoryForm({
  existingCategory,
  onSaved,
}: {
  existingCategory?: ProductCategory
  onSaved?: () => void
}) {

  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(existingCategory?.name || '')
  const [description, setDescription] = useState(existingCategory?.description || '')

  React.useEffect(() => {
    if (existingCategory) {
      setName(existingCategory.name)
      setDescription(existingCategory.description || '')
    }
  }, [existingCategory])
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    if (existingCategory) formData.append('id', existingCategory.id.toString())
    formData.append('name', name)
    formData.append('description', description)

    startTransition(async () => {
      const res = existingCategory
        ? await updateCategory({ success: false, message: '' }, formData)
        : await createCategory({ success: false, message: '' }, formData)
      //alert(res.message)
      if (res.success) {
        onSaved?.()
      }
    })
  }

  return (
    <Card className="max-w-3xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>{existingCategory ? 'Edit Category' : 'Add Category'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button type="submit" disabled={isPending} className="w-[50%] ml-auto block">
            {isPending ? 'Saving...' : existingCategory ? 'Update' : 'Create'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
