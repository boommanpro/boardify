import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Chart } from '@/components/chart'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { echarts, type EChartsOption } from '@/lib/charts'
import { region, pathTo, readGeo, type GeoData } from '@/lib/maps'
import { fitMap, splitNationalMap } from '@/lib/map-layout'
import { metricOptions, childrenValues, number, type MetricKey } from '@/data/agriculture'
import type { Theme } from '@/hooks/use-theme'

export type SummaryRow = { adcode: string; name: string; value: number }
export type Summary = { id: string; name: string; level: number; rows: SummaryRow[] }
type Props = {
  metric: MetricKey
  id: string
  theme: Theme
  onNavigate: (id: string) => void
  onSummary: (summary: Summary) => void
  loader?: (id: string) => Promise<GeoData>
}

export function AgriMap({ metric, id, theme, onNavigate, onSummary, loader = readGeo }: Props) {
  const [loaded, setLoaded] = useState<{ id: string; map: GeoData } | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [notice, setNotice] = useState('')
  const stage = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    if (!stage.current) return
    const element = stage.current
    const measure = () => setSize({ width: element.clientWidth, height: element.clientHeight })
    const observer = new ResizeObserver(measure)
    measure()
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const sequence = useRef(0)
  const commitNavigate = useRef(onNavigate)
  const commitSummary = useRef(onSummary)
  useEffect(() => {
    commitNavigate.current = onNavigate
    commitSummary.current = onSummary
  })
  useEffect(() => {
    const token = ++sequence.current
    // 竞态隔离模式：切换地图时先同步重置状态，用 token 丢弃过期响应
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(true)
    setError('')
    loader(id).then(map => {
      if (token !== sequence.current) return
      const display = id === '100000' ? splitNationalMap(map) : { mainland: map, inset: null }
      echarts.registerMap(`agri-${id}`, display.mainland as Parameters<typeof echarts.registerMap>[1])
      if (display.inset) echarts.registerMap('agri-south-sea', display.inset as Parameters<typeof echarts.registerMap>[1])
      setLoaded({ id, map })
      commitNavigate.current(id)
    }).catch(reason => { if (token === sequence.current) setError(reason instanceof Error ? reason.message : String(reason)) }).finally(() => { if (token === sequence.current) setPending(false) })
    // cleanup 递增 token 是刻意为之：使未完成的旧请求失效，非引用 DOM 节点
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { sequence.current++ }
  }, [id, attempt, loader])
  const current = region(loaded?.id ?? id)
  const rows = useMemo<SummaryRow[]>(() => {
    if (!loaded) return []
    const childIds = loaded.map.features.filter(feature => /^\d{6}$/.test(String(feature.properties.adcode))).map(feature => String(feature.properties.adcode))
    const values = childrenValues(current.id, childIds, metric)
    const names = new Map(loaded.map.features.map(feature => [String(feature.properties.adcode), feature.properties.name]))
    return childIds.map(adcode => ({ adcode, name: names.get(adcode) ?? region(adcode).name, value: values[adcode] }))
  }, [loaded, current.id, metric])
  useEffect(() => {
    if (!loaded || !rows.length) return
    commitSummary.current({ id: current.id, name: current.name, level: current.level, rows })
  }, [loaded, rows, current.id, current.name, current.level])
  const max = Math.max(1, ...rows.map(row => row.value))
  const info = metricOptions[metric]
  const namesByAdcode = useMemo(() => new Map((loaded?.map.features ?? []).map(feature => [String(feature.properties.adcode), feature.properties.name ?? ''])), [loaded])
  const national = current.id === '100000'
  const aspectScale = national ? 0.94 : 0.75
  const layoutSize = useMemo(() => loaded ? fitMap(national ? splitNationalMap(loaded.map).mainland : loaded.map, size.width, size.height, aspectScale, national ? 0.75 : 0.99) : '100%', [loaded, size, national, aspectScale])
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    graphic: national ? [{ type: 'group', right: 12, bottom: 12, children: [
      { type: 'rect', shape: { width: 94, height: 148 }, style: { stroke: '#618783', fill: 'transparent', lineWidth: 1 } },
      { type: 'text', style: { text: '南海诸岛', x: 47, y: 135, align: 'center', fill: '#c5d6d3', fontSize: 11 } },
    ] }] : [],
    tooltip: {
      // 默认 html 渲染，避免 richText 模式把 <br/> 当字面文本显示
      formatter: params => {
        const item = params as { name: string; value?: number }
        const row = rows.find(candidate => candidate.adcode === item.name)
        const label = (row?.name ?? '南海诸岛（示意）').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        return `${label}<br/>${Number.isFinite(item.value) ? `${number(item.value!)} ${info.unit}` : '暂无数据'}`
      },
    },
    visualMap: { show: false, min: 0, max, inRange: { color: ['#21434b', '#618783', '#dbb96c'] } },
    series: [{
      type: 'map', map: `agri-${current.id}`, nameProperty: 'adcode', roam: true,
      aspectScale,
      layoutCenter: ['50%', '50%'], layoutSize, scaleLimit: { min: 1, max: 8 },
      label: {
        show: true,
        color: '#f3efe3',
        fontSize: current.id === '100000' ? 11 : 12,
        // 数据按 adcode 匹配，标签展示中文名（nameProperty 为 adcode，默认会显示数字）
        formatter: (params: unknown) => namesByAdcode.get((params as { name: string }).name) ?? '',
        textBorderColor: '#081b20',
        textBorderWidth: 2.5,
      },
      labelLayout: { hideOverlap: true },
      itemStyle: { borderColor: '#0b2228', borderWidth: 1, areaColor: '#21434b' },
      emphasis: { label: { show: true, color: '#081b20', textBorderWidth: 0 }, itemStyle: { areaColor: '#f0d697' } },
      data: rows.map(row => ({ name: row.adcode, value: row.value })),
    }, ...(national ? [{
      type: 'map' as const, map: 'agri-south-sea', nameProperty: 'adcode', roam: false,
      right: 22, bottom: 37, width: 74, height: 112,
      label: { show: false }, silent: true,
      itemStyle: { borderColor: '#618783', borderWidth: 1, areaColor: '#21434b' },
      data: rows.filter(row => row.adcode === '460000').map(row => ({ name: row.adcode, value: row.value })),
    }] : [])],
  }), [rows, max, current.id, info.unit, namesByAdcode, layoutSize, national, aspectScale])
  function select(adcode: string) {
    if (pending || !loaded || !/^\d{6}$/.test(adcode)) return
    if (current.children.length) {
      setNotice('')
      commitNavigate.current(adcode)
    } else {
      setNotice('已到最细层级：区县为最细层级，不含乡镇。')
    }
  }
  return <Card className="agri-map"><CardHeader><CardTitle>全国农业产业分布 <span>{current.name}</span></CardTitle><CardDescription>{info.label}（{info.unit}）· 本地边界 · DataV 2021.5 · 点击区域逐级下钻 · 滚轮缩放/拖动平移</CardDescription></CardHeader><CardContent>
    <nav aria-label="地图路径" className="map-nav">{pathTo(current.id).map(item => <Button key={item.id} variant="ghost" size="sm" aria-current={item.id === current.id ? 'location' : undefined} disabled={item.id === current.id} onClick={() => commitNavigate.current(item.id)}>{item.name}</Button>)}<Button variant="outline" size="sm" disabled={!current.parent || pending} onClick={() => commitNavigate.current(current.parent ?? '100000')}>{pending ? '加载中' : <><ArrowLeft data-icon="inline-start" />返回上级</>}</Button></nav>
    <div ref={stage} className="map-stage">
      {pending && <p className="map-status" role="status">正在加载本地地图…</p>}
      {error && <div role="alert" className="map-status">{error} · 保留原层级<Button variant="outline" size="sm" onClick={() => setAttempt(value => value + 1)}>重试</Button><Button variant="ghost" size="sm" onClick={() => commitNavigate.current(current.id)}>继续查看原层</Button></div>}
      {notice && <p role="status" className="map-status">{notice}</p>}
      {loaded && <Chart option={option} theme={theme} label={`${current.name}农业产业分布地图`} height="100%" onSelect={select} />}
    </div>
    <div className="map-legend"><span>0</span><i /><span>{number(max)} {info.unit}</span><small>当前层级动态色阶 · {info.label}</small></div>
    <label className="region-picker">区域下钻<select aria-label="选择下钻区域" value="" disabled={!current.children.length} onChange={event => select(event.target.value)}><option value="">{current.children.length ? '点击地图或选择下级行政区' : '当前层级无下级'}</option>{rows.map(row => <option key={row.adcode} value={row.adcode}>{row.name} · {number(row.value)} {info.unit}</option>)}</select></label>
    <p className="map-note">{current.children.length ? '点击区域逐级下钻至区县 · 联动排行与详情 · 仅供本地学习交流' : current.limitation}</p>
  </CardContent></Card>
}
