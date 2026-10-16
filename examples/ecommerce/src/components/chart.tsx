import { useEffect, useRef } from 'react'
import { echarts, type EChartsOption } from '@/lib/charts'
import type { Theme } from '@/hooks/use-theme'

type Props = { option: EChartsOption; theme: Theme; label: string; height?: number | string; onSelect?: (name: string) => void }
export function Chart({ option, theme, label, height = 280, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const chart = useRef<ReturnType<typeof echarts.init> | null>(null)
  const callback = useRef(onSelect)
  callback.current = onSelect
  useEffect(() => {
    if (!container.current) return
    const instance = echarts.init(container.current, undefined, { renderer: 'svg' })
    chart.current = instance
    const click = (event: unknown) => {
      const item = event as { componentType?: string; seriesType?: string; name: string }
      if (item.componentType === 'series' && item.seriesType === 'map') callback.current?.(item.name)
    }
    instance.on('click', click)
    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(container.current)
    return () => { observer.disconnect(); instance.off('click', click); instance.dispose(); chart.current = null }
  }, [theme])
  useEffect(() => { chart.current?.setOption({ ...option, backgroundColor: 'transparent' }, { notMerge: true }) }, [option, theme])
  return <div ref={container} role="img" aria-label={label} style={{ width: '100%', height, minWidth: 0 }} />
}
