/**
 * 迷你趋势线：内联 SVG 实现，不创建 ECharts 实例。
 * KPI 卡等小尺寸场景优先用它，颜色从 ChartTheme 传入（令牌规则与图表一致，禁止裸写颜色）。
 */
export function Sparkline({ points, color, width = 96, height = 28, label }: {
  points: number[]
  color: string
  width?: number
  height?: number
  /** 可访问名称：说明这条线代表什么，缺少时不渲染（无障碍裸图形） */
  label: string
}) {
  if (points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const step = width / (points.length - 1)
  const path = points
    .map((value, index) => `${(index * step).toFixed(1)},${(height - 2 - ((value - min) / span) * (height - 4)).toFixed(1)}`)
    .join(' L ')
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
      <path d={`M ${path}`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
