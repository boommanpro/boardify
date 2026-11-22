import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sparkline } from '@/components/sparkline'

export type KpiTrend = 'up' | 'down' | 'flat'
export type KpiTone = 'good' | 'bad' | 'neutral'

/**
 * KPI 数字卡：大数字 + 同比变化，可选迷你趋势线与目标达成进度。
 * trend 只表达方向（箭头），好坏由 tone 决定：默认涨好跌坏，成本/时长类指标显式传 good/bad 反转。
 * 颜色走 success/destructive 语义令牌，不只靠红绿——同时带方向图标。
 * sparkline 颜色与 progress 含义由调用方从 ChartTheme / 业务口径传入，禁止裸写颜色。
 */
export function KpiCard({ label, value, change, detail, trend = 'flat', tone, sparkline, progress }: {
  label: string
  value: string
  change?: string
  detail?: string
  trend?: KpiTrend
  /** 默认按涨好跌坏着色；显式传入覆盖（如处理时长下降传 good） */
  tone?: KpiTone
  /** 迷你趋势线（内联 SVG）：近期走势一眼可辨，颜色来自 ChartTheme */
  sparkline?: { points: number[]; color: string }
  /** 目标达成：0-100；label 说明目标口径（如「目标 ¥150 万」） */
  progress?: { value: number; label?: string }
}) {
  const Icon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus
  const effectiveTone = tone ?? (trend === 'up' ? 'good' : trend === 'down' ? 'bad' : 'neutral')
  const toneClass = effectiveTone === 'good' ? 'text-success' : effectiveTone === 'bad' ? 'text-destructive' : 'text-muted-foreground'
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle><span className="text-3xl tabular-nums">{value}</span></CardTitle>
        {sparkline && <CardAction><Sparkline points={sparkline.points} color={sparkline.color} label={`${label}近期走势`} /></CardAction>}
      </CardHeader>
      {(change || detail || progress) && (
        <CardContent className="flex flex-col gap-3">
          {(change || detail) && (
            <div className="flex items-center gap-2 text-xs">
              {change && <span className={`flex items-center gap-0.5 ${toneClass}`}><Icon className="size-4" aria-hidden="true" />{change}</span>}
              {detail && <span className="text-muted-foreground">{detail}</span>}
            </div>
          )}
          {progress && (
            <div className="space-y-1.5">
              <Progress value={progress.value} aria-label={progress.label ?? `${label}目标达成`} />
              <p className="text-xs text-muted-foreground">{progress.label ?? '目标达成'} · {Math.round(progress.value)}%</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
