import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { APIProject, dbService } from '../services/dbService'

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

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
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

  const handleDeleteProject = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!confirm('确定要删除这个项目吗？')) return

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
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">API 项目</h2>
        <Button onClick={onCreateProject}>新建项目</Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">还没有项目</p>
          <button
            onClick={onCreateProject}
            className="mt-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            创建第一个项目
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {project.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>更新于 {new Date(project.updatedAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>创建于 {new Date(project.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => project.id && handleDeleteProject(project.id, e)}
                  className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
