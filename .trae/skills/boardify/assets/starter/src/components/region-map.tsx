import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Chart } from '@/components/chart'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { echarts, type EChartsOption } from '@/lib/charts'
import { breadcrumbs, getChild, getNode, loadMap, rootId, type MapData } from '@/lib/maps'
import { regionValue } from '@/data/metrics'
import type { Theme } from '@/hooks/use-theme'

export function RegionMap({ theme, loader = loadMap }: { theme: Theme; loader?: typeof loadMap }) {
  const [id, setId] = useState(rootId)
  const [loaded, setLoaded] = useState<{ id: string; map: MapData } | null>(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [notice, setNotice] = useState('')
  const sequence = useRef(0)
  const node = getNode(id)
  const data = loaded?.id === id ? loaded.map : null
  const loading = pending || (!data && !error)
  useEffect(() => {
    const token = ++sequence.current
    setPending(true)
    setError('')
    setLoaded(null)
    Promise.resolve().then(() => loader(id)).then(map => {
      if (token !== sequence.current) return
      echarts.registerMap(`boardify-${id}`, map as Parameters<typeof echarts.registerMap>[1])
      setLoaded({ id, map })
    }).catch((reason: unknown) => {
      if (token === sequence.current) setError(reason instanceof Error ? reason.message : '地图加载失败')
    }).finally(() => { if (token === sequence.current) setPending(false) })
    return () => { sequence.current++ }
  }, [id, attempt, loader])
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { trigger: 'item', renderMode: 'richText', formatter: '{b}：{c} 单' },
    visualMap: { min: 120, max: 920, show: false, inRange: { color: theme === 'dark' ? ['#294a3a', '#b8e48b'] : ['#d4e8cf', '#34815b'] } },
    series: [{ type: 'map', map: `boardify-${id}`, roam: false, selectedMode: false, label: { show: true, color: theme === 'dark' ? '#f3f9ef' : '#183b29', fontSize: 13 }, itemStyle: { borderColor: theme === 'dark' ? '#16221f' : '#ffffff', borderWidth: 4 }, emphasis: { label: { color: '#142b1c' }, itemStyle: { areaColor: '#d3e7a5' } }, data: data?.features.map(feature => ({ name: feature.properties.name, value: regionValue(feature.properties.id) })) ?? [] }],
  }), [data, id, theme])
  function navigate(next: string) { setNotice(''); setId(next) }
  function select(name: string) {
    if (loading || !data) return
    const feature = data.features.find(item => item.properties.name === name)
    if (!feature) return
    if (!node.children.length) { setNotice('已到第三级，当前区域没有下级地图。'); return }
    try { navigate(getChild(id, feature.properties.id).id) } catch (reason) { setError((reason as Error).message) }
  }
  return <Card>
    <CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>区域服务分布</CardTitle><Badge variant="secondary">第 {node.level} / 3 级</Badge></div><CardDescription>本地合成地图 · 非真实行政区划 · 点击区域下钻</CardDescription></CardHeader>
    <CardContent>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="地图路径" className="flex flex-wrap gap-1">{breadcrumbs(id).map(item => <Button key={item.id} variant="ghost" size="sm" aria-current={item.id === id ? 'location' : undefined} disabled={item.id === id} onClick={() => navigate(item.id)}>{item.name}</Button>)}</nav>
        <Button variant="outline" size="sm" disabled={!node.parent} onClick={() => node.parent && navigate(node.parent)}><ArrowLeft data-icon="inline-start" />返回上级</Button>
      </div>
      <div aria-live="polite" aria-busy={loading}>
        {loading ? <div className="py-5"><Skeleton className="h-[310px] w-full" /><p className="mt-3 text-sm text-muted-foreground">正在加载本地地图…</p></div> : error ? <Alert variant="destructive" className="my-6"><AlertTitle>地图暂不可用</AlertTitle><AlertDescription><p>{error}</p><Button variant="outline" size="sm" onClick={() => setAttempt(value => value + 1)}>重试</Button></AlertDescription></Alert> : data && <><Chart option={option} theme={theme} label={`${node.name}合成服务地图`} height={350} onSelect={select} /><div className="flex flex-wrap gap-2">{data.features.map(feature => <Button key={feature.properties.id} variant="secondary" size="sm" onClick={() => select(feature.properties.name)}><MapPin data-icon="inline-start" />{feature.properties.name}</Button>)}</div></>}
        {notice && <p role="status" className="mt-4 text-sm text-muted-foreground">{notice}</p>}
      </div>
    </CardContent>
    <CardFooter><p className="text-xs text-muted-foreground">模拟订单量 · 颜色越深代表服务量越高 · 支持键盘选择区域</p></CardFooter>
  </Card>
}
