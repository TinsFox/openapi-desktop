import { createBrowserRouter } from 'react-router'
import { ProjectLayout } from '@/components/layouts/project-layout'
import { Project } from '@/pages/project'
import { ProjectList } from '@/pages/ProjectList'
import { RootLayout } from '@/components/layouts/root'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: ProjectList
      },
      {
        path: 'project-list',
        Component: ProjectList
      },
      {
        path: 'project/:projectId',
        Component: ProjectLayout,
        children: [
          {
            index: true,
            Component: Project
          }
        ]
      }
    ]
  }
])
