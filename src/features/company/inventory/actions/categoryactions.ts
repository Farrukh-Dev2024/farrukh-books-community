'use server'

import { prisma } from '../../../../lib/prisma'
import { PrevState } from '@/types/project-types'
import { canManageProducts } from '@/lib/permissions/permissions'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'

/**
 * ✅ Create Category
 */
export async function createCategory(prevState: PrevState, formData: FormData): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'User not logged in', errors: {} }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)
    const userdb = await getAuthUserCompanyOrThrow();    
    if (!userdb || !userdb.companyId)
      return { success: false, message: 'Invalid user or company', errors: {} }

    if (!canManageProducts(userdb, 'create'))
      return { success: false, message: 'Permission denied', errors: {} }

    const name = formData.get('name')?.toString().trim()
    const description = formData.get('description')?.toString().trim() || null

    if (!name) return { success: false, message: 'Category name is required' }

    await prisma.productCategory.create({
      data: {
        name,
        description,
        companyId: userdb.companyId,
      },
    })

    return { success: true, message: 'Category created successfully' }
  } catch (error) {
    console.error('createCategory error: %O', error)
    return { success: false, message: 'Failed to create category' }
  }
}

/**
 * ✅ Get Categories (read-only)
 */
export async function getCategories() {
  'use server'
  // const session = await auth()
  // if (!session?.user) return []

  // const tmpform = new FormData()
  // tmpform.append('email', session.user.email || '')
  // const userdb = await getuser({}, tmpform)
  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return []

    if (!canManageProducts(userdb, 'read')) return []

    return prisma.productCategory.findMany({
      where: {
        companyId: userdb.companyId,
        isDeleted: false,
      },
      orderBy: { name: 'asc' },
    })    
  } catch (error) {
    console.log("Error betCategories %O",error)
    return []
  }

}

/**
 * ✅ Update Category
 */
export async function updateCategory(prevState: PrevState, formData: FormData): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'User not logged in', errors: {} }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb || !userdb.companyId)
      return { success: false, message: 'Invalid user or company', errors: {} }

    if (!canManageProducts(userdb, 'update'))
      return { success: false, message: 'Permission denied', errors: {} }

    const id = Number(formData.get('id'))
    const name = formData.get('name')?.toString().trim()
    const description = formData.get('description')?.toString().trim() || null

    if (!id || !name)
      return { success: false, message: 'Invalid category data', errors: {} }

    await prisma.productCategory.update({
      where: { id, companyId: userdb.companyId },
      data: { name, description },
    })

    return { success: true, message: 'Category updated successfully' }
  } catch (error) {
    console.error('updateCategory error:  %O', error)
    return { success: false, message: 'Failed to update category' }
  }
}

/**
 * ✅ Soft Delete Category
 */
export async function deleteCategory(categoryId: number): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'User not logged in', errors: {} }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb || !userdb.companyId)
      return { success: false, message: 'Invalid user or company', errors: {} }

    if (!canManageProducts(userdb, 'delete'))
      return { success: false, message: 'Permission denied', errors: {} }

    await prisma.productCategory.updateMany({
      where: { id: categoryId, companyId: userdb.companyId },
      data: { isDeleted: true },
    })

    return { success: true, message: 'Category deleted successfully' }
  } catch (error) {
    console.error('deleteCategory error: %O', error)
    return { success: false, message: 'Failed to delete category' }
  }
}
