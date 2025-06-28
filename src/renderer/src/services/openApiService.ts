import { OpenAPIV3 } from 'openapi-types'
import yaml from 'js-yaml'

export type OpenAPISpec = OpenAPIV3.Document
export type OpenAPIPath = OpenAPIV3.PathItemObject
export type OpenAPIOperation = OpenAPIV3.OperationObject
export type OpenAPIParameter = OpenAPIV3.ParameterObject
export type OpenAPIRequestBody = OpenAPIV3.RequestBodyObject
export type OpenAPIResponse = OpenAPIV3.ResponseObject
export type OpenAPISchema = OpenAPIV3.SchemaObject

export interface OpenAPIError {
  message: string
  details?: string
}

export interface OpenAPIParseResult {
  spec?: OpenAPISpec
  error?: OpenAPIError
}

export interface APIResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  data: any
  duration: number
}

export class OpenAPIService {
  static async loadAndParseSpec(input: string): Promise<OpenAPIParseResult> {
    try {
      let content: string = input

      // 如果是 URL，尝试获取内容
      if (input.startsWith('http://') || input.startsWith('https://')) {
        const response = await fetch(input)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        content = await response.text()
      }

      // 尝试解析 JSON
      try {
        return { spec: JSON.parse(content) }
      } catch (jsonError) {
        // 如果 JSON 解析失败，尝试解析 YAML
        try {
          return { spec: yaml.load(content) as OpenAPISpec }
        } catch (yamlError) {
          throw new Error('无法解析规范文件，请确保是有效的 JSON 或 YAML 格式')
        }
      }
    } catch (error) {
      return {
        error: {
          message: '加载 OpenAPI 规范失败',
          details: error instanceof Error ? error.message : '未知错误'
        }
      }
    }
  }

  static getOperationId(path: string, method: string, operation: OpenAPIOperation): string {
    return operation.operationId || `${method.toUpperCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`
  }

  static getOperationSummary(operation: OpenAPIOperation): string {
    return operation.summary || operation.description || '未命名操作'
  }

  static getResponseExample(response: OpenAPIResponse): any {
    if (!response.content) return null

    const mediaType = response.content['application/json']
    if (!mediaType || !mediaType.example) return null

    return mediaType.example
  }

  static getRequestExample(requestBody: OpenAPIRequestBody): any {
    if (!requestBody.content) return null

    const mediaType = requestBody.content['application/json']
    if (!mediaType || !mediaType.example) return null

    return mediaType.example
  }

  static formatPath(path: string, parameters?: OpenAPIParameter[]): string {
    if (!parameters) return path

    let formattedPath = path
    const pathParams = parameters.filter((p) => p.in === 'path')

    pathParams.forEach((param) => {
      formattedPath = formattedPath.replace(
        `{${param.name}}`,
        `<span class="text-green-500">{${param.name}}</span>`
      )
    })

    return formattedPath
  }

  static async sendRequest(
    url: string,
    method: string,
    headers: Record<string, string> = {},
    data?: any,
    params?: Record<string, string>
  ): Promise<APIResponse> {
    const startTime = Date.now()

    try {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
      const fullUrl = url + queryString

      const response = await fetch(fullUrl, {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined
      })

      const responseData = await response.json().catch(() => null)
      const duration = Date.now() - startTime

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData,
        duration
      }
    } catch (error) {
      const duration = Date.now() - startTime
      throw {
        status: 0,
        statusText: error instanceof Error ? error.message : '请求失败',
        headers: {},
        data: null,
        duration
      }
    }
  }

  static buildUrl(basePath: string = '', path: string, serverUrl?: string): string {
    let baseUrl = serverUrl || ''
    if (!baseUrl && path.startsWith('/')) {
      baseUrl = window.location.origin
    }

    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
    const cleanPath = path.startsWith('/') ? path : `/${path}`

    return `${baseUrl}${cleanBasePath}${cleanPath}`
  }

  static getDefaultServer(spec: OpenAPISpec): string {
    if (!spec.servers || spec.servers.length === 0) {
      return window.location.origin
    }
    return spec.servers[0].url
  }
}
