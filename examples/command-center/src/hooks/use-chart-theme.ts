import { useEffect, useMemo, useState } from 'react'
import { resolveChartTheme, type ChartTheme } from '@/lib/chart-theme'
import type { Theme } from '@/hooks/use-theme'

/**
 * 明暗或色板切换后重新解析语义令牌。
 * 根元素属性（.dark 类 / data-palette）在 effect 中写入，晚于本轮渲染，
 * 故用 rAF 触发二次解析保证取到最新令牌；revision 传当前 palette 使色板切换同样触发重解析。
 */
export function useChartTheme(mode: Theme, revision: string | number = 0): ChartTheme {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setTick(value => value + 1))
    return () => cancelAnimationFrame(frame)
  }, [mode, revision])
  return useMemo(() => resolveChartTheme(), [mode, revision, tick]) // eslint-disable-line react-hooks/exhaustive-deps
}
