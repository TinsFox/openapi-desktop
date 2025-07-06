import { useState } from 'react'
import { APIProject } from '@/services/dbService'
import { useDatabase } from '@/hooks/useDatabase'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { Workspace } from '@/components/home/work-space'
import { ProjectDialog } from '@/components/ProjectDialog'

export function Home() {
  const { isInitialized, error: dbError } = useDatabase()
  const [selectedProject, setSelectedProject] = useState<APIProject | null>(null)
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<APIProject | undefined>(undefined)

  const handleEditProject = (project: APIProject): void => {
    setEditingProject(project)
    setShowProjectDialog(true)
  }

  const handleSaveProject = (project: APIProject): void => {
    setSelectedProject(project)
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-[400px]">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground text-lg">初始化中...</div>
              {dbError && (
                <Alert variant="destructive">
                  <AlertDescription>{dbError.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className={`flex-1 transition-all mt-12`}>
        {selectedProject ? (
          <Workspace project={selectedProject} onEdit={() => handleEditProject(selectedProject)} />
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-medium">欢迎使用 OpenAPI Desktop</h2>
              <p className="text-sm text-muted-foreground">请从左侧边栏选择或创建一个项目</p>
            </div>
          </div>
        )}
      </main>

      {showProjectDialog && (
        <ProjectDialog
          project={editingProject}
          onClose={() => setShowProjectDialog(false)}
          onSave={handleSaveProject}
        />
      )}
    </div>
  )
}
