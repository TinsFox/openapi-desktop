import React, { useState } from 'react'
import { APIProject, dbService } from '../services/dbService'
import { OpenAPIService } from '../services/openApiService'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FileText, Globe, Code, Loader2 } from 'lucide-react'

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
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{project ? '编辑项目' : '新建项目'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">项目名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入项目名称"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">项目描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入项目描述（可选）"
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>OpenAPI 规范</Label>
            <ToggleGroup
              type="single"
              value={importMethod}
              onValueChange={(value) =>
                value && setImportMethod(value as 'url' | 'file' | 'content')
              }
              className="justify-start"
            >
              <ToggleGroupItem value="url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                URL
              </ToggleGroupItem>
              <ToggleGroupItem value="file" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                文件
              </ToggleGroupItem>
              <ToggleGroupItem value="content" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                内容
              </ToggleGroupItem>
            </ToggleGroup>

            {importMethod === 'url' && (
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入 OpenAPI/Swagger 文档 URL"
              />
            )}

            {importMethod === 'file' && (
              <Input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
            )}

            {importMethod === 'content' && (
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="粘贴 OpenAPI/Swagger 文档内容"
                className="font-mono h-40"
              />
            )}
          </div>

          {error && <Alert variant="destructive">{error}</Alert>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
