'use server'
import { getuser } from '@/features/auth/actions/authactions'
import { auth } from '@/lib/auth'
import { CompanyRoles } from '@/types/project-types'

export async function assertFullAccess() {
    'use server'
    const session = await auth()
    if (!session?.user) throw new Error('Access denied: FullAccess required')


    let userdb = undefined;
    if (session?.user) {
        const tmpform = new FormData(); tmpform.append("email", session?.user?.email || "");
        userdb = await getuser({}, tmpform);
    }
    if (!userdb) throw new Error('Access denied: FullAccess required')
    if (userdb.companyRole !== CompanyRoles.FullAccess) {
        throw new Error('Access denied: FullAccess required')
    }
    return userdb;
}
