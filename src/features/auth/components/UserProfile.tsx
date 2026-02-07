'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

const UserProfile: React.FunctionComponent = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="max-w-lg mx-auto mt-12 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
          You must be logged in to view your profile.
        </h2>
      </div>
    );
  }

  const user = session.user as { name?: string; email?: string; image?: string };

  return (
    <div className="max-w-lg mx-auto mt-12">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            User Profile
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profile Section */}
          <section>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Profile Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 py-2">
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 py-2">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{user.email}</span>
              </div>
            </div>
          </section>

          {/* <Separator /> */}

          {/* Optional Image Section */}
          {/* {user.image && (
            <section className="text-center">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
                Profile Picture
              </h3>
              <Image
                src={user.image}
                alt="Profile picture"
                className="w-32 h-32 rounded-full mx-auto border shadow-sm object-cover"
              />
            </section>
          )} */}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
