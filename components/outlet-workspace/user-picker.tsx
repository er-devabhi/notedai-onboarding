'use client'

import { useMemo, useState } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

interface UserPickerProps {
  users: User[]
  value: string | null
  onChange: (userId: string) => void
  placeholder?: string
  disabled?: boolean
}

export function UserPicker({
  users,
  value,
  onChange,
  placeholder = 'Select a user',
  disabled,
}: UserPickerProps) {
  const [search, setSearch] = useState('')

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) =>
      `${user.name || ''} ${user.email || ''}`.toLowerCase().includes(query)
    )
  }, [users, search])

  return (
    <SelectPrimitive.Root
      value={value ?? undefined}
      onValueChange={onChange}
      disabled={disabled}
      onOpenChange={(open) => {
        if (!open) setSearch('')
      }}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-none transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 max-h-(--radix-select-content-available-height) w-(--radix-select-trigger-width) overflow-hidden rounded-md border shadow-md"
        >
          <div
            className="flex items-center gap-2 border-b px-3"
            // Keep typing/arrow keys/backspace working normally in the input --
            // Radix Select listens for keydown on the content root for its own
            // type-ahead navigation, which would otherwise hijack these keys.
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="placeholder:text-muted-foreground flex h-10 w-full bg-transparent py-3 text-sm outline-none"
            />
          </div>

          <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
            <ChevronUp className="h-4 w-4" />
          </SelectPrimitive.ScrollUpButton>

          <SelectPrimitive.Viewport className="max-h-[min(320px,calc(var(--radix-select-content-available-height)-2.5rem))] overflow-y-auto p-1">
            {filteredUsers.length === 0 ? (
              <div className="text-muted-foreground py-6 text-center text-sm">
                No users found.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <SelectPrimitive.Item
                  key={user.id}
                  value={user.id}
                  className="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default flex-col items-start gap-0.5 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute top-1/2 right-2 flex size-3.5 -translate-y-1/2 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText asChild>
                    <span>{user.name || 'Unnamed User'}</span>
                  </SelectPrimitive.ItemText>
                  <span className="text-muted-foreground text-xs">
                    {user.email}
                  </span>
                </SelectPrimitive.Item>
              ))
            )}
          </SelectPrimitive.Viewport>

          <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
            <ChevronDown className="h-4 w-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
