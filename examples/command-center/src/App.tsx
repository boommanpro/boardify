import { useMemo, useState } from 'react'
import { Coins, Radio, Signal, Target, Users } from 'lucide-react'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { Badge } from '@/components/ui/badge'
import { Chart } from '@/components/chart'
import { Panel } from '@/components/big-screen/panel'
import { ScreenFrame } from '@/components/big-screen/screen-frame'
import { KpiCard } from '@/components/kpi-card'
import { RegionMap } from '@/components/region-map'
import { buildRadarOption, buildRankOption, buildShareOption, buildStackedBarOption, buildTrendOption } from '@/lib/options'
import { RADAR_INDICATORS, dataSourceLabel, queryKpis, queryRadar, queryRank, queryShare, queryStacked, queryTrend } from '@/data/source'

// KPI 图标与指标一一对应：GMV / 用户 / 转化率 / 实时在线
const KPI_ICONS = [<Coins key="gmv" />, <Users key="users" />, <Target key="cvr" />, <Signal key="online" />]

function formatClock(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/**
 * 营销活动指挥中心：16:9 定屏等比缩放（ScreenFrame 强制深色），midnight 配色写入 index.html。
 * 每 30 秒推进一个数据版本（KPI、图表、地图填色整体换版本），时钟每秒走字。
 */
export default function App() {
  const [tick, setTick] = useState(0)
  const [now, setNow] = useState(() => new Date())
  useAutoRefresh(() => setTick(value => value + 1), 30000)
  useAutoRefresh(() => setNow(new Date()), 1000)
  const chartTheme = useChartTheme('dark')
  const filters = useMemo(() => ({ tick }), [tick])

  const kpis = queryKpis(filters)
  const share = queryShare(filters)
  const radar = queryRadar(filters)
  const rank = queryRank(filters)
  const stacked = queryStacked(filters)
  const trend = queryTrend(filters)

  const shareOption = useMemo(() => buildShareOption(chartTheme, share, { narrow: true }), [chartTheme, share])
  const radarOption = useMemo(() => buildRadarOption(chartTheme, RADAR_INDICATORS, radar), [chartTheme, radar])
  const rankOption = useMemo(() => buildRankOption(chartTheme, rank, 'GMV 指数'), [chartTheme, rank])
  const stackedOption = useMemo(() => buildStackedBarOption(chartTheme, stacked.labels, stacked.series), [chartTheme, stacked])
  const trendOption = useMemo(() => buildTrendOption(chartTheme, trend.labels, trend.series, { slider: false }), [chartTheme, trend])

  // 1920×1080 高度预算：p-4 + 头部 56 + KPI 154 + 主网格 ≥578（地图卡实际高度）+ 趋势面板 ~223 + 3×gap-3
  return <ScreenFrame title="营销活动指挥中心" className="gap-3 p-4">
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-primary/40">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary"><Radio className="size-5" /></div>
        <div>
          <h1 className="text-xl font-semibold tracking-widest text-card-foreground">营销活动指挥中心</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">活动总览 · 区域调度 · 实时转化</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Badge variant="secondary">{dataSourceLabel}</Badge>
        <span>数据版本 T{tick}</span>
        <span className="tabular-nums">{formatClock(now)}</span>
      </div>
    </header>

    <section aria-label="活动核心指标" className="grid shrink-0 grid-cols-4 gap-3">
      {kpis.map((kpi, index) => <KpiCard key={kpi.label} {...kpi} icon={KPI_ICONS[index]} />)}
    </section>

    <section className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_300px] gap-3">
      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="渠道构成" className="min-h-0 flex-1">
          <Chart option={shareOption} theme="dark" label={`渠道构成：${share.map(row => `${row.name}${row.value}`).join('、')}`} height={200} />
        </Panel>
        <Panel title="用户画像" className="min-h-0 flex-1">
          <Chart option={radarOption} theme="dark" label={`用户画像六维雷达：${RADAR_INDICATORS.map(indicator => indicator.name).join('、')}`} height={200} />
        </Panel>
      </div>
      <RegionMap theme="dark" filters={filters} />
      <div className="flex min-h-0 flex-col gap-3">
        <Panel title="区域排行" className="min-h-0 flex-1" footer="条形按数值升序，小值在下">
          <Chart option={rankOption} theme="dark" label={`区域 GMV 指数排行：${rank.map(row => `${row.name}${row.value}`).join('、')}`} height={200} />
        </Panel>
        <Panel title="品类结构" className="min-h-0 flex-1">
          <Chart option={stackedOption} theme="dark" label={`分时段品类结构堆叠：${stacked.series.map(series => series.name).join('、')}`} height={200} />
        </Panel>
      </div>
    </section>

    <Panel title="GMV 走势" className="shrink-0">
      <Chart option={trendOption} theme="dark" label={`今日与昨日 GMV 双折线，横轴 00 时至 23 时`} height={150} />
    </Panel>
  </ScreenFrame>
}
