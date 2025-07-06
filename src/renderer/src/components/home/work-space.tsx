import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Edit } from 'lucide-react'
import { OpenAPIViewer } from '@/components/OpenAPIViewer'
import { APIProject } from '@/services/dbService'

interface WorkspaceProps {
  project: APIProject
  onEdit: () => void
}

export const Workspace: React.FC<WorkspaceProps> = ({ project, onEdit }) => {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-medium">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onEdit} className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          编辑项目
        </Button>
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <OpenAPIViewer initialUrl={project.serverUrl} project={project} />
        </CardContent>
      </Card>
    </div>
  )
}
