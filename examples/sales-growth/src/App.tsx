import { useMemo, useState } from 'react'
import { TrendingUp, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { usePalette } from '@/hooks/use-palette'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Chart } from '@/components/chart'
import { ChartCard } from '@/components/chart-card'
import { KpiCard } from '@/components/kpi-card'
import { FilterBar, type FilterField } from '@/components/filter-bar'
import { PageHeader } from '@/components/page-header'
import { PaletteSwitch } from '@/components/palette-switch'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { buildFunnelOption, buildHeatmapOption, buildScatterOption, buildTrendOption } from '@/lib/options'
import {
  RETENTION_COHORT_LABELS,
  RETENTION_WEEKS,
  dataSourceLabel,
  queryChannels,
  queryFunnel,
  queryKpis,
  queryRetention,
  querySegments,
  queryTrend,
  type ChannelRow,
  type Cohort,
  type Period,
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
    key: 'cohort',
    label: '客群',
    control: 'tabs',
    options: [
      { value: 'all', label: '全部' },
      { value: 'new', label: '新客' },
      { value: 'returning', label: '老客' },
    ],
  },
]

const RETENTION_WEEK_LABELS = Array.from({ length: RETENTION_WEEKS }, (_, index) => `第 ${index + 1} 周`)

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { palette, setPalette } = usePalette()
  const chartTheme = useChartTheme(theme, palette)
  const [period, setPeriod] = useState<Period>('week')
  const [cohort, setCohort] = useState<Cohort>('all')
  const filters = useMemo(() => ({ period, cohort }), [period, cohort])

  // 数据层是唯一数据出口：漏斗、留存、分层、明细共用同一筛选口径
  const kpis = queryKpis(filters)
  const trend = queryTrend(filters)
  const funnel = queryFunnel(filters)
  const retention = queryRetention(filters)
  const segments = querySegments(filters)
  const channels = queryChannels(filters)

  const trendOption = useMemo(() => buildTrendOption(chartTheme, trend.labels, trend.series), [chartTheme, trend])
  const funnelOption = useMemo(() => buildFunnelOption(chartTheme, funnel), [chartTheme, funnel])
  const retentionOption = useMemo(() => buildHeatmapOption(chartTheme, RETENTION_WEEK_LABELS, RETENTION_COHORT_LABELS, retention), [chartTheme, retention])
  const segmentOption = useMemo(() => buildScatterOption(chartTheme, segments, { xAxis: '访问频次（次）', yAxis: '客单价（元）' }), [chartTheme, segments])

  const worstStep = funnel.slice(1).reduce((worst, stage, index) => {
    const drop = funnel[index].value - stage.value
    return drop > worst.drop ? { name: stage.name, drop } : worst
  }, { name: '', drop: 0 })

  const channelColumns: DataTableColumn<ChannelRow>[] = [
    { key: 'name', header: '渠道', cell: row => <span className="font-medium">{row.name}</span> },
    { key: 'visitors', header: '访客数', numeric: true, sortValue: row => row.visitors, cell: row => row.visitors.toLocaleString('zh-CN') },
    { key: 'conversion', header: '转化率', numeric: true, sortValue: row => Number(row.conversion.replace('%', '')), cell: row => row.conversion },
    { key: 'gmv', header: 'GMV（元）', numeric: true, sortValue: row => row.gmv, cell: row => `¥ ${row.gmv.toLocaleString('zh-CN')}` },
    {
      key: 'change',
      header: PERIOD_LABEL_TEXT[period],
      numeric: true,
      sortValue: row => Number(row.change),
      cell: row => <span className={row.change.startsWith('-') ? 'text-destructive' : 'text-success'}>{row.change}</span>,
    },
  ]

  return <div className="min-h-screen">
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-5 md:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="size-5" />
          </div>
          <span className="truncate text-xl font-semibold tracking-tight">GrowthLens<span className="ml-3 hidden text-sm font-normal text-muted-foreground sm:inline">增长分析</span></span>
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
        eyebrow="增长分析 / 转化与留存"
        title="从访问到复购，看清每一步。"
        description="漏斗逐级转化、 cohort 留存衰减与用户分层一屏聚合，定位增长卡点。"
        aside={`统计范围：${PERIOD_TEXT[period]} · ${dataSourceLabel}`}
      />

      <FilterBar
        fields={FILTER_FIELDS}
        value={{ period, cohort }}
        onChange={(key, next) => (key === 'period' ? setPeriod(next as Period) : setCohort(next as Cohort))}
      />

      <section aria-label="核心指标" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(kpi => <KpiCard key={kpi.label} {...kpi} />)}
      </section>

      <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <ChartCard
          title="转化漏斗"
          description={`访问 → 支付逐级转化 · 占比按首级口径 · ${dataSourceLabel}`}
          footer={`流失最多的一步：${worstStep.name}（-${worstStep.drop.toLocaleString('zh-CN')}）`}
          table={{ columns: ['阶段', '人数'], rows: funnel.map(stage => [stage.name, stage.value]) }}
        >
          <Chart option={funnelOption} theme={theme} label={`转化漏斗：${funnel.map(stage => `${stage.name}${stage.value}`).join('、')}，占比以首级访问为基准`} height={260} />
        </ChartCard>
        <ChartCard
          title="新客留存矩阵"
          description={`近 8 个注册周 × 第 1-8 周留存率 · ${dataSourceLabel}`}
          footer="颜色越深留存越高；注册当周为 100%，未满周数不造数据"
        >
          <Chart option={retentionOption} theme={theme} label="留存热力图：行为第几周，列为注册周 W1 至 W8，注册当周 100%，逐周衰减" height={260} />
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <ChartCard
          title="用户分层"
          description={`访问频次 × 客单价，气泡大小为近期消费额 · ${dataSourceLabel}`}
          footer="气泡按面积映射消费额；右上角为高价值核心用户群"
        >
          <Chart option={segmentOption} theme={theme} label="用户分层散点图：横轴访问频次，纵轴客单价，气泡越大消费额越高，共 12 个分层" height={260} />
        </ChartCard>
        <ChartCard
          title="GMV 趋势"
          description={`新客与复购 GMV · ${PERIOD_TEXT[period]} · ${dataSourceLabel}`}
          table={{ columns: ['时间', '新客 GMV', '复购 GMV'], rows: trend.labels.map((label, index) => [label, trend.series[0].values[index], trend.series[1].values[index]]) }}
        >
          <Chart option={trendOption} theme={theme} label={`GMV 趋势：新客与复购两条折线，时间轴 ${trend.labels[0]} 至 ${trend.labels.at(-1)}`} height={260} />
        </ChartCard>
      </section>

      <Card>
        <CardHeader><CardTitle>渠道明细</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={channelColumns} rows={channels} rowKey={row => row.name} />
        </CardContent>
      </Card>

      <footer className="flex flex-wrap justify-between gap-3 border-t pt-5 text-xs text-muted-foreground">
        <span>GrowthLens · boardify 增长分析配方示例</span>
        <span>全部指标为确定性模拟值，不代表真实业务数据</span>
      </footer>
    </main>
  </div>
}
