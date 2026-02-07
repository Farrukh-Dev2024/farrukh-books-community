export const dynamic = "force-dynamic";

import MainFrame from '@/features/mainpage/MainFrame';
import MainPage from '@/features/mainpage/MainPage'
import * as React from 'react';
import { auth } from '@/lib/auth'
import { getuser } from '@/features/auth/actions/authactions';



export default async function Home() {
  'use server';
  const session = await auth()
  let userdb = undefined;
  if (session?.user) {
    const tmpform = new FormData(); tmpform.append("email", session?.user?.email || "");
    userdb = await getuser({}, tmpform);
  }
  const isBanned = userdb?.isBanned;
  const isCompanySuspended = userdb?.company?.isSuspended || false;

  return (
    <MainFrame className='w-[98%] mx-auto ml-2 mt-2 min-w-100'>
      <React.Suspense>
        {isBanned && (
          <div className="max-w-md mx-auto mt-10 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-6 text-center space-y-2">
            <h1 className="text-lg font-semibold text-red-700 dark:text-red-400">
              Access Restricted
            </h1>
            <p className="text-sm text-red-600 dark:text-red-300">
              Your account has been banned. Please contact support if you believe this is a mistake.
            </p>
          </div>
        )}
        {isCompanySuspended && (
          <div className="max-w-md mx-auto mt-10 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-6 text-center space-y-2">
            <h1 className="text-lg font-semibold text-red-700 dark:text-red-400">
              Company Access Restricted
            </h1>
            <p className="text-sm text-red-600 dark:text-red-300">
              Your company has been suspended. Please contact support if you believe this is a mistake.
            </p>  
            <div className="text-left text-bold text-red-600 dark:text-red-300 mt-4">
              <ul>
                <li>- Ensure all payments are up to date.</li>
                <li>- Review company policies to ensure compliance.</li>
                <li>- Make sure no violations have occurred.</li>
                <li>- Make sure no unauthorized access has occurred.</li>
                <li>- Contact our support team for further assistance.</li>
              </ul>

            </div>
            
          </div>
        )}        
        {!isBanned && !isCompanySuspended && (
          <MainPage />
        )}
      </React.Suspense>
    </MainFrame>
  )
}

// function MedievalFrame({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="relative p-12 bg-yellow-50 dark:bg-yellow-900 overflow-hidden">
//       {/* Outer ornate frame */}
//       <div className="absolute inset-0 pointer-events-none border-8 border-double border-yellow-800 dark:border-yellow-200 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.2)]"></div>

//       {/* Decorative corners */}
//       <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-yellow-800 dark:border-yellow-200 rounded-tl-2xl"></div>
//       <div className="absolute top-0 right-0 w-16 h-16 border-t-8 border-r-8 border-yellow-800 dark:border-yellow-200 rounded-tr-2xl"></div>
//       <div className="absolute bottom-0 left-0 w-16 h-16 border-b-8 border-l-8 border-yellow-800 dark:border-yellow-200 rounded-bl-2xl"></div>
//       <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-yellow-800 dark:border-yellow-200 rounded-br-2xl"></div>

//       {/* Inner pattern / optional texture */}
//       <div className="absolute inset-2 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] bg-repeat opacity-20 pointer-events-none rounded-2xl"></div>

//       {/* Content */}
//       <div className="relative z-10">{children}</div>
//     </div>
//   );
// }
// const frameSrc = "border1.png";
// function OrnateFrame({ children, className = "" }: { children: React.ReactNode,className: string }) {
//   return (
//     <div
//       className={[
//         "inline-block box-border",
//         "border-[48px] border-solid",                    // border size
//         "[border-image-slice:111_134_136_111]",          // top right bottom left
//         "[border-image-repeat:round]",                 // or round
//         className,
//       ].join(" ")}
//       style={{
//         borderImageSource: `url(${frameSrc})`,
//       }}
//     >
//       <div >
//         {children}
//       </div>
//     </div>
//   );
// }