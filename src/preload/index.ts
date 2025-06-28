import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 创建版本 API
const versionsApi = {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
}

// 创建主 API 对象
const api = {
  versions: versionsApi
}

// 在主世界中暴露 API
try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)
  console.log('APIs exposed successfully')
} catch (error) {
  console.error('Failed to expose APIs:', error)
}

// 导出类型
export type VersionsApi = typeof versionsApi
export type Api = typeof api
