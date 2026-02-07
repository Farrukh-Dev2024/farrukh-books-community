'use client'

import { ReactNode, useEffect, useState } from 'react'
import {
  getPlatformStats,
  getSubscriptionOverview,
  getRecentSignups,
  getRecentCompanies,
  getSystemHealth
} from '../actions/actions'
import { useAppContext } from '@/context/AppContext'
import { useSession } from 'next-auth/react';
import { getuser } from '@/features/auth/actions/authactions';
import UsersList from './usermanagement/users-list';
import updates from "@/update-notes.json";
import AdminPlansPage from '@/features/subscription/admin/pages/plans-page'
import SubscriptionsPage from '@/features/subscription/admin/pages/subscriptions-page';
import CompanyUsagePage from '@/features/subscription/admin/pages/company-usage-page';
import AdminUpgradeRequestsPage from '@/features/subscription/admin/pages/upgrade-requests-page';
import CompanyList from './companymanagement/company-list';
import { Button } from '@/components/ui/button';
//import CompanyBackupsPage from '@/features/backup/admin/pages/company-backups-page';
/* ---------- Types ---------- */

type PlatformStats = {
  totalUsers: number
  totalCompanies: number
}

type SubscriptionOverview = {
  trial: number
  active: number
}

type RecentUser = {
  id: number
  createdAt: Date
}

type RecentCompany = {
  id: number
  createdAt: Date
  //country: string | null
}

type SystemHealth = {
  db: string
  serverTime: string
  env: string | undefined
}

/* ---------- Component ---------- */

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const { appData, setAppData } = useAppContext();
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [subs, setSubs] = useState<SubscriptionOverview | null>(null)
  const [users, setUsers] = useState<RecentUser[]>([])
  const [companies, setCompanies] = useState<RecentCompany[]>([])
  const [health, setHealth] = useState<SystemHealth | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const tmpform = new FormData(); tmpform.append("email", session?.user?.email || "");
      const tmpuser = await getuser({}, tmpform)
      //console.log("tmpuser %o",tmpuser);
      setLoaded(true);
      if (tmpuser) {
        setAppData((prev) => ({ ...prev, user: tmpuser, session: session || null, company: tmpuser.company || null }));
      } else {
      }
    }
    fetchUser();
  }, [session]);

  useEffect(() => {
    async function load() {
      const [statsData, subsData, usersData, companiesData, healthData] = await Promise.all([
        getPlatformStats(),
        getSubscriptionOverview(),
        getRecentSignups(),
        getRecentCompanies(),
        getSystemHealth()
      ])

      setStats(statsData)
      setSubs(subsData)
      setUsers(usersData)
      setCompanies(companiesData)
      setHealth(healthData)
    }

    load()
  }, [appData.user])


  if (!stats || !subs || !health) {
    return <div className="p-6">Loading dashboard…</div>
  }

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Total Companies" value={stats.totalCompanies} />
        <StatCard title="Trial Subscriptions" value={subs.trial} />
        <StatCard title="Active Subscriptions" value={subs.active} />
      </div>

      {/* Recent Users */}
      <Section title="Recent Signups">
        {users.map(u => (
          <Row key={u.id} label="User ID" value={u.id} date={u.createdAt} />
        ))}
      </Section>

      {/* Recent Companies */}
      {/* <Section title="Recently Created Companies">
        {companies.map(c => (
          <Row
            key={c.id}
            label="Company ID"
            value={c.id}
            extra=''//{c.country ?? '—'}
            date={c.createdAt}
          />
        ))}
      </Section> */}
      <RecentlyCreatedCompanies companies={companies} />
      {/* <Section title="Recently Created Companies">
  {companies.map(c => (
    <Row
      key={c.id}
      label="Company ID"
      value={c.id}
      extra={ '—'}
      date={c.createdAt}
      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
      onClick={() => setSelectedCompanyId(c.id)}
    />
  ))}
</Section>       */}

      {/* System Health */}
      <Section title="System Health">
        <div>Database: {health.db}</div>
        <div>Server Time: {health.serverTime}</div>
        <div>Environment: {health.env}</div>
      </Section>

      {/* User Management */}
      <UsersList />
      <CompanyList />

      <AdminPlansPage />
      <SubscriptionsPage />
      {/* <CompanyUsagePage companyId={appData.company?.id} /> */}
      <AdminUpgradeRequestsPage />

      {/* --- Update Notes GO HERE --- */}
      <div className="mt-auto w-full text-center py-4 opacity-60 text-sm max-w-3xl mx-auto p-4 ">
        <h6 className="text-xs font-semibold mb-2">
          Version: {updates.version}
        </h6>
        <h6 className="text-xs">
          Lastupdated: {updates.timestamp}
        </h6>
        <h6>
          Farrukh-Books © 2026 by Mian Farrukh Aleem
        </h6>

      </div>
    </div>
  )
}

/* ---------- UI Helpers ---------- */

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border p-4 bg-gray-50 dark:bg-gray-900">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 mb-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Row({
  label,
  value,
  extra,
  date,
  onClick,
  className,
}: {
  label: string
  value: any
  extra?: any
  date?: Date
  onClick?: () => void
  className?: string
}) {
  return (
    <div
      className={`flex justify-between p-2 border rounded-md ${className ?? ''}`}
      onClick={onClick}
    >
      <div className="flex gap-4">
        <span className="font-semibold">{label}:</span>
        <span>{value}</span>
      </div>
      <div className="flex gap-4">
        {extra && <span>{extra}</span>}
        {date && <span className="text-gray-500 text-sm">{date.toLocaleDateString()}</span>}
      </div>
    </div>
  )
}

function RecentlyCreatedCompanies({ companies, } : { companies: { id: number; createdAt: Date; country?: string }[] }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  
  let CompanyBackupsPage: React.ComponentType<any> | null = null;
  let PremiumFeaturesEnabled = false;
  try {

    CompanyBackupsPage = require('@/features/backup/admin/pages/company-backups-page').CompanyBackupsPage;
    PremiumFeaturesEnabled = true;

  } catch (error) {
    //console.error("Failed to load CompanyBackupsPage:", error);
  }


  if (selectedCompanyId) {
    return (
      <div>
        <button
          className="mb-4 text-blue-600 hover:underline"
          onClick={() => setSelectedCompanyId(null)}
        >
          ← Back to companies
        </button>
        <CompanyUsagePage companyId={selectedCompanyId} />
        {PremiumFeaturesEnabled && CompanyBackupsPage && (
          <CompanyBackupsPage companyId={selectedCompanyId} />
        )}
        
{/*        
        <Button  
          onClick={async() => {
            if (selectedCompanyId) {
              // Call the backup action
              const { createCompanyBackup } = await import('@/features/backup/admin/actions/backup-server-actions');
              const result = await createCompanyBackup(selectedCompanyId,"UserProvidedSafetyPassword123!");
              console.log("Backup result: %o", result);
            }
          }}
        >
          Test Button
        </Button>
*/}       
      </div>
    )
  }

  return (
    <Section title="Recently Created Companies">
      {companies.map(c => (
        <Row
          key={c.id}
          label="Company ID"
          value={c.id}
          extra={c.country ?? '—'}
          date={c.createdAt}
          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => setSelectedCompanyId(c.id)}
        />
      ))}
    </Section>
  )
}