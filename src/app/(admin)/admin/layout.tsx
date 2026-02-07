import type { ReactNode } from 'react'
// import { auth } from '@/lib/auth'
// import { BASE_PATH, UserRoles } from '@/types/project-types'
// import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // const session = await auth()

  // if (!session?.user) redirect(BASE_PATH + '/login')

  // if (session.user.role === UserRoles.USER) {
  //   redirect('/unauthorized')
  // }

  return children
}
