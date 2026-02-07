export const dynamic = "force-dynamic";

import * as React from 'react';
import { auth } from '@/lib/auth'
import { BASE_PATH, UserRoles } from '@/types/project-types'
import { redirect } from 'next/navigation'
import MainFrame from '@/features/mainpage/MainFrame';
import AdminDashboard from '@/features/admindashboard/components/AdminDashboard';
import { getuser } from '@/features/auth/actions/authactions';

export default async function Home() {
  'use server';
  const session = await auth()
  if (!session?.user) {redirect(BASE_PATH + '')}


  let userdb = undefined;
  if (session?.user) {
    const tmpform = new FormData(); tmpform.append("email", session?.user?.email || "");
    userdb = await getuser({}, tmpform);
  }
  
  if (!userdb) {redirect(BASE_PATH + '')}
  if (userdb?.userRole === UserRoles.User) {redirect(BASE_PATH + '')}
  if (userdb?.userRole !== UserRoles.Admin && userdb?.userRole !== UserRoles.SuperAdmin) {redirect(BASE_PATH + '')}
  return (
    <MainFrame className='w-[98%] mx-auto ml-2 mt-2 min-w-100'>
      <React.Suspense fallback={<div>Loading Admin Dashboard...</div>}>
        {/* <MainPage /> */}
        <AdminDashboard />
      </React.Suspense>      
    </MainFrame>

  )
}