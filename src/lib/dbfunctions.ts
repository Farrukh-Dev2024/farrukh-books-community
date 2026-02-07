'use server'
import { prisma } from "./prisma"
import { compare,hash } from "bcryptjs"
import { z } from 'zod';

import { auth } from "@/lib/auth"
import { CompanyRoles,UserRoles} from "@/types/project-types";


if (!process.env.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not defined in the environment variables.");
}

// Create User
export async function createUser(email: string, password: string) {
    'use server'
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        throw new Error("User already exists")
    }

    const hashedPassword = await hash(password+process.env.NEXTAUTH_SECRET, 10)

    return await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: email.split('@')[0], // Default name is the email
            companyRole: CompanyRoles.FullAccess,
            userRole: UserRoles.User, // Default user role
            isBanned: false,
            isDeleted: false,
        },
    })
}

// Read/Get User by email or ID
export async function getUser(identifier: { email?: string }) {
    'use server'
    if (!identifier.email) {
        return null;
    }
    return await prisma.user.findFirst({
        where: { email: identifier.email },
    })
}

// Update User
export async function updateUser(
    id: number,
    data: {
            email: string,
            password?: string,
            name: string | null, // Default name is the email
            companyRole: number,
            userRole: number, // Default user role
            isBanned: boolean,
            isDeleted: boolean,
    }
) {
    'use server'
    const updatedData = { ...data }

    if (data.password && data.password.length > 0) {
        updatedData.password = await hash(data.password+process.env.NEXTAUTH_SECRET, 10)
    }else{
        delete updatedData.password;
    }
    

    return await prisma.user.update({
        where: { id },
        data: updatedData,
    })
}

// Delete User
export async function deleteUser(id: number) {
    'use server'
    return await prisma.user.delete({
        where: { id },
    });
}

// compair password
export async function comparePassword(
    password: string,
    hashedPassword: string
) {
    'use server'
    return await compare(password+process.env.NEXTAUTH_SECRET, hashedPassword);
}

//get messages
export async function getMessages(id: number) {
    'use server'
    const user = await prisma.user.findUnique({
        where: { id },
        select: { messages: true },
    })
    return user?.messages;
}



