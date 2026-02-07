//companyactions.ts
'use server'
import { getuser } from '@/features/auth/actions/authactions'
import { auth } from '@/lib/auth'
import { prisma } from '../../../../lib/prisma'
import { CompanyRoles, PrevState, UserRoles } from '@/types/project-types'
import { escapeHtml } from '@/lib/htmlfunctions';
import { string, z } from "zod";
import { addDefaultAccounts } from '@/features/company/accounts/actions/accountsactions'
import { getAuthUserCompanyOrThrow, getAuthUserOrThrow } from '@/lib/permissions/helperfunctions'
import { autoAssignWebsiteFreePlan } from '@/features/subscription/user/actions/upgrade-request-actions'
import { assertCanInviteUser } from '@/features/subscription/guards/invite.guards'

const companySchema = z.object({
    title: z
        .string()
        .min(1, "Company name is required")
        .refine(
            (val) => val.trim().split(/\s+/).length <= 50,
            { message: "Company name must be 50 words or fewer" }
        )
        .refine(
            (val) => /^[a-zA-Z0-9. ]+$/.test(val),
            { message: "Company name can only contain letters, numbers, spaces, and dots" }
        ),

    description: z
        .string()
        .min(1, "Description is required")
        .max(10000, "Too long, max 10000 chars"), // Just to prevent excessive input

    avatarUrl: z
        .string()
        .refine(
            (val) =>
                val === '' ||
                z.string().url().safeParse(val).success ||
                val.startsWith('/'),
            { message: "Avatar URL must be empty, a valid URL, or a relative path" }
        ),

    addPrebuiltAccounts: z
        .preprocess(
            (val) => val === "1" || val === 1 || val === true,
            z.boolean()
        ),
    businessType: z
        .number()
        .min(0, "businessType is required")
        .max(9, "businessType is invalid"),
    currencyCode: z
        .string()   
        .min(3, "Currency code is required")
        .max(3, "Currency code must be 3 characters"),
    currencySymbol: z
        .string()
        .min(1, "Currency symbol is required")
        .max(5, "Currency symbol must be 5 characters or fewer"),
    currencyName: z
        .string()
        .min(1, "Currency name is required")
        .max(50, "Currency name must be 50 characters or fewer"),
});

export async function createcompany(prevState: PrevState, formData: FormData) {
    'use server'
    console.log("createcompany formData %o", formData);
    console.log("createcompany prevState %o", prevState);

    try {
        const userdb = await getAuthUserOrThrow();
        if (!userdb) { return { success: false, message: "database user not found,", errors: {} }; }
        if (userdb.companyId != null) { return { success: false, message: "Already has company,", errors: {} }; }

        const input = {
            title: formData.get("title"),
            description: formData.get("description"),
            avatarUrl: formData.get("avatarUrl"),
            addPrebuiltAccounts: formData.get("addPrebuiltAccounts"),
            businessType: Number(formData.get("businessType")),
            currencyCode: formData.get("currencyCode"),
            currencySymbol: formData.get("currencySymbol"),
            currencyName: formData.get("currencyName"),
        }

        const result = companySchema.safeParse(input)

        if (!result.success) {
            return {
                success: false,
                errors: result.error.flatten().fieldErrors,
            }
        }

        const { title, description, avatarUrl, addPrebuiltAccounts,businessType, currencyCode, currencySymbol, currencyName } = result.data
        const sanitizedDescription = await escapeHtml(description);
        const mycompany = await prisma.company.create({
            data: {
                title: title,
                ownerId: userdb.id,
                description: sanitizedDescription,
                avatarUrl,
                businessType,
                isDeleted: false,
                currencyCode,
                currencySymbol,
                currencyName,
            }
        })
        await prisma.user.update({
            where: { id: userdb.id },
            data: { companyId: mycompany.id, companyRole: CompanyRoles.FullAccess }
        })

        if (addPrebuiltAccounts) {
            addDefaultAccounts(mycompany.id)
        }

        /** create company subscription */
        await autoAssignWebsiteFreePlan(mycompany.id);

        return { success: true, message: "Company created successfully" }

    } catch (error) {
        console.error("Error creating company: %O", error);
        if (error instanceof Error) {
            return { success: false, message: error.message, errors: {} }
        }
    }
    return null;
}

