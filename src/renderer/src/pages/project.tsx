import { useParams } from 'react-router'
import { useState, useEffect } from 'react'
import { APIProject } from '@/services/dbService'

import { useDatabase } from '@/hooks/useDatabase'
import { OpenAPIViewer } from '@/components/OpenAPIViewer'

export function Project() {
  const { projectId } = useParams()
  const { dbService } = useDatabase()
  const [project, setProject] = useState<APIProject | null>(null)

  useEffect(() => {
    if (projectId && dbService) {
      const id = parseInt(projectId, 10)
      if (!isNaN(id)) {
        dbService.getProject(id).then((project) => {
          setProject(project || null)
        })
      }
    }
  }, [projectId, dbService])

  if (!project) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-medium">项目不存在</h2>
          <p className="text-sm text-muted-foreground">请检查项目 ID 是否正确</p>
        </div>
      </div>
    )
  }

  return <OpenAPIViewer initialUrl={project.serverUrl} project={project} />
}
