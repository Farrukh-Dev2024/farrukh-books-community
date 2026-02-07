'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getaccounts, deleteaccount } from '@/features/company/accounts/actions/accountsactions'
import { EditAccountDialog } from './EditAccountDialog'
import { toast } from 'sonner'
import { useAppContext } from '@/context/AppContext'
import { ACCOUNT_TYPE_LABELS } from '@/types/project-types'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useYesNoDialog } from '@/features/yesnodialog/useYesNoDialog'
import { User, Company, Account, Journal, Image, CompanyInvite } from '@/types/prisma-types'

export default function AccountList() {
  const { showYesNoDialog, YesNoDialog } = useYesNoDialog()
  const { appData, setAppData } = useAppContext()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isPending, startTransition] = useTransition()
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [expandedSections, setExpandedSections] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const companyId = appData.company?.id

  useEffect(() => {
    if (!companyId) return
    const key = `expandedSections_${companyId}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        setExpandedSections(JSON.parse(saved))
      } catch {
        setExpandedSections([])
      }
    } else {
      setExpandedSections([])
    }
  }, [companyId])

  useEffect(() => {
    async function loadAccounts() {
      const res = await getaccounts()
      if (res) {
        setAccounts(res)
        setAppData({ ...appData, accounts: res })
      }
    }
    loadAccounts()
  }, [companyId])

  const handleDelete = (account: Account) => {
    showYesNoDialog({
      title: 'Delete Account?',
      content: (
        <div>
          Are you sure you want to delete <b>{account.title}</b>? <br />
          This action{' '}
          <span className="text-red-500 font-semibold">cannot</span> be undone.
        </div>
      ),
      onYes: async () => {
        startTransition(async () => {
          const tmpformdata = new FormData()
          tmpformdata.append('id', account.id.toString())
          const res = await deleteaccount({}, tmpformdata)
          if (res.success) {
            toast.success('Account deleted')
            setAccounts((prev) => prev.filter((acc) => acc.id !== account.id))
            setAppData({ ...appData, accounts: accounts })
          } else {
            toast.error(res.message || 'Failed to delete')
          }
        })
      },
    })
  }

  const toggleSection = (typeId: number) => {
    setExpandedSections((prev) => {
      const updated = prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
      if (companyId) {
        const key = `expandedSections_${companyId}`
        localStorage.setItem(key, JSON.stringify(updated))
      }
      return updated
    })
  }

  const filteredAccounts = accounts.filter((acc) =>
    acc.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedAccounts = Object.entries(ACCOUNT_TYPE_LABELS).map(
    ([typeId, label]) => ({
      typeId: Number(typeId),
      label,
      accounts: filteredAccounts.filter(
        (acc) => acc.accountType === Number(typeId)
      ),
    })
  )

  return (
    <div className="w-full px-3 sm:px-6 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 border-border focus-visible:ring-primary"
          />
          {typeof companyId === 'number' && (
            <EditAccountDialog
              companyId={companyId}
              onSuccess={(newAccount) => {
                setAccounts([...accounts, newAccount])
                setAppData({ ...appData, accounts: accounts })
              }}
            >
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Add Account
              </Button>
            </EditAccountDialog>
          )}
        </div>
      </div>

      {/* Grouped & Collapsible Sections */}
      <div className="space-y-6">
        {groupedAccounts.map(
          ({ typeId, label, accounts }) =>
            accounts.length > 0 && (
              <section
                key={typeId}
                className="bg-card border border-border rounded-2xl shadow-sm p-5 transition-all"
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(typeId)}
                  className="w-full flex justify-between items-center text-left"
                >
                  <h2 className="text-lg font-medium text-foreground">{label}</h2>
                  {expandedSections.includes(typeId) ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Accounts Grid */}
                {expandedSections.includes(typeId) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-3">
                    {accounts.map((acc) => (
                      <Card
                        key={acc.id}
                        className="rounded-xl border border-border bg-background shadow-sm hover:shadow-md transition-all"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="flex justify-between items-center text-base font-medium text-foreground">
                            <span>{acc.title}</span>
                            <span className="text-sm text-muted-foreground">
                              {acc.balance.toString()}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {acc.description}
                          </p>
                          <div className="flex justify-end gap-2 pt-2">
                            {typeof companyId === 'number' && (
                              <EditAccountDialog
                                companyId={companyId}
                                account={acc}
                                onSuccess={(updated) => {
                                  setAccounts((prev) =>
                                    prev.map((a) =>
                                      a.id === updated.id ? updated : a
                                    )
                                  )
                                  setAppData({ ...appData, accounts: accounts })
                                }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-border text-foreground hover:bg-accent"
                                >
                                  Edit
                                </Button>
                              </EditAccountDialog>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleDelete(acc)}
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            )
        )}
      </div>

      {YesNoDialog}
    </div>
  )
}
