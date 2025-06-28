import React, { useState } from 'react'
import { APIProject, dbService } from '../services/dbService'
import { OpenAPIService } from '../services/openApiService'

interface ProjectDialogProps {
  project?: APIProject
  onClose: () => void
  onSave: (project: APIProject) => void
}

export const ProjectDialog: React.FC<ProjectDialogProps> = ({ project, onClose, onSave }) => {
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')
  const [importMethod, setImportMethod] = useState<'url' | 'file' | 'content'>('url')
  const [input, setInput] = useState(project?.serverUrl || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!name.trim()) {
      setError('请输入项目名称')
      return
    }

    if (!input.trim() && importMethod !== 'file') {
      setError('请输入 OpenAPI 规范内容')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await OpenAPIService.loadAndParseSpec(input)
      if (result.error) {
        setError(result.error.message)
        return
      }

      if (!result.spec) {
        setError('无法解析 OpenAPI 规范')
        return
      }

      const projectData = {
        name: name.trim(),
        description: description.trim() || undefined,
        spec: result.spec,
        serverUrl: importMethod === 'url' ? input : undefined
      }

      if (project?.id) {
        await dbService.updateProject(project.id, projectData)
        onSave({ ...project, ...projectData })
      } else {
        const newProject = await dbService.createProject(projectData)
        onSave(newProject)
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存项目失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()
      setInput(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取文件失败')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg">
        <div className="p-6">
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-4">
            {project ? '编辑项目' : '新建项目'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                项目名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-200"
                placeholder="输入项目名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                项目描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-200 resize-none"
                placeholder="输入项目描述（可选）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                OpenAPI 规范
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    importMethod === 'url'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setImportMethod('url')}
                >
                  URL
                </button>
                <button
                  type="button"
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    importMethod === 'file'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setImportMethod('file')}
                >
                  文件
                </button>
                <button
                  type="button"
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    importMethod === 'content'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setImportMethod('content')}
                >
                  内容
                </button>
              </div>

              {importMethod === 'url' && (
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-200"
                  placeholder="输入 OpenAPI/Swagger 文档 URL"
                />
              )}

              {importMethod === 'file' && (
                <input
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    file:dark:bg-blue-900/20 file:dark:text-blue-300
                    hover:file:bg-blue-100 hover:file:dark:bg-blue-900/30"
                />
              )}

              {importMethod === 'content' && (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono dark:bg-gray-700 dark:text-gray-200"
                  placeholder="粘贴 OpenAPI/Swagger 文档内容"
                />
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
                  isLoading
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                }`}
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
