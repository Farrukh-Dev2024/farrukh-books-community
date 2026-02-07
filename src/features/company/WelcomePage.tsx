'use client'
import * as React from 'react'
import { useAppContext } from '@/context/AppContext'
import CreateCompany from './admin/components/CreateCompany'
import { Session } from 'next-auth'
import ViewCompany from './admin/components/ViewCompany'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { User } from '@/types/prisma-types'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { BASE_PATH } from "@/types/project-types"

const WelcomePage: React.FunctionComponent = (props) => {
  const { appData } = useAppContext()
  const [user, setUser] = React.useState<User | null>(null)
  const [session, setSession] = React.useState<Session | null>(null)
  const router = useRouter()

  React.useEffect(() => {
    setUser(appData.user)
    if (appData.user) {
      setSession(appData.session)
    }
  }, [appData.user, appData.session, appData.userUpdated])

  if (user && user.companyId == null) {
    return (
      <div className="flex justify-center items-center min-h-[70vh] px-4">
        <Card className="w-full max-w-md border border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl font-semibold text-center">
              You don’t have a company yet
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground text-center">
              Kindly create a new company or join an existing one.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  console.log('Create Company Clicked')
                  router.push(BASE_PATH + '/?page=createcompany')
                }}
              >
                Create Company
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  console.log('Join Company Clicked')
                  router.push(BASE_PATH + '/?page=invites')
                }}
              >
                Join Company
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user && user.companyId != null) {
    return <ViewCompany />
  }

  return null
}

export default WelcomePage
