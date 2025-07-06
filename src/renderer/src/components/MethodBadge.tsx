import { cn } from '@/lib/utils'
import { HTTPMethod } from '@/types/http'
import { Badge } from './ui/badge'

export const MethodBadge: React.FC<{ method: HTTPMethod }> = ({ method }) => {
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
