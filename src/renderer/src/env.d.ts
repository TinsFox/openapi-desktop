/// <reference types="vite/client" />

import type { Api } from '../../../preload'
import type { ElectronAPI } from '@electron-toolkit/preload'

interface ProcessAPI {
  platform: string
  versions: {
    node: string
    chrome: string
    electron: string
  }
}

interface Window {
  electron: ElectronAPI
  api: Api
  process: ProcessAPI
}
