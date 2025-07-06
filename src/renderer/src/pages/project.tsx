import { useParams } from 'react-router'
import { useState, useEffect } from 'react'
import { APIProject } from '@/services/dbService'
import { Workspace } from '@/components/home/work-space'
import { ProjectDialog } from '@/components/ProjectDialog'
import { useDatabase } from '@/hooks/useDatabase'

export function Project() {
  const { projectId } = useParams()
  const { dbService } = useDatabase()
  const [project, setProject] = useState<APIProject | null>(null)
  const [showProjectDialog, setShowProjectDialog] = useState(false)

  useEffect(() => {
    if (projectId && dbService) {
      // 从数据库加载项目数据
      const id = parseInt(projectId, 10)
      if (!isNaN(id)) {
        dbService.getProject(id).then((project) => {
          setProject(project || null)
        })
      }
    }
  }, [projectId, dbService])

  const handleEditProject = (): void => {
    setShowProjectDialog(true)
  }

  const handleSaveProject = (updatedProject: APIProject): void => {
    setProject(updatedProject)
    setShowProjectDialog(false)
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-medium">项目不存在</h2>
          <p className="text-sm text-muted-foreground">请检查项目 ID 是否正确</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Workspace project={project} onEdit={handleEditProject} />
      {showProjectDialog && (
        <ProjectDialog
          project={project}
          onClose={() => setShowProjectDialog(false)}
          onSave={handleSaveProject}
        />
      )}
    </>
  )
}
