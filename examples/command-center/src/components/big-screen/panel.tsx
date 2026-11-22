import { cn } from '@/lib/utils'

/**
 * 大屏面板：克制的卡片变体——标题栏 + 主色顶线 + 细边框。
 * 不用霓虹描边与角饰；强调只来自一条 primary 顶线与图表本身的颜色。
 */
export function Panel({ title, extra, className, children, footer }: {
  title: string
  /** 标题行右侧的操作区（指标切换、图例开关等），保持紧凑 */
  extra?: React.ReactNode
  className?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <section className={cn('flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card', className)}>
      <header className="flex items-center justify-between gap-3 border-b border-primary/40 bg-primary/5 px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-wide text-card-foreground">{title}</h2>
        {extra}
      </header>
      <div className="min-h-0 flex-1 p-4">{children}</div>
      {footer && <footer className="border-t px-4 py-2 text-xs text-muted-foreground">{footer}</footer>}
    </section>
  )
}
