import { useMemo, useState } from 'react'
import { Activity, Moon, Pause, Play, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { usePalette } from '@/hooks/use-palette'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Chart } from '@/components/chart'
import { ChartCard } from '@/components/chart-card'
import { KpiCard, type KpiTone } from '@/components/kpi-card'
import { FilterBar, type FilterField } from '@/components/filter-bar'
import { PageHeader } from '@/components/page-header'
import { PaletteSwitch } from '@/components/palette-switch'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { StatusBlock } from '@/components/status-block'
import { buildHeatmapOption, buildStackedBarOption, buildTrendOption } from '@/lib/options'
import {
  ERROR_DAY_LABELS,
  ERROR_HOUR_LABELS,
  dataSourceLabel,
  queryAlerts,
  queryErrors,
  queryHealth,
  queryLatency,
  queryStacked,
  type AlertRow,
  type Scope,
} from '@/data/source'

const FILTER_FIELDS: FilterField[] = [
  {
    key: 'scope',
    label: '服务范围',
    control: 'select',
    options: [
      { value: 'all', label: '全部服务' },
      { value: 'core', label: '核心链路' },
      { value: 'edge', label: '边缘服务' },
    ],
  },
]

// 级别 = 文字 + 语义色双重表达（不只靠颜色）：严重红底、警告黄框黄字、提示中性
const LEVEL_BADGE: Record<AlertRow['level'], { variant: 'destructive' | 'outline' | 'secondary'; className?: string }> = {
  严重: { variant: 'destructive' },
  警告: { variant: 'outline', className: 'border-warning text-warning' },
  提示: { variant: 'secondary' },
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { palette, setPalette } = usePalette()
  const chartTheme = useChartTheme(theme, palette)
  const [scope, setScope] = useState<Scope>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [tick, setTick] = useState(0)
  const filters = useMemo(() => ({ scope }), [scope])

  // 数据版本整体推进：每轮刷新 KPI、图表、告警一起换版本，不会只有局部跳动
  useAutoRefresh(() => setTick(value => value + 1), 15000, autoRefresh)

  const health = queryHealth(tick, filters)
  const latency = queryLatency(tick, filters)
  const errors = queryErrors(tick, filters)
  const stacked = queryStacked(tick, filters)
  const alerts = queryAlerts(tick)

  const latencyOption = useMemo(() => buildTrendOption(chartTheme, latency.labels, latency.series), [chartTheme, latency])
  const errorOption = useMemo(() => buildHeatmapOption(chartTheme, ERROR_HOUR_LABELS, ERROR_DAY_LABELS, errors), [chartTheme, errors])
  const stackedOption = useMemo(() => buildStackedBarOption(chartTheme, stacked.labels, stacked.series), [chartTheme, stacked])

  // 可用率涨为好（默认映射即可）；延迟、错误率、告警下降为好——方向与好坏分开声明
  const kpiTone: (index: number) => KpiTone | undefined = index => (index === 0 ? undefined : 'good')
  const peak = errors.reduce((best, cell) => (cell.value > best.value ? cell : best), errors[0])

  const alertColumns: DataTableColumn<AlertRow>[] = [
    { key: 'id', header: '编号', cell: row => <span className="font-medium tabular-nums">{row.id}</span> },
    {
      key: 'level',
      header: '级别',
      sortValue: row => ({ 严重: 0, 警告: 1, 提示: 2 })[row.level],
      cell: row => <Badge variant={LEVEL_BADGE[row.level].variant} className={LEVEL_BADGE[row.level].className}>{row.level}</Badge>,
    },
    { key: 'service', header: '服务', cell: row => row.service },
    { key: 'summary', header: '摘要', cell: row => row.summary },
    { key: 'time', header: '时间', numeric: true, sortValue: row => row.time, cell: row => row.time },
  ]

  return <div className="min-h-screen">
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-5 md:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-5" />
          </div>
          <span className="truncate text-xl font-semibold tracking-tight">OpsMonitor<span className="ml-3 hidden text-sm font-normal text-muted-foreground sm:inline">运维值守</span></span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{dataSourceLabel}</Badge>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            aria-pressed={autoRefresh}
            onClick={() => setAutoRefresh(value => !value)}
          >
            {autoRefresh ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}
            {autoRefresh ? '自动刷新中（15s）' : '已暂停'}
          </Button>
          <PaletteSwitch palette={palette} onPaletteChange={setPalette} />
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? '切换为明亮主题' : '切换为暗色主题'}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>
    </header>
    <main className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-8 md:px-10">
      <PageHeader
        eyebrow="运维值守 / 实时"
        title="服务健康，实时在握。"
        description="延迟、错误与告警一屏聚合，异常时段与责任服务快速定位。"
        aside={`数据版本 T${tick} · 每 15 秒自动刷新 · ${dataSourceLabel}`}
      />

      <FilterBar fields={FILTER_FIELDS} value={{ scope }} onChange={(key, next) => key === 'scope' && setScope(next as Scope)} />

      <section aria-label="服务健康" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {health.map((kpi, index) => <KpiCard key={kpi.label} {...kpi} tone={kpiTone(index)} />)}
      </section>

      <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ChartCard
          title="响应延迟趋势"
          description={`P50 与 P95 · 最近 24 个采样 · ${dataSourceLabel}`}
          table={{ columns: ['采样', 'P50 (ms)', 'P95 (ms)'], rows: latency.labels.map((label, index) => [label, latency.series[0].values[index], latency.series[1].values[index]]) }}
        >
          <Chart option={latencyOption} theme={theme} label={`响应延迟趋势：P50 与 P95 两条折线，时间轴 ${latency.labels[0]} 至 ${latency.labels.at(-1)}`} height={240} />
        </ChartCard>
        <ChartCard
          title="时段错误分布"
          description={`近 7 天 × 两小时时段的错误量 · ${dataSourceLabel}`}
          footer={`颜色越深错误越多；峰值出现在${ERROR_DAY_LABELS[peak.y]} ${ERROR_HOUR_LABELS[peak.x]}（${peak.value} 次）`}
        >
          <Chart option={errorOption} theme={theme} label={`时段错误热力图：横轴 ${ERROR_HOUR_LABELS[0]} 至 ${ERROR_HOUR_LABELS.at(-1)}，纵轴周一至周日，峰值 ${peak.value} 次`} height={240} />
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <ChartCard
          title="服务请求量结构"
          description={`最近 12 个采样按服务堆叠 · ${dataSourceLabel}`}
          table={{ columns: ['采样', ...stacked.series.map(series => series.name)], rows: stacked.labels.map((label, index) => [label, ...stacked.series.map(series => series.values[index])]) }}
        >
          <Chart option={stackedOption} theme={theme} label={`服务请求量堆叠柱状图，共 ${stacked.series.length} 个服务：${stacked.series.map(series => series.name).join('、')}`} height={260} />
        </ChartCard>
        <Card>
          <CardHeader><CardTitle>告警明细</CardTitle></CardHeader>
          <CardContent>
            <StatusBlock status={alerts.length ? 'ready' : 'empty'} message={alerts.length ? undefined : '当前数据版本没有待处理告警，下一轮刷新可能产生新告警'}>
              <DataTable columns={alertColumns} rows={alerts} rowKey={row => row.id} />
            </StatusBlock>
          </CardContent>
        </Card>
      </section>

      <footer className="flex flex-wrap justify-between gap-3 border-t pt-5 text-xs text-muted-foreground">
        <span>OpsMonitor · boardify 运维监控配方示例</span>
        <span>全部指标为确定性模拟值，不代表真实服务数据</span>
      </footer>
    </main>
  </div>
}