export async function getcompany() {
    'use server'
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.email) {
            return { success: false, message: "User not logged in.", errors: {} };
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email, isDeleted: false },
            include: { company: true }
        });

        if (!user || !user.company) {
            return { success: false, message: "User or Company not found.", errors: {} };
        }

        return {
            success: true,
            title: user.company.title,
            description: user.company.description,
            avatarUrl: user.company.avatarUrl,
            createdAt: user.company.createdAt,
            updatedAt: user.company.updatedAt,
            businessType: user.company.businessType
        };

    } catch (error) {
        console.error("Error fetching company:", error);
        return null;
    }
}

export async function modifycompany(prevState: PrevState, formData: FormData) {
    'use server'

    try {
        const userdb = await getAuthUserCompanyOrThrow();
        if (!userdb) { return { success: false, message: "database user not found,", errors: {} }; }
        if (userdb.companyId == null) { return { success: false, message: "User does not have any company cannot modify,", errors: {} }; }
        if (userdb.companyRole !== CompanyRoles.FullAccess) { return { success: false, message: "User does not have permission to modify company,", errors: {} }; }

        const input = {
            title: formData.get("title"),
            description: formData.get("description"),
            avatarUrl: formData.get("avatarUrl"),
            currencyCode: formData.get("currencyCode"),
            currencySymbol: formData.get("currencySymbol"),
            currencyName: formData.get("currencyName"),
            businessType: Number(formData.get("businessType"))
        }

        const result = companySchema.safeParse(input)

        if (!result.success) {
            return {
                success: false,
                errors: result.error.flatten().fieldErrors,
            }
        }

        const { title, description, avatarUrl,currencyCode,currencyName,currencySymbol,businessType } = result.data
        const sanitizedDescription = await escapeHtml(description);
        await prisma.company.update({
            where: { id: userdb.companyId },
            data: { title, description: sanitizedDescription, avatarUrl,currencyCode,currencyName,currencySymbol,businessType }
        })

        return { success: true, message: "Company modified successfully" }

    } catch (error) {
        console.error("Error modifying company: %O", error);
        if (error instanceof Error) {
            return { success: false, message: error.message, errors: {} }
        }
    }
    return null;
}

export async function leavecompany() {
    'use server';
    try {
        const userdb = await getAuthUserCompanyOrThrow();

        if (!userdb) {
            return { success: false, message: "Database user not found", errors: {} };
        }
        if (!userdb.companyId) {
            return { success: false, message: "User is not part of any company", errors: {} };
        }

        const companydb = await prisma.company.findUnique({
            where: { id: userdb.companyId },
        });
        if (!companydb) {
            return { success: false, message: "Company not found", errors: {} };
        }
        if (companydb.ownerId == userdb.id) { return { success: false, message: "You are the original founder , cannot leave company.", errors: {} }; }

        await prisma.user.update({
            where: { id: userdb.id },
            data: { companyId: null },
        });

        return { success: true, message: "You have successfully left the company", errors: {} };

    } catch (error) {
        console.error("Error leaving company: %O", error);
        return { success: false, message: error instanceof Error ? error.message : "Unknown error", errors: {} };
    }
}

