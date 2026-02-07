// src/features/auth/actions/login.ts
'use server'

import { prisma } from '../../../lib/prisma'
import { z } from 'zod'
import { AuthError } from 'next-auth'
import { InvalidLoginError } from '@/lib/errors'
import { signIn } from '@/lib/auth'

import { createUser,getUser, updateUser,comparePassword } from '@/lib/dbfunctions';
import { auth } from '@/lib/auth';
import { CompanyRoles, UserRoles } from '@/types/project-types'
import { redirect } from 'next/navigation'
import { inertia } from 'motion/react'
import { emit } from 'process'

const LoginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
})

export async function loginAction(prevState: PrevState, formData: FormData ) {
  'use server'
	const raw = Object.fromEntries(formData.entries())
	const result = LoginSchema.safeParse(raw)

	if (!result.success) {
		return { fieldErrors: result.error.flatten().fieldErrors };
	}

	const { email, password } = result.data

	// const user = await prisma.user.findUnique({ where: { email } })
	// if (!user || !user.password) {
	// 	return { error: 'User not found' }
	// }

	// const isValid = await bcrypt.compare(password, user.password)
	// if (!isValid) {
	// 	return { error: 'Incorrect password' }
	// }

  // NOTE: You can either redirect OR return status — here we use status
	try {
		const result1 = await signIn('credentials', {
			email,
			password,
			redirect: false,
			callbackUrl: '/', 
		})
		
	} catch (err) {
		if (err instanceof InvalidLoginError) {
			return { error: err.code  }
		}else{
			if (err instanceof Error){
				if (err.message == "NEXT_REDIRECT"){
					//ignore that fake redirect error
          //redirect('/')
          //return { success: true }
				}else{
					return { error: err.message }
				}
			}else{
        //redirect('/')
				return { error: 'Unexpected login error' }
			}
			
		}
		
	}
	return { success: true }
}

export async function createuser(prevState: PrevState, formData: FormData ){
    'use server'
    try {
        const session = await auth();
        const inEmail = formData.get("email")?.toString();
        if (!session || !session.user) { return { error: 'User not authenticated' };}
        if (session.user.email !== inEmail || !inEmail || inEmail=='') {return { error: 'Email does not match session user' };}
            
        // Check if user already exists
        const existingUser = await getUser({ email: inEmail });
        if (existingUser) {
            return { error: 'User already exists' };
        }
        // Create a new user with a default password
        const newuser = await createUser(inEmail, "123456789"); // Default password, consider changing this
        if (newuser){
            newuser.messages = "We have created a password for you which is '123456789'. Kindly change it to your own password.;";
			newuser.password = ''; // 
            updateUser(newuser.id,{ ...newuser });

        }
        if (!newuser) {
            return { error: 'Failed to create user' };
        }
        return { success: true }
    } catch (err) {
		if (err instanceof Error) {
			return { error: "" }
		}

    	return { error: 'Unexpected login error' }
    }
};
export async function clearusermessages(prevState: PrevState, formData: FormData ){
    'use server'
    try {
        const session = await auth();
        const inEmail = formData.get("email")?.toString();
        if (!session || !session.user) { return { error: 'User not authenticated' };}
        if (session.user.email !== inEmail || !inEmail || inEmail=='') {return { error: 'Email does not match session user' };}
            
        // Check if user already exists
        const existingUser = await getUser({ email: inEmail });
        if (existingUser) {
            //return { error: 'User already exists' };
           await prisma.user.update({
                where: { email: inEmail },
                data: { messages: "" }
            });
        }

        return { success: true }
    } catch (err) {
		if (err instanceof Error) {
			return { error: "" }
		}

    	return { error: 'Unexpected login error' }
    }
};

// Read/Get User by email or ID
export async function getuser(prevState: PrevState, formData: FormData ) {
	'use server'
	try {
        const session = await auth();
        if (!session || !session.user) { return null;}
        if (session.user.email !== formData.get("email")) {return null;}
        //console.log("tmpuser code execution check");
        const user = await prisma.user.findFirst({where: { email: formData.get("email")?.toString() },include: { company: true }}); 
		    return user ? { ...user, password: '' } : null; // Exclude password from the returned user object

	}catch (error) {
		console.error("Error fetching user:", error);
		if (error instanceof Error) {
			return null;
		}
	}
	return null;


}

// Validation schema
const schema = z.object({
    name: z.string().min(4, 'Name is required').regex(/^[a-zA-Z0-9 .!#$%&'*+/=?^_`{|}~-]+$/, 'Invalid name'),
    email: z.string().min(4, 'Email is required').email('Invalid email address'),
    currentPassword: z.string().min(6, 'Minimum password length is 6').max(20,'Maximum password length is 20').optional(),
    newPassword: z.string().min(6, 'Minimum password length is 6').max(20,'Maximum password length is 20').optional(),
    confirmPassword: z.string().min(6, 'Minimum password length is 6').max(20,'Maximum password length is 20').optional(),
})
.refine((data) => {
// If current password is provided, validate password logic
if (data.currentPassword ) {
        console.log("data.currentPassword %o",data.currentPassword);
    return (
        data.newPassword &&
        data.newPassword.length >= 6 &&
        data.newPassword === data.confirmPassword
    );
}
return true; // Skip validation if currentPassword is not entered
}, {
    path: ['confirmPassword'],
    message: 'New passwords must match and be at least 6 characters.',
});
type PrevState = {
    success?: boolean;
    error?: boolean;
    messages?: string;
    zerrors?: Record<string, string>;
};
export async function updateUserProfile(prevState: PrevState, formData: FormData): Promise<{ success?: boolean; error?: boolean; messages?: string; zerrors?: Record<string, string>; }> {

  'use server'
  console.log("prevState %o",prevState);
  console.log("formData %o",formData);

  // Convert FormData to a plain object
  const formObj: Record<string, string> = {};
  formData.forEach((value, key) => {
    formObj[key] = value.toString();
  });
  if (formObj.currentPassword === "") {
    delete formObj.currentPassword;
    delete formObj.newPassword;
    delete formObj.confirmPassword;
  }
  // Validate the form data using the schema
  const result = schema.safeParse(formObj);
  if (!result.success) {
    return { error: true, messages: "Error in data" , zerrors: result.error.flatten().fieldErrors as Record<string, string> }; // Return validation errors
  }

  // Simulate updating the user profile (e.g., saving to a database)
  try {
    // Example of updating the user profile in a database (pseudo code)
    // await updateUserInDatabase(formObj);
    const session = await auth();
    const userdb = await getUser({ email: session?.user?.email as string });

    if (!userdb) {
      return {error: true, messages: "An error occured while updating profile" , zerrors: { } };
    } else{
      if (formObj.currentPassword && formObj.newPassword === formObj.confirmPassword) {
        const isPasswordValid = await comparePassword(formObj.currentPassword, userdb.password);
        if (!isPasswordValid) {
          console.log("Password is not valid");
          return { error: true,  zerrors: {currentPassword: "Incorrect password" } };
        } else {
          await updateUser(userdb.id, {...userdb,name:formObj.name, password: formObj.newPassword });
          return { success: true };
        }
      }else{
        await updateUser(userdb.id, {...userdb,name:formObj.name });
      }
      await updateUser(userdb.id, { ...userdb,name: formObj.name });
      console.log('Profile updated successfully', formObj);
      return { success: true };

    }
  } catch (error) {
    console.error("Error updating profile: ", error);
    return {error: true, messages: "An error occured while updating profile"  };
  }
  return { success: true };
}