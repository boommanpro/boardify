import { useMemo, useState } from 'react'
import { LayoutDashboard, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { usePalette } from '@/hooks/use-palette'
import { useChartTheme } from '@/hooks/use-chart-theme'
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
import { RegionMap } from '@/components/region-map'
import {
  buildHeatmapOption,
  buildRankOption,
  buildShareOption,
  buildStackedBarOption,
  buildTrendOption,
} from '@/lib/options'
import {
  LOAD_DAY_LABELS,
  LOAD_HOUR_LABELS,
  dataSourceLabel,
  queryChannels,
  queryKpis,
  queryLoad,
  queryRegionRows,
  queryShare,
  querySparkline,
  queryStacked,
  queryTrend,
  type Channel,
  type Period,
  type RegionRow,
} from '@/data/source'

const PERIOD_TEXT: Record<Period, string> = { week: '本周', month: '本月', quarter: '本季' }
const PERIOD_LABEL_TEXT: Record<Period, string> = { week: '较上周', month: '较上月', quarter: '较上季' }

const FILTER_FIELDS: FilterField[] = [
  {
    key: 'period',
    label: '统计周期',
    control: 'select',
    options: [
      { value: 'week', label: '本周' },
      { value: 'month', label: '本月' },
      { value: 'quarter', label: '本季' },
    ],
  },
  {
    key: 'channel',
    label: '业务线',
    control: 'tabs',
    options: [
      { value: 'all', label: '全部' },
      { value: 'online', label: '线上' },
      { value: 'offline', label: '线下' },
    ],
  },
]

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { palette, setPalette } = usePalette()
  const chartTheme = useChartTheme(theme, palette)
  const [period, setPeriod] = useState<Period>('week')
  const [channel, setChannel] = useState<Channel>('all')
  const filters = useMemo(() => ({ period, channel }), [period, channel])

  // 数据层是唯一数据出口：筛选变化只改 filters，所有图表/表格从 source.ts 取同一口径
  const kpis = queryKpis(filters)
  const sparkline = querySparkline(filters)
  const trend = queryTrend(filters)
  const channels = queryChannels(filters)
  const share = queryShare(filters)
  const stacked = queryStacked(filters)
  const load = queryLoad(filters)
  const regionRows = queryRegionRows(filters)

  const trendOption = useMemo(() => buildTrendOption(chartTheme, trend.labels, trend.series), [chartTheme, trend])
  const rankOption = useMemo(() => buildRankOption(chartTheme, channels, '业务量'), [chartTheme, channels])
  const shareOption = useMemo(() => buildShareOption(chartTheme, share), [chartTheme, share])
  const stackedOption = useMemo(() => buildStackedBarOption(chartTheme, stacked.labels, stacked.series), [chartTheme, stacked])
  const loadOption = useMemo(() => buildHeatmapOption(chartTheme, LOAD_HOUR_LABELS, LOAD_DAY_LABELS, load), [chartTheme, load])

  // KPI 装配：迷你趋势线与目标进度来自同一数据层口径，颜色来自 ChartTheme
  const completion = Number(kpis[1].value.replace('%', ''))
  const kpiTone: (index: number) => KpiTone | undefined = index => (index === 3 ? 'good' : undefined)
  const peak = load.reduce((best, cell) => (cell.value > best.value ? cell : best), load[0])

  const regionColumns: DataTableColumn<RegionRow>[] = [
    { key: 'name', header: '区域', cell: row => <span className="font-medium">{row.name}</span> },
    { key: 'orders', header: '业务量', numeric: true, sortValue: row => row.orders, cell: row => row.orders.toLocaleString('zh-CN') },
    {
      key: 'change',
      header: PERIOD_LABEL_TEXT[period],
      numeric: true,
      sortValue: row => Number(row.change),
      cell: row => <span className={row.change.startsWith('-') ? 'text-destructive' : 'text-success'}>{row.change}</span>,
    },
    { key: 'status', header: '状态', cell: row => <Badge variant={row.status === '关注' ? 'destructive' : 'secondary'}>{row.status}</Badge> },
  ]

  return <div className="min-h-screen">
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-5 md:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="size-5" />
          </div>
          <span className="truncate text-xl font-semibold tracking-tight">Boardify<span className="ml-3 hidden text-sm font-normal text-muted-foreground sm:inline">数据工作台</span></span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{dataSourceLabel}</Badge>
          <PaletteSwitch palette={palette} onPaletteChange={setPalette} />
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? '切换为明亮主题' : '切换为暗色主题'}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>
    </header>
    <main className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-8 md:px-10">
      <PageHeader
        eyebrow="运营洞察 / 总览"
        title="运行态势，一屏尽览。"
        description="聚合业务表现、时段负载与区域动态，从全局深入每一个服务片区。"
        aside={`统计范围：${PERIOD_TEXT[period]} · ${dataSourceLabel}`}
      />

      <FilterBar
        fields={FILTER_FIELDS}
        value={{ period, channel }}
        onChange={(key, next) => (key === 'period' ? setPeriod(next as Period) : setChannel(next as Channel))}
      />

      <section aria-label="核心指标" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <KpiCard
            key={kpi.label}
            {...kpi}
            tone={kpiTone(index)}
            sparkline={index === 0 ? { points: sparkline, color: chartTheme.primary } : undefined}
            progress={index === 1 ? { value: completion, label: '目标 98%' } : undefined}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ChartCard
          title="业务趋势"
          description={`新增与完成量 · ${PERIOD_TEXT[period]} · ${dataSourceLabel}`}
          table={{
            columns: ['时间', '新增', '完成'],
            rows: trend.labels.map((label, index) => [label, trend.series[0].values[index], trend.series[1].values[index]]),
          }}
        >
          <Chart
            option={trendOption}
            theme={theme}
            label={`业务趋势：新增与完成两条折线，时间轴 ${trend.labels[0]} 至 ${trend.labels.at(-1)}`}
            height={240}
          />
        </ChartCard>
        <ChartCard
          title="业务线构成"
          description={`各业务线占比 · ${dataSourceLabel}`}
          table={{ columns: ['业务线', '业务量'], rows: share.map(row => [row.name, row.value]) }}
        >
          <Chart option={shareOption} theme={theme} label={`业务线构成：${share.map(row => `${row.name}${row.value}`).join('、')}`} height={240} />
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <RegionMap theme={theme} filters={filters} />
        <ChartCard
          title="业务线排行"
          description={`各业务线业务量 · 单位：百单 · ${dataSourceLabel}`}
          footer="条形按数值升序排列，小值在下"
        >
          <Chart option={rankOption} theme={theme} label={`业务线排行：${channels.map(row => `${row.name}${row.value}`).join('、')}百单`} height={300} />
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <ChartCard
          title="服务类型结构"
          description={`近 ${stacked.labels.length} 个时段的服务类型堆叠 · ${dataSourceLabel}`}
          table={{ columns: ['时间', ...stacked.series.map(series => series.name)], rows: stacked.labels.map((label, index) => [label, ...stacked.series.map(series => series.values[index])]) }}
        >
          <Chart option={stackedOption} theme={theme} label={`服务类型堆叠柱状图，共 ${stacked.series.length} 类：${stacked.series.map(series => series.name).join('、')}`} height={260} />
        </ChartCard>
        <ChartCard
          title="时段负载分布"
          description={`近 7 天 × 两小时时段的业务负载 · ${dataSourceLabel}`}
          footer={`颜色越深负载越高；峰值出现在${LOAD_DAY_LABELS[peak.y]} ${LOAD_HOUR_LABELS[peak.x]}（${peak.value}）`}
        >
          <Chart option={loadOption} theme={theme} label={`时段负载热力图：横轴 ${LOAD_HOUR_LABELS[0]} 至 ${LOAD_HOUR_LABELS.at(-1)}，纵轴周一至周日，峰值 ${LOAD_DAY_LABELS[peak.y]} ${LOAD_HOUR_LABELS[peak.x]} 为 ${peak.value}`} height={260} />
        </ChartCard>
      </section>

      <Card>
        <CardHeader><CardTitle>区域明细</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={regionColumns} rows={regionRows} rowKey={row => row.name} />
        </CardContent>
      </Card>

      <footer className="flex flex-wrap justify-between gap-3 border-t pt-5 text-xs text-muted-foreground">
        <span>Boardify · 可复用数据看板起点</span>
        <span>全部指标为确定性模拟值，不代表真实业务数据</span>
      </footer>
    </main>
  </div>
}
