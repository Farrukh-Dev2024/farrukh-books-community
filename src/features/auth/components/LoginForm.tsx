'use client'

import * as React from 'react'

import { signIn, SignInOptions, SignInResponse, useSession } from "next-auth/react";
import { loginAction } from '@/features/auth/actions/authactions'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { MailIcon, LockIcon, ShieldCheckIcon } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { motion } from 'motion/react'
import { useState } from 'react'
import Link from 'next/link'
import {  redirect, useRouter,useSearchParams } from 'next/navigation';

export default function LoginForm() {
    const session = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formError, setFormError] = useState('')
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string[] }>({})
    const [error, setError] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const errorcode = searchParams.get('code') || null
    
    React.useEffect(() => {
        setError(errorcode);
    }, [errorcode]);  
    React.useEffect(() => {
      //if (session){redirect("/");}
    }, [session]);  // Effect runs only when `session` changes

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setFormError('')
        setFieldErrors({})

        const res = await loginAction({},formData)

        if (res?.fieldErrors) {
            setFieldErrors(res.fieldErrors)
        } else if (res?.error) {
            setFormError(res.error)
        } else {
            toast.success('Login successful!')
            //router.push('/') // Redirect to home page after successful login
            //setTimeout(() => {router.push('/');}, 1000); 
            setTimeout(() => {window.location.reload();}, 500); 
        }

        setLoading(false)
    }

    const handleGoogleLogin = async () => {
        // Replace with actual Google login logic
        toast.info('Redirecting to Google login...')
        const result = await signIn("google");
        // if (result?.code ){ 
        //     setFormError(result.code);
        //     toast.error(result.error);
        //     //console.log("%o",result);
        // }else{
        //     router.push("/");
        // }

    }
    return (
        <motion.div
            className="w-full py-1 mx-auto min-w-xs max-w-lg mt-2"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
        >
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex flex-col items-center gap-2 text-center">
                        <ShieldCheckIcon className="w-48 h-48" />
                        <p>Login</p>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email" className="flex items-center gap-2 m-2">
                                <MailIcon className="w-4 h-4" />
                                Email
                            </Label>
                            <Input id="email" name="email" type="email" required />
                            {fieldErrors.email && (
                                <p className="text-sm text-red-500 mt-1">{fieldErrors.email[0]}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="password" className="flex items-center gap-2 m-2">
                                <LockIcon className="w-4 h-4" />
                                Password
                            </Label>
                            <Input id="password" name="password" type="password" required />
                            {fieldErrors.password && (
                                <p className="text-sm text-red-500 mt-1">{fieldErrors.password[0]}</p>
                            )}
                        </div>

                        <div className="text-sm text-right">
                            {/* <Link href="/forgot-password" className="text-blue-600 hover:underline">
                                Forgot password?
                            </Link> */}
                        </div>

                        {formError && (
                            <motion.p
                                className="text-sm text-red-600"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {formError}
                            </motion.p>
                        )}
                        {errorcode && (
                            <motion.p
                                className="text-sm text-red-600"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {errorcode}
                            </motion.p>
                        )}

                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>

                    <div className="my-4 flex items-center justify-between">
                        <span className="h-px bg-gray-200 w-1/3" />
                        <span className="text-sm text-muted-foreground">or</span>
                        <span className="h-px bg-gray-200 w-1/3" />
                    </div>

                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => {
                            setLoading(true)
                            //window.location.href = '/api/auth/signin/google'
                            handleGoogleLogin();
                        }}
                    >
                        <FcGoogle className="w-5 h-5" />
                        Continue with Google
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    )
}
