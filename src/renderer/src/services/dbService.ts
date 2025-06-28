import { OpenAPISpec } from './openApiService'

export interface APIProject {
  id?: number
  name: string
  description?: string
  spec: OpenAPISpec
  serverUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface APIHistory {
  id?: number
  projectId: number
  path: string
  method: string
  params: Record<string, string>
  headers: Record<string, string>
  body?: string
  response?: {
    status: number
    statusText: string
    headers: Record<string, string>
    data: any
    duration: number
  }
  createdAt: Date
}

class DBService {
  private readonly DB_NAME = 'openapi-desktop'
  private readonly DB_VERSION = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建项目存储
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', {
            keyPath: 'id',
            autoIncrement: true
          })
          projectStore.createIndex('name', 'name', { unique: false })
          projectStore.createIndex('createdAt', 'createdAt', { unique: false })
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        // 创建历史记录存储
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', {
            keyPath: 'id',
            autoIncrement: true
          })
          historyStore.createIndex('projectId', 'projectId', { unique: false })
          historyStore.createIndex('createdAt', 'createdAt', { unique: false })
          historyStore.createIndex('path', 'path', { unique: false })
          historyStore.createIndex('method', 'method', { unique: false })
        }
      }
    })
  }

  private getStore(
    name: 'projects' | 'history',
    mode: IDBTransactionMode = 'readonly'
  ): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    const transaction = this.db.transaction(name, mode)
    return transaction.objectStore(name)
  }

  // 项目相关方法
  async createProject(
    project: Omit<APIProject, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<APIProject> {
    const now = new Date()
    const newProject: APIProject = {
      ...project,
      createdAt: now,
      updatedAt: now
    }

    return new Promise((resolve, reject) => {
      const store = this.getStore('projects', 'readwrite')
      const request = store.add(newProject)

      request.onsuccess = () => {
        resolve({ ...newProject, id: request.result as number })
      }

      request.onerror = () => reject(request.error)
    })
  }

  async updateProject(id: number, project: Partial<APIProject>): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('projects', 'readwrite')
      const request = store.get(id)

      request.onsuccess = () => {
        const existingProject = request.result
        if (!existingProject) {
          reject(new Error('Project not found'))
          return
        }

        const updatedProject = {
          ...existingProject,
          ...project,
          updatedAt: new Date()
        }

        const updateRequest = store.put(updatedProject)
        updateRequest.onsuccess = () => resolve()
        updateRequest.onerror = () => reject(updateRequest.error)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async getProject(id: number): Promise<APIProject | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('projects')
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllProjects(): Promise<APIProject[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('projects')
      const request = store.index('updatedAt').getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteProject(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('projects', 'readwrite')
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // 历史记录相关方法
  async addHistory(history: Omit<APIHistory, 'id' | 'createdAt'>): Promise<APIHistory> {
    const newHistory: APIHistory = {
      ...history,
      createdAt: new Date()
    }

    return new Promise((resolve, reject) => {
      const store = this.getStore('history', 'readwrite')
      const request = store.add(newHistory)

      request.onsuccess = () => {
        resolve({ ...newHistory, id: request.result as number })
      }

      request.onerror = () => reject(request.error)
    })
  }

  async getProjectHistory(projectId: number): Promise<APIHistory[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('history')
      const index = store.index('projectId')
      const request = index.getAll(projectId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async clearProjectHistory(projectId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('history', 'readwrite')
      const index = store.index('projectId')
      const request = index.openKeyCursor(IDBKeyRange.only(projectId))

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          store.delete(cursor.primaryKey)
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => reject(request.error)
    })
  }
}

export const dbService = new DBService()
