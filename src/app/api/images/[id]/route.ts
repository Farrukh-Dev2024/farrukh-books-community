import { prisma } from '../../../../lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUser } from '@/lib/dbfunctions'
import { UserRoles } from '@/types/project-types';


export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }>} ) {
    const session = await auth();
    const mparams = await params;
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const image = await prisma.image.findUnique({ where: { id: String(mparams.id) } })
    if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return new NextResponse(Buffer.from(image.data), {
        headers: {
            'Content-Type': 'image/jpeg',
            'Content-Disposition': `inline; filename="${image.id}.jpg"`,
        },
    })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const mparams = await params;
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const image = await prisma.image.findUnique({ where: { id: String(mparams.id) } })
    const userdb = await getUser({ email: session?.user.email ?? undefined });
    
    if (image?.userId === userdb?.id || userdb?.userRole === UserRoles.Admin || userdb?.userRole === UserRoles.SuperAdmin) {
        await prisma.image.delete({ where: { id: String(mparams.id) } })
        return NextResponse.json({ message: 'Deleted' })
    }else{
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })        
    }

}


// export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
//     const data = await req.formData()
//     const file = data.get('file') as File
//     if (!file || file.size > 1024 * 200) {
//         return NextResponse.json({ error: 'File must be under 1MB' }, { status: 400 })
//     }
//     const buffer = Buffer.from(await file.arrayBuffer())
//     const updated = await prisma.image.update({
//         where: { id: params.id },
//         data: {
//             name: file.name,
//             type: file.type,
//             size: file.size,
//             data: buffer,
//         },
//     })
//     return NextResponse.json({ message: 'Updated', id: updated.id })
// }
