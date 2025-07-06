import React from 'react'
import { router } from './router'
import { RouterProvider } from 'react-router'
import { useDatabase } from './hooks/useDatabase'
import { Alert, AlertDescription } from './components/ui/alert'

const App: React.FC = () => {
  const { isInitialized, error } = useDatabase()

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>数据库初始化失败: {error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-medium">正在初始化...</h2>
          <p className="text-sm text-muted-foreground">请稍候</p>
        </div>
      </div>
    )
  }

  return <RouterProvider router={router} />
}

export default App
