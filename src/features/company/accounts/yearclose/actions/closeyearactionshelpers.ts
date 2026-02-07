//features/company/accounts/yearclose/actions/closeyearactions.ts
'use server'

import {prisma} from '../../../../../lib/prisma'
import { z } from 'zod'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'

/**
 * Check if the given fiscal year is already closed.
 * Returns: { closed: boolean }
 */
export async function checkYearAlreadyClosedAction(formData: FormData) {
  'use server'
  const schema = z.object({
    companyId: z.number(),
    year: z.string()
  })

  const parsed = schema.safeParse({
    companyId: formData.get('companyId'),
    year: formData.get('year')
  })

  if (!parsed.success) return { closed: false }
  const { companyId, year } = parsed.data

  // const session = await auth()
  // if (!session?.user?.email)
  //   return { success: false, message: 'Unauthorized' }

  // const tmp = new FormData()
  // tmp.append('email', session.user.email)
  // const userdb = await getuser({}, tmp)
  const userdb = await getAuthUserCompanyOrThrow();

  if (!userdb?.companyId || userdb.companyId !== companyId)
    return { success: false, message: 'Unauthorized for this company' }  


  const start = new Date(`${year}-01-01`)
  const end = new Date(`${year}-12-31`)

  const exists = await prisma.journal.findFirst({
    where: {
      companyId,
      entryDate: {
        gte: start,
        lte: end
      },
      description: {
        contains: 'Year Closing Entry'
      }
    },
    select: { id: true }
  })

  return { closed: !!exists }
}

/**
 * Get history of all year-ending closing entries.
 */
export async function getYearCloseHistoryAction(formData: FormData) {
  'use server'
  // const session = await auth()
  // if (!session?.user) return []
  // if (!session?.user?.email)
  //   return { success: false, message: 'Unauthorized' }

  // const tmp = new FormData()
  // tmp.append('email', session.user.email)
  // const userdb = await getuser({}, tmp)
  try {
    const userdb = await getAuthUserCompanyOrThrow();
    const companyId = Number(formData.get('companyId'))?? null
    if (!companyId) return [] 
    if (!userdb?.companyId || userdb.companyId !== companyId)
      return { success: false, message: 'Unauthorized for this company' }  
    
    const entries = await prisma.journal.findMany({
      where: {
        companyId,
        description: {
          contains: 'Year End Closing Entry'
        }
      },
      orderBy: { entryDate: 'desc' },
      select: {
        id: true,
        entryDate: true,
        transactionId: true,
        description: true
      }
    })

    return entries.map((e) => {
      const year = new Date(e.entryDate).getFullYear()
      return {
        year,
        closingDate: e.entryDate.toISOString().slice(0, 10),
        transactionId: e.transactionId
      }
    })    
  } catch (error) {
    console.log("Error getYearCloseHistoryAction %O",error)
    return { success: false, message: 'Error getYearCloseHistoryAction' }
  }

}

export async function checkYearAlreadyClosed(companyId: number, year: number) {
  'use server'

  const fd = new FormData()
  fd.set('companyId', String(companyId))
  fd.set('year', String(year))
  return await checkYearAlreadyClosedAction(fd)
}

export async function getYearCloseHistory(companyId: number) {
  'use server'
  const fd = new FormData()
  fd.set('companyId', String(companyId))
  return await getYearCloseHistoryAction(fd)
}