export async function deletecompany() {
    'use server'
    try {
        // const session = await auth();
        // if (!session || !session.user) { return { success: false, message: "User not logged in,", errors: {} } }

        // const tmpform = new FormData(); tmpform.append("email", session?.user?.email || "");
        // const userdb = await getuser({}, tmpform);
        const userdb = await getAuthUserCompanyOrThrow();        
        if (!userdb) { return { success: false, message: "database user not found,", errors: {} }; }
        if (userdb.companyId == null) { return { success: false, message: "User does not have any company cannot delete,", errors: {} }; }
        if (userdb.companyRole < CompanyRoles.FullAccess) { return { success: false, message: "User does not have permission to modify company,", errors: {} }; }

        // const result = await prisma.company.delete({
        //     where: { id: userdb.companyId },
        // })
        const result = await prisma.company.update({
            where: { id: userdb.companyId },
            data: { isDeleted: true }
        })
        await prisma.user.update({
            where: { id: userdb.id },
            data: { companyId: null }
        })
        const res = await prisma.user.updateMany({
            where: { companyId: userdb.companyId },
            data: { companyId: null }
        })

        if (!result) {
            return { success: false, message: "Company not found or already deleted", errors: {} }
        }
        return { success: true, message: "Company deleted successfully" }

    } catch (error) {
        console.error("Error deleting company: %O", error);
        if (error instanceof Error) {
            return { success: false, message: error.message, errors: {} }
        }
    }
    return null;
}

export async function deletecompanyinvite(prevState: PrevState, formData: FormData) {
    try {
        const session = await auth();
        if (!session || !session.user?.email) {
            return { success: false, message: "User not logged in", errors: {} };
        }

        const inviteId = Number(formData.get("id"));
        if (!inviteId) {
            return { success: false, message: "Invalid invite id", errors: {} };
        }

        const invite = await prisma.companyInvite.findUnique({
            where: { id: inviteId },
            include: { company: true }
        });

        if (!invite) {
            return { success: false, message: "Invite not found", errors: {} };
        }

        const companyUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { companyId: true }
        });

        if (!companyUser?.companyId || companyUser.companyId !== invite.companyId) {
            return { success: false, message: "Unauthorized to delete this invite", errors: {} };
        }

        if (invite.isDeleted || invite.isAccepted || invite.isRejected) {
            return { success: false, message: "Invite already processed", errors: {} };
        }

        await prisma.companyInvite.update({
            where: { id: inviteId },
            data: { isDeleted: true }
        });

        return { success: true, message: "Invite deleted successfully" };
    } catch (error) {
        console.error("Error deleting company invite:", error);
        return { success: false, message: error instanceof Error ? error.message : "Unknown error", errors: {} };
    }
}

export async function getuseroutgoinginvites() {
    'use server'
    try {
        // const session = await auth();
        // if (!session || !session.user) {
        //     return { success: false, message: "User not logged in.", errors: {} };
        // }

        // const tmpform = new FormData();
        // tmpform.append("email", session?.user?.email || "");
        // const userdb = await getuser({}, tmpform);
        const userdb = await getAuthUserCompanyOrThrow();
        if (!userdb) {
            return { success: false, message: "Database user not found.", errors: {} };
        }
        if (!userdb.companyId) {
            return { success: false, message: "User has no company, cannot check outgoing invites.", errors: {} };
        }

        const companyInvites = await prisma.companyInvite.findMany({
            where: {
                companyId: userdb.companyId,
                isDeleted: false,
                isAccepted: false,
                isRejected: false,
            },
            include: { company: true },
            orderBy: { createdAt: "desc" },
        });

        if (!companyInvites || companyInvites.length === 0) {
            return { success: false, message: "No outgoing invites found.", errors: {} };
        } else {
            return { success: true, invites: companyInvites };
        }
    } catch (error) {
        console.error("Error getting outgoing invites: %O", error);
        return { success: false, message: error instanceof Error ? error.message : "Unknown error", errors: {} };
    }
}

