import { atom } from 'jotai'
import { APIProject } from '@/services/dbService'
import { OpenAPISpec, OpenAPIOperation } from '@/services/openApiService'
import { HTTPMethod } from '@/components/OpenAPIViewer'

export const specAtom = atom<OpenAPISpec | null>(null)
export const projectAtom = atom<APIProject | null>(null)

export const selectedEndpointAtom = atom<{
  path: string
  method: HTTPMethod
  operation: OpenAPIOperation
} | null>(null)
