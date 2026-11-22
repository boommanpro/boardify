import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type Status = 'loading' | 'empty' | 'error' | 'ready'

/**
 * 状态统一展示：卡片内容区用它包裹，四态齐全不允许永久骨架或空白面板。
 * status 为 ready 时渲染 children；error 必须给出原因与重试入口（或说明为何不能重试）。
 */
export function StatusBlock({ status, message, onRetry, className, children }: {
  status: Status
  /** loading/empty 的提示文案；error 时为失败原因（有则显示，无则用默认文案，不得吞错） */
  message?: string
  onRetry?: () => void
  className?: string
  children?: React.ReactNode
}) {
  if (status === 'ready') return <>{children}</>
  return (
    <div role="status" aria-live="polite" aria-busy={status === 'loading'} className={cn('flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center', className)}>
      {status === 'loading' && (<>
        <div className="w-full space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" />{message ?? '正在加载…'}</p>
      </>)}
      {status === 'empty' && (<>
        <Inbox className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{message ?? '暂无数据'}</p>
      </>)}
      {status === 'error' && (<>
        <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
        <p className="text-sm text-destructive">{message ?? '加载失败'}</p>
        {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>重试</Button>}
      </>)}
    </div>
  )
}
