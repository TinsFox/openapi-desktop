import React, { useState, useEffect } from 'react'
import { useLocation, useNavigationType, useMatches } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Button } from './ui/button'
import { ChevronUp, ChevronDown } from 'lucide-react'

export const RouterIndicator: React.FC = () => {
  const location = useLocation()
  const navigationType = useNavigationType()
  const matches = useMatches()
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('routerIndicatorExpanded')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('routerIndicatorExpanded', JSON.stringify(isExpanded))
  }, [isExpanded])

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        onClick={() => setIsExpanded(true)}
      >
        <ChevronUp className="h-4 w-4 mr-2" />
        显示路由信息
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center">
            路由信息
            <Badge variant="outline" className="ml-2">
              {navigationType}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(false)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3">
        <ScrollArea className="h-[200px]">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">当前路径</h3>
              <p className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
                {location.pathname}
              </p>
            </div>

            {location.search && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">查询参数</h3>
                <p className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
                  {location.search}
                </p>
              </div>
            )}

            {location.hash && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Hash</h3>
                <p className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
                  {location.hash}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-medium">匹配的路由</h3>
              <div className="space-y-2">
                {matches.map((match, index) => (
                  <div key={index} className="text-xs bg-muted p-2 rounded">
                    <div className="font-medium">{match.pathname || '/'}</div>
                    {match.params && Object.keys(match.params).length > 0 && (
                      <div className="mt-1 text-muted-foreground">
                        参数: {JSON.stringify(match.params)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {location.state && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">路由状态</h3>
                <pre className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
                  {JSON.stringify(location.state, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
