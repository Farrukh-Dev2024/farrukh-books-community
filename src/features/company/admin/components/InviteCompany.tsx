'use client'
import * as React from 'react'
import { useAppContext } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { CompanyRoles, UserRoles, PrevState } from '@/types/project-types'
import {
  getuserincominginvites,
  processcompanyinvite,
  sendcompanyinvite,
  getuseroutgoinginvites,
  deletecompanyinvite,
} from '@/features/company/admin/actions/companyactions'
import { toast } from 'sonner'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { CompanyInvite } from '@/types/prisma-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const InviteCompany: React.FunctionComponent = () => {
  const { appData, setAppData } = useAppContext()
  const router = useRouter()
  const [isAdmin, setisAdmin] = React.useState<boolean>(false)
  const [myInvite, setmyInvite] = React.useState<CompanyInvite | null>(null)

  const InviteAnswer_initialState: PrevState = {}
  const [InviteAnswer_state, InviteAnswer_formAction, InviteAnswer_isPending] =
    React.useActionState<PrevState, FormData>(
      processcompanyinvite,
      InviteAnswer_initialState
    )

  React.useEffect(() => {
    if (
      appData.company !== null &&
      (appData.user?.userRole === UserRoles.Admin ||
        appData.user?.userRole == UserRoles.SuperAdmin ||
        appData.user?.companyRole === CompanyRoles.FullAccess)
    ) {
      setisAdmin(true)
    }
    const fetchIncomingInvites = async () => {
      const invites = await getuserincominginvites()
      if (invites?.success === true && invites.invites) {
        setmyInvite(invites?.invites)
      } else {
        console.log('Failed to fetch incoming invites:', invites?.message)
      }
    }
    fetchIncomingInvites()
  }, [appData.company, appData.userUpdated])

  React.useEffect(() => {
    if (InviteAnswer_state && InviteAnswer_state !== null) {
      if (InviteAnswer_state?.success) {
        setmyInvite(null)
        toast.success(`Operation successfully!`)
      } else if (InviteAnswer_state?.success === false) {
        toast.error(`Operation failed: ${InviteAnswer_state.message}`)
      }
    }
  }, [InviteAnswer_state])

  const InviteAnswer = async (
    inviteId: number,
    inviteanswer: 'accept' | 'reject'
  ) => {
    const formData = new FormData()
    formData.append('id', String(inviteId))
    formData.append('inviteanswer', inviteanswer)
    React.startTransition(async () => {
      const response = await InviteAnswer_formAction(formData)
      setAppData((prev) => ({ ...prev, companyUpdated: true }))
    })
  }

  const ViewInComingInvites: React.FunctionComponent = () => {
    if (myInvite) {
      return (
        <Card className="max-w-lg w-full mx-auto mt-6 shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl font-semibold">
              Invite Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <p className="font-semibold">{myInvite.title}</p>
                <div
                  dangerouslySetInnerHTML={{
                    __html: myInvite.description,
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="default"
                  size="icon"
                  onClick={() => InviteAnswer(myInvite.id, 'accept')}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => InviteAnswer(myInvite.id, 'reject')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }
    return (
      <>
        <Card className="max-w-lg w-full mx-auto mt-6 shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl font-semibold">
              Invite Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <h1>No invite received.</h1>
              </div>
            </div>  
          </CardContent>
        </Card>
      
      </>
  )
  }

  const ManageInvitesSent: React.FunctionComponent = () => {
    const [outgoingInvites, setOutgoingInvites] = React.useState<
      CompanyInvite[]
    >([])

    React.useEffect(() => {
      const fetchOutgoingInvites = async () => {
        const res = await getuseroutgoinginvites()
        if (res?.success && res.invites) {
          setOutgoingInvites(res.invites)
        } else {
          setOutgoingInvites([])
        }
      }
      fetchOutgoingInvites()
    }, [])

    const handleDelete = async (inviteId: number) => {
      try {
        const formData = new FormData()
        formData.append('id', String(inviteId))
        const res = await deletecompanyinvite({}, formData)
        setAppData((prev) => ({ ...prev, companyUpdated: true }))
        if (res?.success) {
          toast.success('Invite deleted successfully')
          setOutgoingInvites((prev) => prev.filter((i) => i.id !== inviteId))
        } else {
          toast.error(res?.message || 'Failed to delete invite')
        }
      } catch (err) {
        console.error(err)
        toast.error('Unexpected error while deleting invite')
      }
    }

    return (
      <Card className="max-w-lg w-full mx-auto mt-6 shadow-md border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl font-semibold">
            Manage Outgoing Invites
          </CardTitle>
        </CardHeader>
        <CardContent>
          {outgoingInvites.length > 0 ? (
            <div className="space-y-3">
              {outgoingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="border rounded-md p-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{invite.title}</p>
                    <p className="text-sm text-gray-600">{invite.email}</p>
                    <p className="text-sm text-gray-500">
                      Company:{' '}
                      <span className="font-semibold">
                        {invite.company?.title}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(invite.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No outgoing invites found.</p>
          )}
        </CardContent>
      </Card>
    )
  }

  const SendInvites: React.FunctionComponent = () => {
    const initialState: PrevState = {}
    const [state, formAction, isPending] = React.useActionState(
      sendcompanyinvite,
      initialState
    )

    React.useEffect(() => {
      if (state?.success) {
        toast.success(state.message || 'Invite sent successfully')
        setAppData((prev) => ({ ...prev, companyUpdated: true }))
      } else if (state?.success === false) {
        toast.error(state.message || 'Failed to send invite')
      }
    }, [state, setAppData])

    return (
      <Card className="max-w-lg w-full mx-auto mt-6 shadow-md border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl font-semibold">
            Send Company Invite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Collapsible>
            <CollapsibleTrigger>
              <div className="w-full bg-amber-200 hover:bg-amber-400 text-black rounded-2xl p-4">
                Send Invite
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <form action={formAction} className="space-y-6 w-full m-4">
                <div className="flex flex-col w-full space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input name="email" type="email" />
                  {state?.errors?.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {state.errors.email}
                    </p>
                  )}
                </div>

                <div className="flex flex-col w-full space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    name="title"
                    type="text"
                    defaultValue={
                      'Invitation to join our company: ' + appData.company?.title
                    }
                  />
                  {state.errors?.title && (
                    <p className="text-red-500 text-sm mt-1">
                      {state.errors.title}
                    </p>
                  )}
                </div>

                <div className="flex flex-col w-full space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    name="description"
                    className="w-full border rounded-md p-2"
                    rows={10}
                    defaultValue={`<p>Hi,<br><br>You have been invited to join our company: <strong>${appData.company?.title || ''
                      }</strong>. Please click the link to accept the invite and join the company.<br><br>Invitation By<br><strong>${appData.user?.name || ''
                      }</strong></p>`}
                  />
                  {state.errors?.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {state.errors.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col w-full space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue={String(CompanyRoles.FullAccess)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CompanyRoles).map(([key, value]) => (
                        <SelectItem key={value} value={String(value)}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {state.errors?.role && (
                    <p className="text-red-500 text-sm mt-1">
                      {state.errors.role}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Sending...' : 'Send Invite'}
                </Button>

                {state.message && (
                  <p
                    className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'
                      }`}
                  >
                    {state.message}
                  </p>
                )}
              </form>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full px-4">
      <ViewInComingInvites />
      {isAdmin && (
        <>
          <ManageInvitesSent />
          <SendInvites />
        </>
      )}
    </div>
  )
}

export default InviteCompany
