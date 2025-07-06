import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { APIProject, dbService } from '../services/dbService'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trash2, Clock, Search } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Link } from 'react-router'
import { ProjectDialog } from '@/components/ProjectDialog'
import { Input } from '@/components/ui/input'

export const ProjectList = () => {
  const [projects, setProjects] = useState<APIProject[]>([])
  const [filteredProjects, setFilteredProjects] = useState<APIProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects)
    } else {
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredProjects(filtered)
    }
  }, [searchQuery, projects])

  const loadProjects = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      const projects = await dbService.getAllProjects()
      setProjects(projects)
      setFilteredProjects(projects)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载项目失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (e: React.MouseEvent, id: number): Promise<void> => {
    e.preventDefault() // 防止触发 Link 的点击事件
    try {
      await dbService.deleteProject(id)
      await dbService.clearProjectHistory(id)
      await loadProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除项目失败')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-10 w-full" />
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
      <Alert variant="destructive" className="m-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3 p-4 container mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">API 项目</h2>
        <ProjectDialog />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索项目..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">还没有项目</p>
          <ProjectDialog>
            <Button variant="outline" className="flex items-center gap-2" size="sm">
              <Plus className="h-4 w-4" />
              创建第一个项目
            </Button>
          </ProjectDialog>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">没有找到匹配的项目</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link to={`/project/${project.id}`} key={project.id}>
              <Card className="transition-colors hover:bg-accent cursor-pointer border-border/40 h-full">
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

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            你确定要删除这个项目吗？此操作无法撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={(e) => e.preventDefault()}>
                            取消
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => project.id && handleDeleteProject(e, project.id)}
                          >
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
