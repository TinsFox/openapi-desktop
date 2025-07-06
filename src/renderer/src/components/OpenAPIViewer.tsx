import React, { useState, useRef, useEffect } from 'react'
import {
  OpenAPIService,
  OpenAPIError,
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
import { Loader2, Send } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface OpenAPIViewerProps {
  initialUrl?: string
  project?: APIProject
}

type ImportMethod = 'url' | 'file' | 'content'
type HTTPMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'

const MethodBadge: React.FC<{ method: HTTPMethod }> = ({ method }) => {
  const variants = {
    get: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    post: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    put: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    delete: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    patch: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    options: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    head: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
  }

  return (
    <Badge variant="outline" className={cn('uppercase', variants[method])}>
      {method}
    </Badge>
  )
}

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

const ParameterTable: React.FC<{ parameters?: OpenAPIV3.ParameterObject[] }> = ({ parameters }) => {
  if (!parameters || parameters.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">参数</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>位置</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>必填</TableHead>
            <TableHead>描述</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parameters.map((param, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{param.name}</TableCell>
              <TableCell>{param.in}</TableCell>
              <TableCell>{(param.schema as OpenAPIV3.SchemaObject)?.type || '-'}</TableCell>
              <TableCell>{param.required ? '是' : '否'}</TableCell>
              <TableCell>{param.description || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const SchemaViewer: React.FC<{ schema: OpenAPIV3.SchemaObject }> = ({ schema }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">Schema</h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="ml-1 text-xs">{isExpanded ? '收起' : '展开'}</span>
        </Button>
      </div>
      <ScrollArea className={cn('rounded-md bg-muted', !isExpanded && 'max-h-60')}>
        <pre className="p-4">
          <code>{JSON.stringify(schema, null, 2)}</code>
        </pre>
      </ScrollArea>
    </div>
  )
}

const ResponseViewer: React.FC<{
  responses: OpenAPIV3.ResponsesObject
}> = ({ responses }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">响应</h4>
      {Object.entries(responses).map(([status, response]) => {
        const resp = response as OpenAPIV3.ResponseObject
        return (
          <Card key={status}>
            <CardHeader className="py-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">状态码: {status}</span>
                {resp.description && (
                  <span className="text-sm text-muted-foreground">{resp.description}</span>
                )}
              </div>
            </CardHeader>
            {resp.content?.['application/json']?.schema && (
              <CardContent>
                <SchemaViewer
                  schema={resp.content['application/json'].schema as OpenAPIV3.SchemaObject}
                />
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

const isParameterObject = (
  param: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject
): param is OpenAPIV3.ParameterObject => {
  return !('$ref' in param)
}

const DebugPanel: React.FC<{
  spec: OpenAPISpec
  path: string
  method: HTTPMethod
  operation: OpenAPIOperation
  project?: APIProject
}> = ({ spec, path, method, operation, project }) => {
  const [serverUrl, setServerUrl] = useState(OpenAPIService.getDefaultServer(spec))
  const [params, setParams] = useState<Record<string, string>>({})
  const [headers, setHeaders] = useState<Record<string, string>>({})
  const [requestBody, setRequestBody] = useState('')
  const [response, setResponse] = useState<APIResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleParamChange = (name: string, value: string): void => {
    setParams((prev) => ({ ...prev, [name]: value }))
  }

  const handleHeaderChange = (name: string, value: string): void => {
    setHeaders((prev) => ({ ...prev, [name]: value }))
  }

  const handleSend = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    setResponse(null)

    try {
      const response = await OpenAPIService.sendRequest({
        serverUrl,
        path,
        method,
        params,
        headers,
        body: requestBody ? JSON.parse(requestBody) : undefined
      })
      setResponse(response)

      // 保存请求历史
      if (project?.id) {
        await dbService.addHistory({
          projectId: project.id,
          path,
          method,
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

  const pathAndQueryParams =
    operation.parameters
      ?.filter(isParameterObject)
      .filter((param) => param.in === 'path' || param.in === 'query') || []

  const headerParams =
    operation.parameters?.filter(isParameterObject).filter((param) => param.in === 'header') || []

  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <Label htmlFor="serverUrl">服务器 URL</Label>
          <Input
            id="serverUrl"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="输入服务器 URL"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="params" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="params" className="flex-1">
              参数
            </TabsTrigger>
            <TabsTrigger value="headers" className="flex-1">
              请求头
            </TabsTrigger>
            <TabsTrigger value="body" className="flex-1">
              请求体
            </TabsTrigger>
          </TabsList>

          <TabsContent value="params" className="space-y-4">
            {pathAndQueryParams.map((param) => (
              <div key={param.name} className="space-y-2">
                <Label htmlFor={param.name}>
                  {param.name}
                  {param.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={param.name}
                  value={params[param.name] || ''}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  placeholder={param.description}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="headers" className="space-y-4">
            {headerParams.map((param) => (
              <div key={param.name} className="space-y-2">
                <Label htmlFor={param.name}>
                  {param.name}
                  {param.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={param.name}
                  value={headers[param.name] || ''}
                  onChange={(e) => handleHeaderChange(param.name, e.target.value)}
                  placeholder={param.description}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="body">
            {operation.requestBody && (
              <div className="space-y-2">
                <Label htmlFor="requestBody">请求体</Label>
                <Textarea
                  id="requestBody"
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder="输入 JSON 格式的请求体"
                  className="font-mono h-40"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end mt-4">
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? (
              '发送中...'
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                发送请求
              </>
            )}
          </Button>
        </div>

        {response && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">响应</h4>
            <Card>
              <CardHeader className="py-2">
                <div className="flex items-center justify-between">
                  <Badge variant={response.status < 400 ? 'default' : 'destructive'}>
                    状态码: {response.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">耗时: {response.duration}ms</span>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-60 rounded-md bg-muted">
                  <pre className="p-4">
                    <code>{JSON.stringify(response.data, null, 2)}</code>
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const OpenAPIViewer: React.FC<OpenAPIViewerProps> = ({ initialUrl = '', project }) => {
  const [importMethod, setImportMethod] = useState<ImportMethod>('url')
  const [input, setInput] = useState(initialUrl)
  const [spec, setSpec] = useState<OpenAPISpec | null>(null)
  console.log('spec: ', spec)
  const [error, setError] = useState<OpenAPIError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState<{
    path: string
    method: HTTPMethod
    operation: OpenAPIOperation
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 初始化时，如果项目有规范内容，直接加载
  useEffect(() => {
    if (project?.spec) {
      setSpec(project.spec)
    } else if (initialUrl) {
      handleLoadSpec()
    }
  }, [project, initialUrl])

  const handleLoadSpec = async (): Promise<void> => {
    if (!input.trim() && importMethod !== 'file') {
      setError({ message: '请输入 OpenAPI 规范内容' })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await OpenAPIService.loadAndParseSpec(input)
      if (result.error) {
        setError(result.error)
      } else if (result.spec) {
        setSpec(result.spec)
        setSelectedEndpoint(null)

        // 如果是在项目中，更新项目的规范内容
        if (project?.id) {
          await dbService.updateProject(project.id, {
            spec: result.spec,
            serverUrl: importMethod === 'url' ? input : undefined
          })
        }
      }
    } catch (err) {
      setError({
        message: '加载 OpenAPI 规范失败',
        details: err instanceof Error ? err.message : '未知错误'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const content = await file.text()
      const result = await OpenAPIService.loadAndParseSpec(content)
      if (result.error) {
        setError(result.error)
      } else if (result.spec) {
        setSpec(result.spec)
        setSelectedEndpoint(null)
        setInput(content)

        // 如果是在项目中，更新项目的规范内容
        if (project?.id) {
          await dbService.updateProject(project.id, {
            spec: result.spec,
            serverUrl: undefined
          })
        }
      }
    } catch (err) {
      setError({
        message: '读取文件失败',
        details: err instanceof Error ? err.message : '未知错误'
      })
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleChooseFile = (): void => {
    fileInputRef.current?.click()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 左侧面板 */}
      <div className="lg:col-span-4 xl:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex gap-2 mb-4">
            <button
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${importMethod === 'url'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              onClick={() => setImportMethod('url')}
            >
              URL
            </button>
            <button
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${importMethod === 'file'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              onClick={() => setImportMethod('file')}
            >
              文件
            </button>
            <button
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${importMethod === 'content'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              onClick={() => setImportMethod('content')}
            >
              内容
            </button>
          </div>

          <div className="space-y-4">
            {importMethod === 'url' && (
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入 OpenAPI/Swagger 文档 URL"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            )}
            {importMethod === 'file' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={handleChooseFile}
                  className="w-full px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  选择 OpenAPI/Swagger 文件
                </button>
              </>
            )}
            {importMethod === 'content' && (
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="粘贴 OpenAPI/Swagger 文档内容"
                className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
              />
            )}

            <button
              onClick={handleLoadSpec}
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${isLoading
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                }`}
            >
              {isLoading ? '导入中...' : '导入'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                {error.message}
              </h3>
              {error.details && (
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error.details}</p>
              )}
            </div>
          )}

          {spec && (
            <div className="mt-6">
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {spec.info.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  版本: {spec.info.version}
                </p>
                {spec.info.description && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {spec.info.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                {Object.entries(spec.paths).map(([path, pathItem]) => {
                  const methods = Object.entries(pathItem as OpenAPIV3.PathItemObject).filter(
                    ([method]) =>
                      ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)
                  )

                  return methods.map(([method, operation]) => (
                    <EndpointCard
                      key={`${path}-${method}`}
                      path={path}
                      method={method as HTTPMethod}
                      operation={operation as OpenAPIOperation}
                      onClick={() =>
                        setSelectedEndpoint({
                          path,
                          method: method as HTTPMethod,
                          operation: operation as OpenAPIOperation
                        })
                      }
                    />
                  ))
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右侧面板 */}
      <div className="lg:col-span-8 xl:col-span-9">
        {selectedEndpoint && spec ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <MethodBadge method={selectedEndpoint.method} />
              <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                {OpenAPIService.getOperationSummary(selectedEndpoint.operation)}
              </h2>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg font-mono text-sm">
              {selectedEndpoint.path}
            </div>

            {selectedEndpoint.operation.description && (
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {selectedEndpoint.operation.description}
              </p>
            )}

            <ParameterTable
              parameters={selectedEndpoint.operation.parameters as OpenAPIV3.ParameterObject[]}
            />

            {selectedEndpoint.operation.requestBody && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  请求体
                </h4>
                <SchemaViewer
                  schema={
                    (selectedEndpoint.operation.requestBody as OpenAPIV3.RequestBodyObject)
                      .content?.['application/json']?.schema as OpenAPIV3.SchemaObject
                  }
                />
              </div>
            )}

            <ResponseViewer responses={selectedEndpoint.operation.responses} />

            {/* 添加调试面板 */}
            <DebugPanel
              spec={spec}
              path={selectedEndpoint.path}
              method={selectedEndpoint.method}
              operation={selectedEndpoint.operation}
              project={project}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">选择左侧的接口以查看详细信息</p>
          </div>
        )}
      </div>
    </div>
  )
}
