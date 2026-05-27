'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import type { OutletWithRelations } from '@/types'

interface OverviewTabProps {
  outlet: OutletWithRelations
}

interface ChecklistItem {
  label: string
  complete: boolean
  required: boolean
  count?: number
}

function getSetupChecklist(outlet: OutletWithRelations): ChecklistItem[] {
  return [
    {
      label: 'Restaurant linked',
      complete: !!outlet.restaurant_id,
      required: true,
    },
    {
      label: 'Basic outlet info completed',
      complete: !!outlet.name && !!outlet.location,
      required: true,
    },
    {
      label: 'Table groups added',
      complete: outlet.table_group.length >= 1,
      count: outlet.table_group.length,
      required: false,
    },
    {
      label: 'Tables added',
      complete: outlet.tables.length >= 1,
      count: outlet.tables.length,
      required: false,
    },
    {
      label: 'Users added',
      complete: outlet.users.length >= 1,
      count: outlet.users.length,
      required: false,
    },
  ]
}

export function OverviewTab({ outlet }: OverviewTabProps) {
  const checklist = getSetupChecklist(outlet)
  const completedRequired = checklist.filter(
    (item) => item.required && item.complete
  ).length
  const totalRequired = checklist.filter((item) => item.required).length
  const allRequiredComplete = completedRequired === totalRequired

  const activeTables = outlet.tables.filter((t) => t.active).length
  const inactiveTables = outlet.tables.filter((t) => !t.active).length

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Setup Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Checklist</CardTitle>
          <CardDescription>
            {allRequiredComplete
              ? 'All required items are complete'
              : `${completedRequired}/${totalRequired} required items complete`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {checklist.map((item, index) => (
              <li key={index} className="flex items-center gap-3">
                {item.complete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : item.required ? (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span
                  className={
                    item.complete ? 'text-foreground' : 'text-muted-foreground'
                  }
                >
                  {item.label}
                  {item.count !== undefined && (
                    <span className="ml-1 text-sm">({item.count})</span>
                  )}
                </span>
                {!item.complete && item.required && (
                  <span className="ml-auto text-xs text-amber-500">
                    Required
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Outlet Summary</CardTitle>
          <CardDescription>Key metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <dt className="text-sm text-muted-foreground">Restaurant</dt>
              <dd className="font-medium">
                {outlet.restaurant?.restaurant_name || '-'}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-sm text-muted-foreground">Location</dt>
              <dd className="font-medium">{outlet.location || '-'}</dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-sm text-muted-foreground">Table Groups</dt>
              <dd className="font-medium">{outlet.table_group.length}</dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-sm text-muted-foreground">Tables</dt>
              <dd className="font-medium">
                {activeTables} active
                {inactiveTables > 0 && (
                  <span className="text-muted-foreground">
                    {' '}
                    / {inactiveTables} inactive
                  </span>
                )}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-sm text-muted-foreground">Users</dt>
              <dd className="font-medium">{outlet.users.length}</dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-sm text-muted-foreground">Branch Code</dt>
              <dd className="font-medium">{outlet.branchCode || '-'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Recent Activity (placeholder for future) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Outlet Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Manager Names</dt>
              <dd className="font-medium">
                {outlet.managerNames.length > 0
                  ? outlet.managerNames.join(', ')
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Server Names</dt>
              <dd className="font-medium">
                {outlet.serverNames.length > 0
                  ? outlet.serverNames.join(', ')
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Departments</dt>
              <dd className="font-medium">
                {outlet.departments.length > 0
                  ? outlet.departments.join(', ')
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Region</dt>
              <dd className="font-medium">{outlet.region || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Created</dt>
              <dd className="font-medium">
                {new Date(outlet.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">
                {new Date(outlet.updated_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
