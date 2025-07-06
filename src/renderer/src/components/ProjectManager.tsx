import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { APIProject, dbService } from '../services/dbService'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trash2, Clock } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

interface ProjectManagerProps {
  onSelectProject: (project: APIProject) => void
  onCreateProject: () => void
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  onSelectProject,
  onCreateProject
}) => {
  const [projects, setProjects] = useState<APIProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      const projects = await dbService.getAllProjects()
      setProjects(projects)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载项目失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (id: number): Promise<void> => {
    try {
      await dbService.deleteProject(id)
      await dbService.clearProjectHistory(id)
      setProjectToDelete(null)
      await loadProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除项目失败')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Card key={i} className="border-border/40">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium">API 项目</h2>
        <Button size="sm" variant="outline" onClick={onCreateProject} className="h-8">
          <Plus className="h-4 w-4 mr-1" />
          新建项目
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">还没有项目</p>
          <Button
            variant="outline"
            onClick={onCreateProject}
            className="flex items-center gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            创建第一个项目
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="transition-colors hover:bg-accent cursor-pointer border-border/40"
              onClick={() => onSelectProject(project)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground mt-1.5">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      project.id && setProjectToDelete(project.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={projectToDelete !== null} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              你确定要删除这个项目吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => projectToDelete && handleDeleteProject(projectToDelete)}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
