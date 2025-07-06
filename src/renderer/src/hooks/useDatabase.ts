import { useState, useEffect } from 'react'
import { dbService } from '../services/dbService'

interface DatabaseHookResult {
  isInitialized: boolean
  error: Error | null
  dbService: typeof dbService
}

export function useDatabase(): DatabaseHookResult {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const initDb = async (): Promise<void> => {
      try {
        await dbService.init()
        setIsInitialized(true)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('数据库初始化失败'))
      }
    }

    initDb()
  }, [])

  return { isInitialized, error, dbService }
}
