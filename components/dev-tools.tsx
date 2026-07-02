'use client'

import { useEffect, useState } from 'react'

export function DevTools() {
  const [Agentation, setAgentation] = useState<React.ComponentType | null>(
    null,
  )

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@locator/runtime').then(({ default: setupLocatorUI }) => {
        setupLocatorUI()
      })
      import('agentation').then((mod) => {
        setAgentation(() => mod.Agentation)
      })
    }
  }, [])

  return Agentation ? <Agentation /> : null
}
