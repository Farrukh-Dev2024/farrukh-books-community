'use client';
import * as React from 'react';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Company } from '@/types/prisma-types';
import { BASE_PATH } from '@/types/project-types';
import SubscriptionPage from '@/features/subscription/user/pages/subscription-page';

const ViewCompany: React.FunctionComponent = (props) => {
  const { appData, setAppData } = useAppContext();
  const [company, setCompany] = React.useState<Company | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (appData.company === null) {
      router.push('/?page=welcomepage');
    }
  }, []);

  React.useEffect(() => {
    setCompany(appData.company);
  }, [appData.company, appData.companyUpdated]);

  return (
    <>
      <div className="w-full flex justify-center px-2 sm:px-4 py-6">
        <div className="bg-card border border-border rounded-2xl shadow-sm sm:max-w-md md:max-w-lg w-full p-6 space-y-4">
          {company?.avatarUrl && (
            <div className="w-full flex items-center justify-center mb-4">
              <Image
                src={company.avatarUrl}
                width={160}
                height={160}
                alt="Company Logo"
                className="rounded-xl border border-border shadow-sm"
                unoptimized
              />
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-2xl font-semibold text-foreground text-center">
              {company?.title}
            </h4>

            {company?.description && (
              <>
                <h5 className="text-lg font-medium text-muted-foreground">Description</h5>
                <div
                  className="prose dark:prose-invert text-sm mt-1"
                  dangerouslySetInnerHTML={{ __html: company.description }}
                />
              </>
            )}

            <div className="pt-3 border-t border-border text-sm text-muted-foreground">
              <p>Created: {company?.createdAt.toDateString()}</p>
              <p>Updated: {company?.updatedAt.toDateString()}</p>
            </div>

            <Button
              variant="default"
              className="w-full mt-4"
              onClick={() => {
                router.push(BASE_PATH + '/?page=editcompany');
                console.log('Edit Company Details Clicked');
              }}
            >
              Edit Company
            </Button>
          </div>
          {(appData.user && appData.user.companyId) && (
            <SubscriptionPage user={appData.user as { id: number; companyId: number; companyRole: number }} />
          )}
        </div>
      </div>

    </>
  );
};

export default ViewCompany;
