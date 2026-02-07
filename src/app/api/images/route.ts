import { prisma } from '../../../lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUser } from '@/lib/dbfunctions'
import { UserRoles } from '@/types/project-types'

const isImage = (buffer: Buffer) => {
  const hex = buffer.toString('hex', 0, 4);
  return (
    hex === '89504e47' || // PNG
    hex === 'ffd8ffe0' || // JPG
    hex === 'ffd8ffe1' || // JPG
    hex === '47494638'    // GIF
  );
};

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    let userdb = null;
    userdb = await getUser({email: session?.user?.email as string  })    
    if (!userdb || typeof userdb.id !== 'number') {
        return NextResponse.json({ error: 'User not found or invalid user id' }, { status: 400 });
    }

    // Define 'today' as the current date at midnight
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    //reset logic
    if (!userdb.lastImageUploadDate || new Date(userdb.lastImageUploadDate) < today) {
        await prisma.user.update({
            where: { id: userdb.id },
            data: {
                imageUploadCount: 0,
                lastImageUploadDate: now,
            },
        });
        userdb.imageUploadCount = 0;
    }
    
    const data = await req.formData()
    const file = data.get('file') as File
    if (!file || file.size > 1024 * 200) {
        return NextResponse.json({ error: 'File must be under 100kb' }, { status: 400 })
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    
    if (!buffer || buffer.length === 0) {
        return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }
    if (!file.type.startsWith('image/') || !isImage(buffer)) {
        return NextResponse.json({ error: 'File must be an jpg image' }, { status: 400 })
    }

    // daily limit logic implementation
    if (userdb.imageUploadCount >= 10 && userdb.userRole <= UserRoles.User) {
        return NextResponse.json({ error: 'Daily upload limit of 10 images reached' }, { status: 429 });
    }    
    const saved = await prisma.image.create({
        data: {
            userId: userdb.id,
            size: file.size,
            data: buffer,
        },
    })

    // Increment the user's image upload count
    await prisma.user.update({
    where: { id: userdb.id },
        data: {
            imageUploadCount: { increment: 1 },
            lastImageUploadDate: now,
        },
    });    
    return NextResponse.json({ message: 'Image uploaded', id: saved.id })
}
export async function GET() {
    const session = await auth()
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const images = await prisma.image.findMany({
        select: { id: true, userId: true, size: true,createdAt: true ,updatedAt: true},
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(images)
}