export async function getuserincominginvites() {
    'use server'
    try {
    const userdb = await getAuthUserCompanyOrThrow();
        if (!userdb) { return { success: false, message: "database user not found,", errors: {} }; }
        if (userdb.companyId !== null) { return { success: false, message: "Cannot get invites, User already has a company,", errors: {} }; }

        const userinvites = await prisma.companyInvite.findFirst({
            where: { email: userdb.email, isDeleted: false, isAccepted: false, isRejected: false },
            include: { company: true }
        });
        if (!userinvites) {
            return { success: false, message: "No incoming invites found %O", errors: {} };
        } else {
            return { success: true, invites: userinvites };
        }

    } catch (error) {
        console.error("Error getting incoming invites:", error);
        return { success: false, message: error instanceof Error ? error.message : "Unknown error", errors: {} }
    }
}

export async function sendcompanyinvite(prevState: PrevState, formData: FormData) {
    'use server'
    try {
        const userdb = await getAuthUserCompanyOrThrow();
        if (!userdb) { return { success: false, message: "database user not found,", errors: {} }; }
        if (userdb.companyId === null) { return { success: false, message: "You do not have a company cannot send invites,", errors: {} }; }
        if ((userdb.companyRole < CompanyRoles.FullAccess)) {
            //if (userdb.userRole < UserRoles.Admin) {
                return { success: false, message: "You do not have permission to send invites,", errors: {} };
            //}
        }
        await assertCanInviteUser(userdb.companyId);    //guard invites based on subscriptions
        
        const input = {
            email: formData.get("email"),
            title: formData.get("title"),
            description: formData.get("description"),
            role: Number(formData.get("role")),
        }

        const result = z.object({
            email: z.string().email("Invalid email address").min(1, "Email is required"),
            title: z.string().max(300, "Message must be 300 characters or fewer"),
            description: z.string().max(3000, "Description must be 3000 characters or fewer"),
            role: z.number().int().min(0, "Role must be a valid number").max(99, "Role must be a valid number"),
        }).safeParse(input)

        if (!result.success) {
            return { success: false, errors: result.error.flatten().fieldErrors }
        }

        const { email, title, description, role } = result.data
        const newdescription = await escapeHtml(description);

        const tmpform2 = new FormData(); tmpform2.append("email", email || "");
        const userdbin = await getuser({}, tmpform2);
        if (userdbin && userdbin.companyId !== null) {
            return { success: false, message: "User already has a company cannot send invite", errors: {} };
        }

        const existingInvite = await prisma.companyInvite.findFirst({
            where: { email, companyId: userdb.companyId ?? undefined },
        });

        if (existingInvite) {
            await prisma.companyInvite.delete({ where: { id: existingInvite.id } });
            return { success: false, message: "(Deleted old invite) Invite already exists for this email.", errors: {} };
        }

        if (userdb.companyId !== null) {
            await prisma.companyInvite.create({
                data: {
                    companyId: userdb.companyId,
                    email,
                    title,
                    description: newdescription,
                    role,
                },
            });

            return { success: true, message: "Invite sent successfully" }
        }

    } catch (error) {
        console.error("Error sending company invite: %O", error);
        return { success: false, message: error instanceof Error ? error.message : "Unknown error", errors: {} }
    }
    return { success: false, message: "", errors: {} };
}

