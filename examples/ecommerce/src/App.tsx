import { useEffect, useMemo, useState } from 'react'
import { Activity, Moon, Sun, Maximize, Minimize, RotateCcw } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { CommerceMap } from '@/components/commerce-map'
import { BusinessPanel } from '@/components/business-panel'
import { initialFilters, filterFacts, summarize, group, number, money, rate, type Filters } from '@/data/commerce'
import { region } from '@/lib/geography'
import { businessChart } from '@/lib/business-charts'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [fullscreen, setFullscreen] = useState(false)
  const [screenError, setScreenError] = useState('')
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])
  const rows = useMemo(() => filterFacts(filters), [filters])
  const totals = useMemo(() => summarize(rows), [rows])
  const daily = useMemo(() => group(rows, 'date'), [rows])
  const channels = useMemo(() => group(rows, 'channel'), [rows])
  const categories = useMemo(() => group(rows, 'category'), [rows])
  function update(key: keyof Filters, value: string) { setFilters(previous => previous[key] === value ? previous : { ...previous, [key]: value }) }
  async function toggleFullscreen() {
    try {
      setScreenError('')
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch { setScreenError('浏览器未允许全屏，请使用浏览器全屏菜单。') }
  }
  const cards = [
    ['支付金额', `¥ ${money(totals.cents)}`, '人民币元 · 未扣退款'],
    ['支付订单', number(totals.orders), `支付率 ${rate(totals.orders, totals.visits)}`],
    ['访问次数', number(totals.visits), '非去重访客 · 可加总'],
    ['签收率', rate(totals.delivered, totals.orders), `已签收 ${number(totals.delivered)} 单`],
  ]
  const fulfillment = [{ name: '支付订单', value: totals.orders }, { name: '已发货', value: totals.shipped }, { name: '已签收', value: totals.delivered }, { name: '退款订单', value: totals.refunds }]
  const funnel = [{ name: '访问', value: totals.visits }, { name: '加购', value: totals.carts }, { name: '支付', value: totals.orders }]
  const message = filters.start > filters.end ? '开始日期不能晚于结束日期，请调整筛选。' : !rows.length ? '当前筛选暂无模拟数据，请调整日期或重置筛选。' : screenError
  return <main className="dashboard">
    <header className="dashboard-header"><div className="brand"><Activity size={25} /><div><h1>青禾商析 · 经营大盘</h1><p>{region(filters.region).name} · 数据截止 2026.10.14</p></div></div><div className="toolbar"><Badge variant="secondary">模拟数据</Badge><input aria-label="开始日期" type="date" value={filters.start} onChange={event => update('start', event.target.value)} /><span>至</span><input aria-label="结束日期" type="date" value={filters.end} onChange={event => update('end', event.target.value)} /><Button variant="outline" size="icon" aria-label="重置筛选" onClick={() => setFilters(previous => ({ ...initialFilters, region: previous.region }))}><RotateCcw /></Button><Button variant="outline" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? '切换为明亮主题' : '切换为暗色主题'}>{theme === 'dark' ? <Sun /> : <Moon />}</Button><Button variant="outline" size="icon" aria-label={fullscreen ? '退出全屏' : '进入全屏'} onClick={toggleFullscreen}>{fullscreen ? <Minimize /> : <Maximize />}</Button></div></header>
    <section aria-label="核心指标" className="metrics">{cards.map(([label, value, detail]) => <Card key={label}><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="metric-value">{value}</CardTitle></CardHeader><CardContent>{detail}</CardContent></Card>)}</section>
    <section className="dashboard-grid" aria-label="经营分析">
      <div className="side-panels left-panels">
        <BusinessPanel title="支付金额趋势" detail="按日汇总 · 万元" theme={theme} option={businessChart(theme, daily.map(row => row.name.slice(5)), daily.map(row => row.cents / 1000000), 'line')} values={daily.map(row => ({ name: row.name, value: `${money(row.cents)} 元` }))} />
        <BusinessPanel title="渠道贡献" detail="支付金额 · 元" theme={theme} option={businessChart(theme, channels.map(row => row.name), channels.map(row => row.cents / 100))} values={channels.map(row => ({ name: row.name, value: `${money(row.cents)} 元` }))} />
        <Card className="funnel-panel"><CardHeader><CardTitle>访问转化漏斗</CardTitle><CardDescription>次数 / 订单 · 支付率 {rate(totals.orders, totals.visits)}</CardDescription></CardHeader><CardContent>{funnel.map((row, index) => <div className="funnel-stage" key={row.name}><div className="funnel-shape" style={{ width: `${100 - index * 22}%` }} /><span>{row.name}</span><strong>{number(row.value)}</strong><small>{rate(row.value, totals.visits)}</small></div>)}</CardContent></Card>
      </div>
      <CommerceMap id={filters.region} onNavigate={id => update('region', id)} rows={rows} theme={theme} />
      <div className="side-panels right-panels">
        <BusinessPanel title="品类表现" detail="支付金额 · 元" theme={theme} option={businessChart(theme, categories.map(row => row.name), categories.map(row => row.cents / 100))} values={categories.map(row => ({ name: row.name, value: `${money(row.cents)} 元` }))} />
        <BusinessPanel title="订单履约" detail="订单数 · 退款包含于支付，不是新增阶段" theme={theme} option={businessChart(theme, fulfillment.map(row => row.name), fulfillment.map(row => row.value))} values={fulfillment.map(row => ({ name: row.name, value: `${number(row.value)} 单` }))} />
        <Card className="fulfillment-summary"><CardHeader><CardTitle>履约质量</CardTitle><CardDescription>同一时间与地域范围</CardDescription></CardHeader><CardContent><div><span>发货率</span><strong>{rate(totals.shipped, totals.orders)}</strong></div><div><span>退款率</span><strong>{rate(totals.refunds, totals.orders)}</strong></div><p>分母：支付订单 · 分母为零显示 —</p></CardContent></Card>
      </div>
    </section>
    <footer><span role={message ? 'alert' : undefined}>{message || '固定种子 20261015 · 非实时交易 · 漏斗形状为阶段示意，比例以数字为准'}</span><span>本地学习版 · 地图不可据此公开发布</span></footer>
  </main>
}
