import React, { useState, useEffect } from 'react'
import {
  OpenAPIService,
  OpenAPISpec,
  OpenAPIOperation,
  APIResponse
} from '../services/openApiService'
import { OpenAPIV3 } from 'openapi-types'
import { APIProject, dbService } from '../services/dbService'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Send, Play } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { selectedEndpointAtom, specAtom } from '@/atoms/spec-atom'
import { useAtom } from 'jotai'
import { MethodBadge } from './MethodBadge'
import { HTTPMethod } from '@/types/http'
import { Separator } from '@/components/ui/separator'

interface OpenAPIViewerProps {
  initialUrl?: string
  project?: APIProject
}

export type ImportMethod = 'url' | 'file' | 'content'

const EndpointCard: React.FC<{
  path: string
  method: HTTPMethod
  operation: OpenAPIOperation
  onClick: () => void
}> = ({ path, method, operation, onClick }) => {
  return (
    <Card className="hover:border-primary cursor-pointer transition-colors" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <MethodBadge method={method} />
          <code className="text-sm text-muted-foreground">{path}</code>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold">{OpenAPIService.getOperationSummary(operation)}</h3>
        {operation.description && (
          <p className="mt-1 text-sm text-muted-foreground">{operation.description}</p>
        )}
      </CardContent>
    </Card>
  )
}

