import React, { useState } from 'react'
import { OpenAPIViewer } from './components/OpenAPIViewer'
import { ProjectManager } from './components/ProjectManager'
import { ProjectDialog } from './components/ProjectDialog'
import { APIProject } from './services/dbService'
import { useDatabase } from './hooks/useDatabase'

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400 text-lg">初始化中...</div>
          {dbError && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-300">{dbError.message}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {selectedProject ? (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedProject.name}
                </h1>
                {selectedProject.description && (
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {selectedProject.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleEditProject(selectedProject)}>编辑项目</button>
                <button onClick={() => setSelectedProject(null)}>返回列表</button>
              </div>
            </div>
            <OpenAPIViewer initialUrl={selectedProject.serverUrl} project={selectedProject} />
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
