import React, { useState } from 'react'
import { OpenAPIViewer } from './components/OpenAPIViewer'
import { ProjectManager } from './components/ProjectManager'
import { ProjectDialog } from './components/ProjectDialog'
import { APIProject } from './services/dbService'
import { useDatabase } from './hooks/useDatabase'
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import { Alert, AlertDescription } from './components/ui/alert'
import { ChevronLeft, Edit } from 'lucide-react'

const App: React.FC = () => {
  const { isInitialized, error: dbError } = useDatabase()
  const [selectedProject, setSelectedProject] = useState<APIProject | null>(null)
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<APIProject | undefined>(undefined)

  const handleSelectProject = (project: APIProject): void => {
    setSelectedProject(project)
  }

  const handleCreateProject = (): void => {
    setEditingProject(undefined)
    setShowProjectDialog(true)
  }

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {selectedProject ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedProject(null)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
                </div>
                {selectedProject.description && (
                  <p className="text-muted-foreground">{selectedProject.description}</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => handleEditProject(selectedProject)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                编辑项目
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <OpenAPIViewer initialUrl={selectedProject.serverUrl} project={selectedProject} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <ProjectManager
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
          />
        )}

        {showProjectDialog && (
          <ProjectDialog
            project={editingProject}
            onClose={() => setShowProjectDialog(false)}
            onSave={handleSaveProject}
          />
        )}
      </div>
    </div>
  )
}

export default App
