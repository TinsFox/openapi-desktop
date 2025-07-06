import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { APIProject } from '@/services/dbService'
import { RouterIndicator } from '@/components/router-indicator'
import { TailwindIndicator } from '../tailwind-indicator'
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
import { ProjectManager } from '@/components/ProjectManager'
import { Separator } from '@/components/ui/separator'
import { GalleryVerticalEnd } from 'lucide-react'

function MainContent() {
  const [selectedProject, setSelectedProject] = useState<APIProject | null>(null)
  const location = useLocation()

  const handleSelectProject = (project: APIProject): void => {
    setSelectedProject(project)
  }

  const handleCreateProject = (): void => {
    // 这里可以通过路由导航到创建项目页面
  }

  // 根据路由路径获取当前页面标题
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return '欢迎'
      case '/home':
        return '主页'
      case '/project':
        return selectedProject?.name || 'API 项目'
      default:
        return 'OpenAPI Desktop'
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#">
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
        <SidebarContent className="h-full px-2">
          <ProjectManager
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
          />
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <div className="text-sm font-medium">{getPageTitle()}</div>
        </header>

        <div className="flex-1 p-4">
          <Outlet />
        </div>

        <RouterIndicator />
        <TailwindIndicator />
      </SidebarInset>
    </div>
  )
}

export function MainLayout() {
  return (
    <SidebarProvider>
      <MainContent />
    </SidebarProvider>
  )
}
