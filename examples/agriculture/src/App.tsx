import { useEffect, useMemo, useState } from 'react'
import { Sprout, Maximize2, Minimize2, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Chart } from '@/components/chart'
import { AgriPanel } from '@/components/agri-panel'
import { AgriMap, type Summary } from '@/components/agri-map'
import { useScreenScale } from '@/hooks/use-screen-scale'
import { useClock } from '@/hooks/use-clock'
import {
  metricOptions, provinceRows, regionStats, nationalTotals,
  grainTrend, industryComposition, cropComposition, modernization,
  formatMetric, number, rate, type MetricKey,
} from '@/data/agriculture'
import { trendOption, shareOption, rankOption, radarOption } from '@/lib/chart-options'

export default function App() {
  const scale = useScreenScale()
  const now = useClock()
  const [metric, setMetric] = useState<MetricKey>('grain')
  const [region, setRegion] = useState('100000')
  const [summary, setSummary] = useState<Summary>(() => ({ id: '100000', name: '全国', level: 1, rows: provinceRows('grain') }))
  const [fullscreen, setFullscreen] = useState(false)
  const [screenError, setScreenError] = useState('')
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])
  async function toggleFullscreen() {
    try {
      setScreenError('')
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch { setScreenError('浏览器未允许全屏，请使用浏览器全屏菜单。') }
  }
  const totals = nationalTotals
  const info = metricOptions[metric]
  const ranking = useMemo(() => [...summary.rows].sort((a, b) => b.value - a.value).slice(0, 8), [summary.rows])
  const rankingValues = ranking.map(row => ({ name: row.name, value: row.value }))
  const currentStats = summary.level > 1 ? regionStats(summary.id) : null
  const radarDims = summary.level === 2 ? modernization(summary.id) : []
  const dateText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const timeText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  const kpis = [
    { label: '粮食总产量', value: formatMetric(totals.grain, 'grain'), change: rate(totals.grainYoY), up: totals.grainYoY >= 0, detail: '2025 全年 · 同比上年' },
    { label: '农林牧渔总产值', value: formatMetric(totals.output, 'output'), change: rate(totals.outputYoY), up: totals.outputYoY >= 0, detail: '农 · 林 · 牧 · 渔 · 服务业' },
    { label: '耕地面积', value: formatMetric(totals.arable, 'arable'), change: '', up: true, detail: `播种 ${(totals.sown / 10000).toFixed(2)} 亿亩 · 灌溉 ${(totals.irrigated / 10000).toFixed(2)} 亿亩` },
    { label: '农机总动力', value: formatMetric(totals.machinery, 'machinery'), change: '', up: true, detail: `化肥折纯 ${number(totals.fertilizer)} 万吨 · 从业 ${number(totals.population)} 万人` },
  ]
  const landMax = Math.max(totals.arable, totals.sown, totals.irrigated)
  const landRows = [
    { name: '耕地面积', value: totals.arable, text: formatMetric(totals.arable, 'arable') },
    { name: '播种面积', value: totals.sown, text: `${(totals.sown / 10000).toFixed(2)} 亿亩` },
    { name: '有效灌溉', value: totals.irrigated, text: `${(totals.irrigated / 10000).toFixed(2)} 亿亩` },
  ]
  const cropMax = Math.max(...cropComposition.map(row => row.value))
  const factors = [
    { name: '播种亩均化肥', value: (totals.fertilizer * 1000 / Math.max(1, totals.sown)).toFixed(1), unit: '千克/亩' },
    { name: '从业者人均耕地', value: (totals.arable / Math.max(1, totals.population)).toFixed(1), unit: '亩/人' },
    { name: '耕地亩均农机', value: (totals.machinery / Math.max(1, totals.arable)).toFixed(2), unit: '千瓦/亩' },
    { name: '受灾 / 播种面积', value: (totals.disaster / Math.max(1, totals.sown) * 100).toFixed(1), unit: '%' },
  ]
  const nationalStats = [
    { name: '粮食总产量', value: formatMetric(totals.grain, 'grain'), change: rate(totals.grainYoY) },
    { name: '农林牧渔总产值', value: formatMetric(totals.output, 'output'), change: rate(totals.outputYoY) },
    { name: '耕地面积', value: formatMetric(totals.arable, 'arable'), change: '' },
    { name: '农机总动力', value: formatMetric(totals.machinery, 'machinery'), change: '' },
  ]
  const detailStats = currentStats ? [
    { name: '粮食产量', value: formatMetric(currentStats.grain, 'grain'), change: summary.level === 2 ? rate(currentStats.grainYoY) : '' },
    { name: '总产值', value: formatMetric(currentStats.output, 'output'), change: summary.level === 2 ? rate(currentStats.outputYoY) : '' },
    { name: '耕地面积', value: formatMetric(currentStats.arable, 'arable'), change: '' },
    { name: '农机总动力', value: formatMetric(currentStats.machinery, 'machinery'), change: '' },
  ] : []
  const detailItems = summary.level === 1 ? nationalStats : detailStats
  return <div className="screen-frame">
    <div className="screen dark" style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: 'center top' }}>
      <header className="big-header">
        <div className="brand"><div className="brand-mark"><Sprout /></div><div><h1>全国农业大数据驾驶舱</h1><p>农业强国 · 数字农业宏观监测</p></div></div>
        <div className="metric-switch" role="group" aria-label="切换地图指标">{(Object.keys(metricOptions) as MetricKey[]).map(key => <button key={key} type="button" aria-pressed={metric === key} className={metric === key ? 'active' : ''} onClick={() => setMetric(key)}>{metricOptions[key].label}</button>)}</div>
        <div className="header-right"><div className="clock"><span>{dateText}</span><strong>{timeText}</strong></div><Badge variant="secondary">演示数据</Badge><Button variant="outline" size="icon" onClick={toggleFullscreen} aria-label={fullscreen ? '退出全屏' : '进入全屏'}>{fullscreen ? <Minimize2 /> : <Maximize2 />}</Button></div>
      </header>
      <section className="kpis" aria-label="全国核心指标">{kpis.map(kpi => <Card key={kpi.label} className="kpi"><CardHeader><CardDescription>{kpi.label}</CardDescription><CardTitle className="kpi-value">{kpi.value.split(' ')[0]}<small>{kpi.value.split(' ')[1]}</small></CardTitle></CardHeader><CardContent>{kpi.change && <span className={kpi.up ? 'up' : 'down'}>{kpi.up ? <TrendingUp /> : <TrendingDown />}{kpi.change}</span>}<span className="kpi-detail">{kpi.detail}</span></CardContent></Card>)}</section>
      <main className="screen-main">
        <div className="side">
          <AgriPanel title="农林牧渔产业构成" detail="全国 · 2025 · 亿元 · 演示数据" values={industryComposition.map(row => ({ name: row.name, value: `${number(row.value)} 亿元` }))}><Chart option={shareOption(industryComposition, { label: '总产值 · 万亿元', value: (totals.output / 10000).toFixed(2) })} theme="dark" label="农林牧渔产业构成" height="100%" /></AgriPanel>
          <AgriPanel title="土地资源" detail="全国总量 · 亿亩 · 演示数据" values={landRows.map(row => ({ name: row.name, value: row.text }))}><div className="bar-list">{landRows.map(row => <div className="bar-row" key={row.name}><div className="bar-meta"><span>{row.name}</span><strong>{row.text}</strong></div><div className="bar-track"><i style={{ width: `${row.value / landMax * 100}%` }} /></div></div>)}</div></AgriPanel>
          <AgriPanel title="粮食作物构成" detail="全国 · 2025 · 万吨 · 演示数据" values={cropComposition.map(row => ({ name: row.name, value: `${number(row.value)} 万吨` }))}><div className="crop-list">{cropComposition.map(row => <div key={row.name}><span>{row.name}</span><strong>{number(row.value)}</strong><i style={{ width: `${row.value / cropMax * 100}%` }} /></div>)}</div></AgriPanel>
        </div>
        <div className="center-col">
          <AgriMap metric={metric} id={region} theme="dark" onNavigate={setRegion} onSummary={setSummary} />
        </div>
        <div className="bottom-strip">
          <AgriPanel title="粮食产量年度趋势" detail="全国 · 2016 – 2025 · 亿吨 · 演示数据" values={grainTrend.map(row => ({ name: row.year, value: `${row.value.toLocaleString('zh-CN')} 万吨` }))}><Chart option={trendOption(grainTrend.map(row => row.year), grainTrend.map(row => row.value / 10000), '亿吨')} theme="dark" label="粮食产量年度趋势" height="100%" /></AgriPanel>
          <Card className="detail-panel"><CardHeader><CardTitle>区域详情 <span>{summary.name}</span></CardTitle><CardDescription>{summary.level === 2 ? '要素相对指数 · 各项省际最大值=100 · 化肥强度非越高越好 · 演示数据' : summary.level === 1 ? '全国总量 · 同比 · 演示数据' : '当前区域四项指标 · 父级确定性分摊 · 演示数据'}</CardDescription></CardHeader><CardContent className="detail-content">{radarDims.length ? <><div className="detail-radar"><Chart option={radarOption(radarDims)} theme="dark" label={`${summary.name}生产要素相对指数雷达`} height="100%" /></div><div className="detail-stats">{detailItems.map(row => <div className="stat-box" key={row.name}><span>{row.name}</span><strong>{row.value}</strong>{row.change && <em className={row.change.startsWith('+') ? 'up' : 'down'}>{row.change}</em>}</div>)}</div></> : <div className="detail-stats wide">{detailItems.map(row => <div className="stat-box" key={row.name}><span>{row.name}</span><strong>{row.value}</strong>{row.change && <em className={row.change.startsWith('+') ? 'up' : 'down'}>{row.change}</em>}</div>)}</div>}</CardContent></Card>
        </div>
        <div className="side">
          <AgriPanel title="区域排行" detail={`${summary.name} · ${info.label} · Top 8 · ${info.unit}`} values={rankingValues.map(row => ({ name: row.name, value: `${number(row.value)} ${info.unit}` }))}><Chart option={rankOption(rankingValues, info.unit)} theme="dark" label={`${summary.name}区域排行`} height="100%" /></AgriPanel>
          <AgriPanel title="生产要素强度" detail="全国平均强度指标 · 演示数据" values={factors.map(row => ({ name: row.name, value: `${row.value} ${row.unit}` }))}><div className="factor-grid">{factors.map(row => <div className="factor-box" key={row.name}><span>{row.name}</span><strong>{row.value}<em>{row.unit}</em></strong></div>)}</div></AgriPanel>
        </div>
      </main>
      <footer><span role={screenError ? 'alert' : undefined}>{screenError || '固定种子演示数据（2026.10）· 非实时统计 · 单位与口径见各面板'}</span><span>地图：DataV.GeoAtlas 2021.5 本地资源 · 仅供学习交流 · 不用于公开发布</span><span>16:9 大屏等比缩放 · 内容不随窗口重排</span></footer>
    </div>
  </div>
}
