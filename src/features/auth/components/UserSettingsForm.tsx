//userettings form
'use client'
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { useActionState } from "react";

import { z } from 'zod';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

import { updateUserProfile } from "@/features/auth/actions/authactions";

const schema = z
  .object({
    name: z
      .string()
      .min(4, 'Name is required').max(50, 'Name must be less than 20 characters')
      .regex(/^[a-zA-Z0-9 .!#$%&'*+/=?^_`{|}~-]+$/, 'Invalid name'),
    email: z
      .string()
      .min(4, 'Email is required').max(50, 'Email must be less than 20 characters')
      .email('Invalid email address'),

    currentPassword: z.string().min(6, 'Minimum password length is 6').max(20, 'Maximum password length is 20').optional(),
    newPassword: z.string().min(6, 'Minimum password length is 6').max(20, 'Maximum password length is 20').optional(),
    confirmPassword: z.string().min(6, 'Minimum password length is 6').max(20, 'Maximum password length is 20').optional(),
  })
  .refine((data) => {
    // If current password is provided, validate password logic
    if (data.currentPassword) {
      //console.log("data.currentPassword %o",data.currentPassword);
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


export interface IUserSettingsFromProps {
  email: string,
  name: string,
}

const UserSettingsForm: React.FunctionComponent<IUserSettingsFromProps> = (props) => {
  const { data: session, status } = useSession() //renaming data to session
  const [errors, setErrors] = useState<z.inferFlattenedErrors<typeof schema>['fieldErrors']>({});
  const [email, setEmail] = useState(props.email);
  const [name, setName] = useState(props.name);

  const [state, formAction, isPending] = useActionState(updateUserProfile, {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    type FormDataType = {
      email: string;
      name: string;
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    }
    const formData: FormDataType = {
      email: form.get('email') as string,
      name: form.get('name') as string,
      currentPassword: form.get("currentPassword") as string,
      newPassword: form.get("newPassword") as string,
      confirmPassword: form.get("confirmPassword") as string,
    };
    if (formData.currentPassword === "") {
      delete formData.currentPassword;
      delete formData.newPassword;
      delete formData.confirmPassword;
    }
    const result = schema.safeParse(formData);
    if (!result.success) {
      console.log("%O", formData);
      console.log("result %o", result.error.flatten().fieldErrors);
      setErrors(result.error.flatten().fieldErrors);
    } else {
      React.startTransition(async () => {
        setErrors({}); // Clear previous errors
        await formAction(form);
      });
      // Check if the action was successful
      //console.log("state %o",state);
      if (state?.error) {
        if (state?.zerrors) {
          setErrors(state.zerrors as z.inferFlattenedErrors<typeof schema>['fieldErrors']);
        }
        return;
      } else {
        setErrors({});
        toast.success('Settings saved successfully!');

      }
    }
  };
  React.useEffect(() => {
    console.log(name, email)
  }, [name, email]);
  return (
    <>
      <div className="">
        <div className="form-style mt-2 ">
          <h2 className="form-h2-style">User Settings</h2>

          <form className='space-y-6' method="POST" onSubmit={handleSubmit} noValidate  >
            {/* Profile Information */}
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Profile Information</h2>
            <div>
              <Label className="form-label-style" htmlFor="name">Name</Label>
              <Input
                className="form-input-style"
                type="text"
                id="name"
                name="name"
                placeholder="Farrukh Aleem"
                onChange={(e) => setName(e.target.value)}
                value={name}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name[0]}</p>}

            </div>

            <div>
              <div className="space-y-4">
                <div>
                </div>
                <div>
                  <Label className="form-label-style" htmlFor="email">Email</Label>
                  <Input
                    className="form-input-style cursor-not-allowed text-gray-500 dark:text-gray-400"
                    type="email"
                    id="email"
                    name="email"
                    placeholder="john@example.com"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Change Password</h2>
              <div className="space-y-4">
                <div>
                  <Label className="form-label-style" htmlFor="currentPassword">Current Password</Label>
                  <Input
                    className="form-input-style"
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    placeholder="••••••••"
                  />
                  {errors.currentPassword && <p className="text-sm text-red-500 mt-1">{errors.currentPassword[0]}</p>}
                </div>
                <div>
                  <Label className="form-label-style" htmlFor="newPassword">New Password</Label>
                  <Input
                    className="form-input-style"
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    placeholder="••••••••"
                  />
                  {errors.newPassword && <p className="text-sm text-red-500 mt-1">{errors.newPassword[0]}</p>}
                </div>
                <div>
                  <Label className="form-label-style" htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    className="form-input-style"
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword[0]}</p>}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" >Save Changes</Button>
          </form>

        </div>
      </div>
    </>
  );
}

export default UserSettingsForm;