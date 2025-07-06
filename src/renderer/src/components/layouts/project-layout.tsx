import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { APIProject } from '@/services/dbService'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar'

import { Separator } from '@/components/ui/separator'
import { GalleryVerticalEnd } from 'lucide-react'
import { SpecList } from '../OpenAPIViewer'
import { specAtom } from '@/atoms/spec-atom'
import { useAtom } from 'jotai'

export function ProjectLayout() {
  const [selectedProject] = useState<APIProject | null>(null)
  const location = useLocation()
  const [spec] = useAtom(specAtom)

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/home':
        return '主页'
      case '/project':
        return selectedProject?.name || 'API 项目'
      default:
        return 'OpenAPI Desktop'
    }
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="/">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <GalleryVerticalEnd className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">Documentation</span>
                    <span className="">v1.0.0</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="h-full px-2">{spec && <SpecList spec={spec} />}</SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <div className="text-sm font-medium">{getPageTitle()}</div>
        </header>

        <div className="flex-1 p-4 w-full">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
