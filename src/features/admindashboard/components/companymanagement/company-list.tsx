'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MoreVertical } from 'lucide-react'

import { Company } from '@/generated/prisma/client'
import { getCompaniesForAdmin } from '../../actions/companymanagement/company-actions'
import { CompanyActionsMenu } from './company-actions-menu'

type CompanyRow = Pick<
  Company,
  'id' | 'title' | 'description' | 'isSuspended' | 'isDeleted'
> & {
  usersCount: number
}

export default function CompanyList() {
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getCompaniesForAdmin()
      setCompanies(data)
      setLoading(false)
    }

    load()
  }, [])

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Companies</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Users</TableHead>
            <TableHead className="w-12.5" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Loading companies…
              </TableCell>
            </TableRow>
          )}

          {!loading && companies.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No companies found
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">
                  {company.title}
                </TableCell>

                <TableCell className="text-muted-foreground max-w-75 truncate">
                  {company.description || '—'}
                </TableCell>

                <TableCell>
                  <div className="flex gap-2">
                    {company.isDeleted && (
                      <Badge variant="destructive">Deleted</Badge>
                    )}

                    {!company.isDeleted && company.isSuspended && (
                      <Badge variant="secondary">Suspended</Badge>
                    )}

                    {!company.isDeleted && !company.isSuspended && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  {company.usersCount}
                </TableCell>

                <TableCell className="text-right">
                  <CompanyActionsMenu company={{ ...company, title: company.title ?? '' }} />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </Card>
  )
}
