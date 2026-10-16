import { useEffect, useMemo, useRef, useState } from 'react'
import { Chart } from '@/components/chart'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { echarts, type EChartsOption } from '@/lib/charts'
import { manifest, region, pathTo, readGeo, type GeoData } from '@/lib/geography'
import { summarize, number, type Fact } from '@/data/commerce'
import type { Theme } from '@/hooks/use-theme'

export function CommerceMap({ id, onNavigate, rows, theme }: { id: string; onNavigate: (id: string) => void; rows: Fact[]; theme: Theme }) {
  const [loaded, setLoaded] = useState<{ id: string; map: GeoData } | null>(null)
  const [target, setTarget] = useState(id)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const sequence = useRef(0)
  const commit = useRef(onNavigate)
  commit.current = onNavigate
  useEffect(() => { setTarget(id) }, [id])
  useEffect(() => {
    const token = ++sequence.current
    setPending(true)
    setError('')
    readGeo(target).then(map => {
      if (token !== sequence.current) return
      echarts.registerMap(`commerce-${target}`, map as Parameters<typeof echarts.registerMap>[1])
      setLoaded({ id: target, map })
      commit.current(target)
    }).catch(reason => { if (token === sequence.current) setError(String(reason)) }).finally(() => { if (token === sequence.current) setPending(false) })
    return () => { sequence.current++ }
  }, [target, attempt])
  const current = region(loaded?.id ?? id)
  const values = useMemo(() => Object.fromEntries((current.children.length ? current.children : [current.id]).map(key => [key, summarize(rows.filter(row => row.ancestors.includes(key))).orders])), [rows, current])
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    tooltip: { renderMode: 'richText', formatter: params => { const p = params as unknown as { name: string; value: number }; const n = manifest.nodes.find(node => node.id === p.name); return `${n?.name ?? p.name}：${Number.isFinite(p.value) ? number(p.value) + ' 单' : '暂无数据'}` } },
    visualMap: { show: false, min: 0, max: Math.max(1, ...Object.values(values)), inRange: { color: theme === 'dark' ? ['#294a3a', '#b8e48b'] : ['#e4eee7', '#24644b'] } },
    series: [{ type: 'map', map: `commerce-${current.id}`, nameProperty: 'adcode', roam: false, label: { show: false }, itemStyle: { borderColor: theme === 'dark' ? '#101917' : '#ffffff', borderWidth: 0.7 }, emphasis: { label: { show: false }, itemStyle: { areaColor: '#d7b66c' } }, data: Object.entries(values).map(([name, value]) => ({ name, value })) }],
  }), [values, current.id, theme])
  function select(next: string) { if (current.children.includes(next)) setTarget(next) }
  return <Card className="map-panel"><CardHeader><CardTitle>地域经营分布 <span>{current.name}</span></CardTitle><CardDescription>支付订单量（单） · 本地边界 · DataV 2021.5</CardDescription></CardHeader><CardContent>
    <nav aria-label="地图路径" className="flex flex-wrap gap-1">{pathTo(current.id).map(node => <Button key={node.id} variant="ghost" size="sm" disabled={node.id === current.id} onClick={() => setTarget(node.id)}>{node.name}</Button>)}<Button variant="outline" size="sm" disabled={!current.parent && !pending} onClick={() => setTarget(pending ? current.id : current.parent ?? '100000')}>{pending ? '取消加载' : '返回上级'}</Button></nav>
    <div className="map-stage">
      {pending && <p className="map-status" role="status">正在加载本地地图…</p>}
      {error && <div role="alert" className="map-status text-destructive">{error} · 保留原层级<Button variant="outline" size="sm" onClick={() => setAttempt(x => x + 1)}>重试</Button><Button variant="ghost" size="sm" onClick={() => setTarget(current.id)}>继续查看原层</Button></div>}
      {loaded && <Chart option={option} theme={theme} label={`${current.name}行政区地图`} height="100%" onSelect={select} />}
    </div>
    <div className="map-legend"><span>0</span><i /><span>{number(Math.max(0, ...Object.values(values)))} 单</span><small>当前层级动态色阶</small></div>
    <label className="region-picker">区域下钻<select aria-label="选择下钻区域" value="" disabled={!current.children.length} onChange={event => select(event.target.value)}><option value="">{current.children.length ? '点击地图或选择行政区' : '当前层级无下级'}</option>{current.children.map(key => <option key={key} value={key}>{region(key).name} · {number(values[key] ?? 0)} 单</option>)}</select></label>
    <p className="map-note">{current.children.length ? '点击区域下钻 · 全部图表联动 · 仅供本地学习交流' : current.limitation}</p>
    <p className="map-note">部分区域无下级；坐标系、最新区划及审图适用性未核实。</p>
  </CardContent></Card>
}
