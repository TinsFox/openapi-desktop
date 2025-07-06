import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { APIProject, dbService } from '../services/dbService'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trash2, Clock, Calendar } from 'lucide-react'
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                  </div>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">API 项目</h2>
        <Button onClick={onCreateProject} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新建项目
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-4 text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground">还没有项目</p>
              <Button
                variant="outline"
                onClick={onCreateProject}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                创建第一个项目
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="transition-colors hover:border-primary cursor-pointer"
              onClick={() => onSelectProject(project)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    {project.description && (
                      <p className="text-muted-foreground text-sm">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>更新于 {new Date(project.updatedAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>创建于 {new Date(project.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      project.id && setProjectToDelete(project.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
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
