import { useEffect, useRef } from 'react'
import { echarts, type EChartsOption } from '@/lib/charts'
import type { Theme } from '@/hooks/use-theme'

type Props = { option: EChartsOption; theme: Theme; label: string; height?: number; onSelect?: (name: string) => void }
export function Chart({ option, theme, label, height = 280, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const callback = useRef(onSelect)
  callback.current = onSelect
  useEffect(() => {
    if (!container.current) return
    const instance = echarts.init(container.current, undefined, { renderer: 'svg' })
    instance.setOption({ ...option, backgroundColor: 'transparent' })
    const click = (event: unknown) => callback.current?.((event as { name: string }).name)
    instance.on('click', click)
    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(container.current)
    return () => { observer.disconnect(); instance.off('click', click); instance.dispose() }
  }, [option, theme])
  return <div ref={container} role="img" aria-label={label} style={{ width: '100%', height, minWidth: 0 }} />
}