export async function processcompanyinvite(prevState: PrevState, formData: FormData) {
    'use server'
    try {
        const userdb = await getAuthUserCompanyOrThrow();
        if (!userdb) { return { success: false, message: "database user not found,", errors: {} }; }
        if (userdb.companyId !== null) { return { success: false, message: "You already have a company, cannot accept invite.", errors: {} }; }

        const input = {
            id: Number(formData.get("id")),   // ✅ FIX: ensure invite ID is always int
            inviteanswer: formData.get("inviteanswer"),
        }

        const result = z.object({
            id: z.number().int().positive("Invalid invite ID"),
            inviteanswer: z.enum(["accept", "reject"]),
        }).safeParse(input)

        if (!result.success) {
            return { success: false, errors: result.error.flatten().fieldErrors }
        }

        const { id, inviteanswer } = result.data

        const invite = await prisma.companyInvite.findUnique({ where: { id } });
        if (!invite) {
            return { success: false, message: "Invite not found", errors: {} };
        }
        if (invite.isDeleted || invite.isAccepted || invite.isRejected) {
            return { success: false, message: "Invite already processed", errors: {} };
        }

        if (inviteanswer === "accept") {
            await prisma.user.update({
                where: { id: userdb.id },
                data: { companyId: invite.companyId, companyRole: invite.role }
            });
            await prisma.companyInvite.update({
                where: { id },
                data: { isAccepted: true }
            });
            return { success: true, message: "Invite accepted successfully" }
        } else {
            await prisma.companyInvite.update({
                where: { id },
                data: { isRejected: true }
            });
            return { success: true, message: "Invite rejected successfully" }
        }

    } catch (error) {
        console.error("Error processing company invite: %O", error);
        return { success: false, message: error instanceof Error ? error.message : "Unknown error", errors: {} }
    }
}

/**
 * Helper: check if user has permission to manage company users
 */
async function canManageCompany(companyId: number, userId: number) {
    'use server'
    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
    })

    if (!dbUser) return false

    // Check global role
    if (dbUser.userRole <= 1) return true // 0=SuperAdmin, 1=Admin

    // Check company role
    const companyUser = dbUser
    if (!companyUser) return false

    return companyUser.companyRole === CompanyRoles.FullAccess
}

/**
 * Get all users of a company
 */
export async function getcompanyusers(companyId: number) {
    'use server'
    try {
        const user = await getAuthUserCompanyOrThrow();
        if (!user) return null

        const hasAccess = await canManageCompany(companyId, user.id)
        if (!hasAccess) return null

        const companyUsers = await prisma.user.findMany({
            where: { companyId },
        })

        return companyUsers
    } catch (error) {
        console.error('Error getting company users:', error)
        return null
    }
}

/**
 * Update a user's company role
 */
export async function updatecompanyuserrole(
    prevState: PrevState,
    formData: FormData
): Promise<PrevState> {
    'use server'
    try {
        const user = await getAuthUserCompanyOrThrow();

        if (!user) return { success: false, message: 'Unauthorized' }

        const targetUserId = Number(formData.get('userId')) || null
        const roleId = Number(formData.get('roleId')) || null
        const companyId = Number(formData.get('companyId')) || null

        if (!targetUserId || !roleId || !companyId) {
            return { success: false, message: 'Invalid input' }
        } else {
            const hasAccess = await canManageCompany(companyId, user.id)
            if (!hasAccess)
                return { success: false, message: 'Access denied' }

            await prisma.user.update({
                where: { id: targetUserId, companyId: companyId },
                data: { companyRole: roleId },
            })

            return { success: true, message: 'Role updated successfully' }
        }


    } catch (error) {
        console.error('Error updating company user role:', error)
        return { success: false, message: 'Error updating user role' }
    }
}

/**
 * Remove a user from the company
 */
export async function removecompanyuser(
    prevState: PrevState,
    formData: FormData
): Promise<PrevState> {
    'use server'
    try {
        const user = await getAuthUserCompanyOrThrow();

        const targetUserId = Number(formData.get('userId')) || null
        const roleId = Number(formData.get('roleId')) || null
        const companyId = user.companyId || null


        if (!targetUserId || !companyId) {
            return { success: false, message: 'Invalid input' }
        }

        const hasAccess = await canManageCompany(companyId, user.id)
        if (!hasAccess)
            return { success: false, message: 'Access denied' }

        await prisma.user.update({
            where: { id: targetUserId, companyId: companyId },
            data: { companyId: null },
        })

        return { success: true, message: 'User removed successfully' }
    } catch (error) {
        console.error('Error removing company user:', error)
        return { success: false, message: 'Error removing user' }
    }
}