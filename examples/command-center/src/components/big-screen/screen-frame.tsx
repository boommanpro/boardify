import { useEffect } from 'react'
import { useScreenScale } from '@/hooks/use-screen-scale'
import { cn } from '@/lib/utils'

/**
 * 大屏框架：外层占满视口并居中，内层固定设计稿尺寸（默认 1920×1080）整体等比缩放。
 * 大屏强制深色：把 dark 类加在根元素上（与 chart-theme 从 documentElement 读令牌保持一致），
 * 挂载时添加、卸载时移除，不与看板明暗切换共用状态。科技感来自图表配色与少量点缀（design-system.md）。
 */
export function ScreenFrame({ children, className, designWidth = 1920, designHeight = 1080, title }: {
  children: React.ReactNode
  className?: string
  designWidth?: number
  designHeight?: number
  /** 无障碍：整屏应用的名称 */
  title: string
}) {
  const scale = useScreenScale(designWidth, designHeight)
  useEffect(() => {
    document.documentElement.classList.add('dark')
    return () => document.documentElement.classList.remove('dark')
  }, [])
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background" aria-label={title}>
      <div
        className={cn('absolute left-1/2 top-1/2 flex flex-col gap-4 p-6', className)}
        style={{ width: designWidth, height: designHeight, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  )
}
