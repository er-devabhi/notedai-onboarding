'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Info,
  Grid3X3,
  TableProperties,
  Users,
  KeyRound,
  ChevronLeft,
  Network,
  Stethoscope,
  QrCode,
  ArrowUpNarrowWide,
} from 'lucide-react'
import { OverviewTab } from './overview-tab'
import { GeneralInfoTab } from './general-info-tab'
import { TableGroupsTab } from './table-groups-tab'
import { TablesTab } from './tables-tab'
import { UsersTab } from './users-tab'
import { PasswordTab } from './password-tab'
import { QrLoginsTab } from './qr-logins-tab'
import { DepartmentMappingTab } from './department-mapping-tab'
import { OpdDetailsTab } from './opd-details-tab'
import { EscalationLevelTab } from './escalation-level-tab'
import type { OutletWithRelations } from '@/types'

interface OutletWorkspaceProps {
  outlet: OutletWithRelations
}

const TAB_VALUES = [
  'overview',
  'general',
  'groups',
  'tables',
  'users',
  'departments',
  'opd',
  'escalation',
  'passwords',
  'qr-logins',
] as const

export function OutletWorkspace({ outlet }: OutletWorkspaceProps) {
  const isRestaurant = outlet.restaurant?.organizationType === 'RESTAURANT'
  const storageKey = `outlet-active-tab-${outlet.id}`
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const restrictedTabs = isRestaurant
      ? new Set(['departments', 'opd', 'escalation'])
      : new Set()
    const stored = window.sessionStorage.getItem(storageKey)
    if (
      stored &&
      (TAB_VALUES as readonly string[]).includes(stored) &&
      !restrictedTabs.has(stored)
    ) {
      setActiveTab(stored)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    window.sessionStorage.setItem(storageKey, value)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/outlets">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to outlets</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{outlet.name}</h1>
          <p className="text-sm text-muted-foreground">
            {outlet.restaurant?.restaurant_name || 'Unknown Restaurant'}
            {outlet.location && ` - ${outlet.location}`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col gap-4">
        <div className="sticky top-16 z-100 -mx-6 bg-background px-6 py-2">
          <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Info className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Table Groups
          </TabsTrigger>
          <TabsTrigger value="tables" className="gap-2">
            <TableProperties className="h-4 w-4" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          {!isRestaurant && (
            <TabsTrigger value="departments" className="gap-2">
              <Network className="h-4 w-4" />
              Department Mapping
            </TabsTrigger>
          )}
          {!isRestaurant && (
            <TabsTrigger value="opd" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              OPD Details
            </TabsTrigger>
          )}
          {!isRestaurant && (
            <TabsTrigger value="escalation" className="gap-2">
              <ArrowUpNarrowWide className="h-4 w-4" />
              Escalation Level
            </TabsTrigger>
          )}
          <TabsTrigger value="passwords" className="gap-2">
            <KeyRound className="h-4 w-4" />
            Passwords
          </TabsTrigger>
          <TabsTrigger value="qr-logins" className="gap-2">
            <QrCode className="h-4 w-4" />
            QR Logins
          </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <OverviewTab outlet={outlet} />
        </TabsContent>

        <TabsContent value="general">
          <GeneralInfoTab outlet={outlet} />
        </TabsContent>

        <TabsContent value="groups">
          <TableGroupsTab
            outletId={outlet.id}
            tableGroups={outlet.table_group}
          />
        </TabsContent>

        <TabsContent value="tables">
          <TablesTab
            outletId={outlet.id}
            tables={outlet.tables}
            tableGroups={outlet.table_group}
          />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab
            outletId={outlet.id}
            restaurantId={outlet.restaurant_id}
            users={outlet.users}
            showDepartmentUsers={!isRestaurant}
          />
        </TabsContent>

        {!isRestaurant && (
          <TabsContent value="departments">
            <DepartmentMappingTab
              outletId={outlet.id}
              departments={outlet.outlet_departments}
              departmentUsers={outlet.users.filter((u) =>
                (['DEPARTMENT', 'GRE_HEAD', 'SERVICE_EXCELLENCE'] as const).includes(
                  u.role as 'DEPARTMENT' | 'GRE_HEAD' | 'SERVICE_EXCELLENCE'
                )
              )}
              defaultEmailCc={outlet.default_email_cc}
              dashboardUrl={outlet.dashboard_url}
            />
          </TabsContent>
        )}

        {!isRestaurant && (
          <TabsContent value="opd">
            <OpdDetailsTab
              outletId={outlet.id}
              staffs={outlet.staffs}
              tableGroups={outlet.table_group}
            />
          </TabsContent>
        )}

        {!isRestaurant && (
          <TabsContent value="escalation">
            <EscalationLevelTab
              outletId={outlet.id}
              levels={outlet.escalation_level}
            />
          </TabsContent>
        )}

        <TabsContent value="passwords">
          <PasswordTab users={outlet.users} />
        </TabsContent>

        <TabsContent value="qr-logins">
          <QrLoginsTab outletId={outlet.id} users={outlet.users} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
