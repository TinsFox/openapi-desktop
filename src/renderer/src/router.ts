import { createBrowserRouter, RouteObject } from 'react-router'
import { MainLayout } from './components/layouts/main-layout'
import { Welcome } from './pages/welcome'
import { Project } from './pages/project'

const routes: RouteObject[] = [
  {
    path: '/',
    Component: MainLayout,
    children: [
      {
        index: true,
        Component: Welcome
      },
      {
        path: 'projects/:projectId',
        Component: Project
      }
    ]
  }
]

export const router = createBrowserRouter(routes)
