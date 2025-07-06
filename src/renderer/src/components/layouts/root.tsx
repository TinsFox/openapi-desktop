import { Outlet } from 'react-router'
import { RouterIndicator } from '@/components/router-indicator'
import { TailwindIndicator } from '@/components/tailwind-indicator'

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="w-full">
        <Outlet />
        <RouterIndicator />
        <TailwindIndicator />
      </div>
    </div>
  )
}
