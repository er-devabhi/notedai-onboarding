'use client'

import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/layout/theme-toggle'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/setup': 'Setup Wizard',
  '/organizations': 'Organizations',
  '/outlets': 'Outlets',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) {
    return pageTitles[pathname]
  }

  if (pathname === '/organizations/new') {
    return 'New Organization'
  }

  if (pathname.startsWith('/organizations/')) {
    return 'Organization Details'
  }

  if (pathname === '/outlets/new') {
    return 'New Outlet'
  }

  if (pathname.startsWith('/outlets/')) {
    return 'Outlet Setup'
  }

  return 'Admin'
}

export function Header() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="flex h-16 items-center border-b bg-background px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