const ParameterInput: React.FC<{
  parameter: OpenAPIV3.ParameterObject
  value: string
  onChange: (value: string) => void
}> = ({ parameter, value, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">{parameter.name}</Label>
        {parameter.required && (
          <Badge variant="destructive" className="text-xs">
            必填
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {parameter.in}
        </Badge>
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={parameter.description || `输入 ${parameter.name}`}
        className="font-mono text-sm"
      />
      {parameter.description && (
        <p className="text-xs text-muted-foreground">{parameter.description}</p>
      )}
    </div>
  )
}

const RequestSection: React.FC<{
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-lg">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="font-medium text-sm">{title}</h4>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
      {isOpen && <div className="border-t border-border p-4 space-y-4">{children}</div>}
    </div>
  )
}

const ResponseDisplay: React.FC<{ response: APIResponse }> = ({ response }) => {
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600'
    if (status >= 400 && status < 500) return 'text-orange-600'
    if (status >= 500) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={cn('font-mono', getStatusColor(response.status))}>
            {response.status} {response.statusText}
          </Badge>
          <span className="text-sm text-muted-foreground">耗时: {response.duration}ms</span>
        </div>
      </div>

      <Tabs defaultValue="body" className="w-full">
        <TabsList>
          <TabsTrigger value="body">响应体</TabsTrigger>
          <TabsTrigger value="headers">响应头</TabsTrigger>
        </TabsList>

        <TabsContent value="body">
          <ScrollArea className="h-80 w-full rounded-md border bg-muted/30">
            <pre className="p-4 text-sm">
              <code>{JSON.stringify(response.data, null, 2)}</code>
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="headers">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>值</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(response.headers || {}).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell className="font-mono text-sm">{value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const isParameterObject = (
  param: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject
): param is OpenAPIV3.ParameterObject => {
  return !('$ref' in param)
}

export const OpenAPIViewer: React.FC<OpenAPIViewerProps> = ({ project }) => {
  const [spec, setSpec] = useAtom(specAtom)
  const [selectedEndpoint, setSelectedEndpoint] = useAtom(selectedEndpointAtom)

  // 测试相关状态
  const [serverUrl, setServerUrl] = useState('')
  const [params, setParams] = useState<Record<string, string>>({})
  const [headers, setHeaders] = useState<Record<string, string>>({})
  const [requestBody, setRequestBody] = useState('')
  const [response, setResponse] = useState<APIResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 初始化服务器 URL
  useEffect(() => {
    if (spec && !serverUrl) {
      setServerUrl(OpenAPIService.getDefaultServer(spec))
    }
  }, [spec, serverUrl])

  const handleParamChange = (name: string, value: string): void => {
    setParams((prev) => ({ ...prev, [name]: value }))
  }

  const handleHeaderChange = (name: string, value: string): void => {
    setHeaders((prev) => ({ ...prev, [name]: value }))
  }

  const handleSendRequest = async (): Promise<void> => {
    if (!selectedEndpoint) return

    setIsLoading(true)
    setError(null)
    setResponse(null)

    try {
      const response = await OpenAPIService.sendRequest({
        url: serverUrl,
        method: selectedEndpoint.method.toLowerCase(),
        headers,
        data: requestBody ? JSON.parse(requestBody) : undefined
      })
      setResponse(response)

      // 保存请求历史
      if (project?.id) {
        await dbService.addHistory({
          projectId: project.id,
          path: selectedEndpoint.path,
          method: selectedEndpoint.method,
          params,
          headers,
          body: requestBody,
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
            duration: response.duration
          }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败')
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedEndpoint) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="text-4xl">📝</div>
          <h3 className="text-lg font-medium">选择一个接口</h3>
          <p className="text-muted-foreground">从左侧列表中选择一个接口来查看详情和进行测试</p>
        </div>
      </div>
    )
  }

  const pathParams =
    selectedEndpoint.operation.parameters
      ?.filter(isParameterObject)
      .filter((param) => param.in === 'path') || []

  const queryParams =
    selectedEndpoint.operation.parameters
      ?.filter(isParameterObject)
      .filter((param) => param.in === 'query') || []

  const headerParams =
    selectedEndpoint.operation.parameters
      ?.filter(isParameterObject)
      .filter((param) => param.in === 'header') || []

  return (
    <div className="h-full flex flex-col">
      {/* 接口基本信息 */}
      <div className="flex-none border-b bg-background p-6">
        <div className="flex items-center gap-3 mb-4">
          <MethodBadge method={selectedEndpoint.method} />
          <h1 className="text-xl font-semibold">
            {OpenAPIService.getOperationSummary(selectedEndpoint.operation)}
          </h1>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Input
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="服务器地址"
            className="flex-1 font-mono"
          />
          <code className="px-3 py-2 bg-muted rounded text-sm">{selectedEndpoint.path}</code>
          <Button onClick={handleSendRequest} disabled={isLoading} className="min-w-24">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                发送
              </>
            )}
          </Button>
        </div>

        {selectedEndpoint.operation.description && (
          <p className="text-muted-foreground">{selectedEndpoint.operation.description}</p>
        )}
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-hidden">
        {/* 左侧：请求配置 */}
        <div className="space-y-4 overflow-auto">
          <h2 className="text-lg font-semibold">请求配置</h2>

          {/* Path 参数 */}
          {pathParams.length > 0 && (
            <RequestSection title="Path 参数">
              {pathParams.map((param) => (
                <ParameterInput
                  key={param.name}
                  parameter={param}
                  value={params[param.name] || ''}
                  onChange={(value) => handleParamChange(param.name, value)}
                />
              ))}
            </RequestSection>
          )}

          {/* Query 参数 */}
          {queryParams.length > 0 && (
            <RequestSection title="Query 参数">
              {queryParams.map((param) => (
                <ParameterInput
                  key={param.name}
                  parameter={param}
                  value={params[param.name] || ''}
                  onChange={(value) => handleParamChange(param.name, value)}
                />
              ))}
            </RequestSection>
          )}

          {/* Header 参数 */}
          {headerParams.length > 0 && (
            <RequestSection title="Header 参数" defaultOpen={false}>
              {headerParams.map((param) => (
                <ParameterInput
                  key={param.name}
                  parameter={param}
                  value={headers[param.name] || ''}
                  onChange={(value) => handleHeaderChange(param.name, value)}
                />
              ))}
            </RequestSection>
          )}

          {/* 请求体 */}
          {selectedEndpoint.operation.requestBody && (
            <RequestSection title="请求体">
              <div className="space-y-2">
                <Label className="text-sm font-medium">JSON 格式</Label>
                <Textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder="输入 JSON 格式的请求体"
                  className="font-mono text-sm h-40"
                />
              </div>
            </RequestSection>
          )}
        </div>

        {/* 右侧：响应结果 */}
        <div className="space-y-4 overflow-auto">
          <h2 className="text-lg font-semibold">响应结果</h2>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {response ? (
            <ResponseDisplay response={response} />
          ) : (
            <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
              <div className="text-center space-y-2">
                <div className="text-2xl">⚡</div>
                <p className="text-muted-foreground">点击发送按钮来测试接口</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface SpecListProps {
  spec: OpenAPISpec
}

export function SpecList({ spec }: SpecListProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useAtom(selectedEndpointAtom)

  return (
    <div className="space-y-2">
      {spec &&
        Object.entries(spec.paths).map(([path, pathItem]) => {
          const methods = Object.entries(pathItem as OpenAPIV3.PathItemObject).filter(([method]) =>
            ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)
          )

          return methods.map(([method, operation]) => (
            <EndpointCard
              key={`${path}-${method}`}
              path={path}
              method={method as HTTPMethod}
              operation={operation as OpenAPIOperation}
              onClick={() => {
                if (selectedEndpoint?.path === path && selectedEndpoint?.method === method) {
                  setSelectedEndpoint(null)
                } else {
                  setSelectedEndpoint({
                    path,
                    method: method as HTTPMethod,
                    operation: operation as OpenAPIOperation
                  })
                }
              }}
            />
          ))
        })}
    </div>
  )
}
