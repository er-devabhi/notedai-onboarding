'use client'

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
} from 'lucide-react'
import { OverviewTab } from './overview-tab'
import { GeneralInfoTab } from './general-info-tab'
import { TableGroupsTab } from './table-groups-tab'
import { TablesTab } from './tables-tab'
import { UsersTab } from './users-tab'
import { PasswordTab } from './password-tab'
import { DepartmentMappingTab } from './department-mapping-tab'
import { OpdDetailsTab } from './opd-details-tab'
import type { OutletWithRelations } from '@/types'

interface OutletWorkspaceProps {
  outlet: OutletWithRelations
}

export function OutletWorkspace({ outlet }: OutletWorkspaceProps) {
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
      <Tabs defaultValue="overview" className="flex flex-col gap-4">
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
          <TabsTrigger value="departments" className="gap-2">
            <Network className="h-4 w-4" />
            Department Mapping
          </TabsTrigger>
          <TabsTrigger value="opd" className="gap-2">
            <Stethoscope className="h-4 w-4" />
            OPD Details
          </TabsTrigger>
          <TabsTrigger value="passwords" className="gap-2">
            <KeyRound className="h-4 w-4" />
            Passwords
          </TabsTrigger>
        </TabsList>

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
          />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentMappingTab
            outletId={outlet.id}
            departments={outlet.outlet_departments}
            departmentUsers={outlet.users.filter(
              (u) => u.role === 'DEPARTMENT'
            )}
            defaultEmailCc={outlet.default_email_cc}
            dashboardUrl={outlet.dashboard_url}
          />
        </TabsContent>

        <TabsContent value="opd">
          <OpdDetailsTab
            outletId={outlet.id}
            staffs={outlet.staffs}
            tableGroups={outlet.table_group}
          />
        </TabsContent>

        <TabsContent value="passwords">
          <PasswordTab users={outlet.users} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
