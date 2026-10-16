import { useMemo } from 'react'
import { Activity, ArrowUpRight, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Chart } from '@/components/chart'
import { RegionMap } from '@/components/region-map'
import { metrics, trend } from '@/data/metrics'
import type { EChartsOption } from '@/lib/charts'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const options = useMemo(() => {
    const text = theme === 'dark' ? '#93a79b' : '#65786f'
    const line = theme === 'dark' ? '#293c32' : '#e4eae4'
    const primary = theme === 'dark' ? '#b8e48b' : '#34815b'
    const common: EChartsOption = { textStyle: { color: text }, grid: { top: 20, left: 42, right: 20, bottom: 30 }, tooltip: { trigger: 'axis', renderMode: 'richText' }, xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: text } }, yAxis: { type: 'value', axisLabel: { color: text }, splitLine: { lineStyle: { color: line } } } }
    return {
      trend: { ...common, series: [{ type: 'line', data: trend, smooth: true, symbolSize: 7, lineStyle: { width: 3, color: primary }, itemStyle: { color: primary }, areaStyle: { color: primary, opacity: 0.12 } }] } as EChartsOption,
      channels: { ...common, xAxis: { type: 'category', data: ['线上商城', '直营门店', '合作渠道', '企业服务'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: text } }, series: [{ type: 'bar', data: [82, 64, 48, 35], barMaxWidth: 38, itemStyle: { color: primary, borderRadius: [5, 5, 0, 0] } }] } as EChartsOption,
    }
  }, [theme])
  return <div className="min-h-screen">
    <header className="border-b bg-card"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-5 md:px-10"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Activity className="size-5" /></div><span className="text-xl font-semibold tracking-tight">Boardify<span className="ml-3 hidden text-sm font-normal text-muted-foreground sm:inline">数据工作台</span></span></div><div className="flex items-center gap-3"><Badge variant="secondary">模拟数据</Badge><Button variant="outline" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? '切换为明亮主题' : '切换为暗色主题'}>{theme === 'dark' ? <Sun /> : <Moon />}</Button></div></div></header>
    <main className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-8 md:px-10">
      <section className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs tracking-[0.2em] text-muted-foreground">运营洞察 / 总览</p><h1 className="text-3xl font-semibold tracking-tight">让每一份增长，清晰可见。</h1><p className="mt-3 text-sm text-muted-foreground">聚合业务表现与区域动态，从全局深入每一个服务片区。</p></div><p className="text-sm text-muted-foreground">演示周期：2026.10.05 — 10.11</p></section>
      <section aria-label="核心指标" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(metric => <Card key={metric.label}><CardHeader><CardDescription>{metric.label}</CardDescription><CardTitle><span className="text-3xl tabular-nums">{metric.value}</span></CardTitle></CardHeader><CardContent><div className="flex items-center gap-2 text-xs"><span className="flex items-center text-primary"><ArrowUpRight className="size-4" />{metric.change}</span><span className="text-muted-foreground">{metric.detail}</span></div></CardContent></Card>)}</section>
      <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"><RegionMap theme={theme} /><div className="grid min-w-0 grid-cols-1 gap-6"><Card><CardHeader><CardTitle>营收趋势</CardTitle><CardDescription>本周每日营收 · 单位：万元 · 模拟数据</CardDescription></CardHeader><CardContent><Chart option={options.trend} theme={theme} label="本周营收趋势：42、56、49、71、64、83、92万元" height={190} /></CardContent></Card><Card><CardHeader><CardTitle>渠道贡献</CardTitle><CardDescription>各渠道订单量 · 单位：百单 · 模拟数据</CardDescription></CardHeader><CardContent><Chart option={options.channels} theme={theme} label="线上商城82、直营门店64、合作渠道48、企业服务35百单" height={170} /></CardContent></Card></div></section>
      <footer className="flex flex-wrap justify-between gap-3 border-t pt-5 text-xs text-muted-foreground"><span>Boardify · 可复用数据看板起点</span><span>全部指标为静态模拟值，不代表真实业务数据</span></footer>
    </main>
  </div>
}
