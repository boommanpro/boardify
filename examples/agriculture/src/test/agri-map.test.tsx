import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import { useState } from 'react'
import { AgriMap, type Summary } from '@/components/agri-map'
import { echarts } from '@/lib/charts'
import { readGeo } from '@/lib/maps'

// 受控容器：模拟真实父组件把 onNavigate 回写到 id，驱动地图层级切换；同时透传导航事件给外部监听
function ControlledAgriMap({ onNavigate, ...props }: ComponentProps<typeof AgriMap>) {
  const [id, setId] = useState(props.id)
  return <AgriMap {...props} id={id} onNavigate={next => { setId(next); onNavigate?.(next) }} />
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe = vi.fn()
    disconnect = vi.fn()
  })
})
afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = '' })
function stubLocalFetch() {
  vi.stubGlobal('fetch', async (input: string) => {
    const file = decodeURIComponent(String(input).split('/').at(-1) ?? '')
    const path = resolve(process.cwd(), 'public/maps', file)
    const content = await readFile(path, 'utf-8')
    return { ok: true, status: 200, json: async () => JSON.parse(content) }
  })
}

vi.mock('@/components/chart', () => ({ Chart: ({ label, option, onSelect }: { label: string; option: { series: { map: string; data: { name: string }[] }[] }; onSelect?: (name: string) => void }) => {
  const series = option.series[0]
  const registered = echarts.getMap(series.map)
  expect(registered, `图表渲染前必须注册 ${series.map}`).toBeDefined()
  return <div role="img" aria-label={label}>{series.data.map(item => <button key={item.name} type="button" onClick={() => onSelect && onSelect(item.name)}>{item.name}</button>)}</div>
} }))

describe('农业地图交互（全国→省级）', () => {
  it('初始加载全国并回报全国汇总', async () => {
    stubLocalFetch()
    const onSummary = vi.fn()
    render(<ControlledAgriMap metric="grain" id="100000" theme="dark" onNavigate={() => {}} onSummary={onSummary} />)
    await screen.findByRole('img', { name: '全国农业产业分布地图' })
    expect(screen.getByRole('button', { name: '返回上级' })).toBeDisabled()
    await waitFor(() => expect(onSummary).toHaveBeenCalled())
    const summary = onSummary.mock.calls.at(-1)![0] as Summary
    expect(summary.level).toBe(1)
    expect(summary.rows).toHaveLength(34)
  })
  it('点击区域逐级下钻到区县，区县为最细层级', async () => {
    stubLocalFetch()
    const onNavigate = vi.fn()
    const onSummary = vi.fn()
    render(<ControlledAgriMap metric="grain" id="100000" theme="dark" onNavigate={onNavigate} onSummary={onSummary} />)
    fireEvent.click(await screen.findByRole('button', { name: '230000' }))
    await screen.findByRole('img', { name: '黑龙江省农业产业分布地图' })
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('230000'))
    await waitFor(() => expect((onSummary.mock.calls.at(-1)![0] as Summary).level).toBe(2))
    fireEvent.click(await screen.findByRole('button', { name: '230100' }))
    await screen.findByRole('img', { name: '哈尔滨市农业产业分布地图' })
    await waitFor(() => expect((onSummary.mock.calls.at(-1)![0] as Summary).level).toBe(3))
    fireEvent.click(await screen.findByRole('button', { name: '230103' }))
    await screen.findByRole('img', { name: '南岗区农业产业分布地图' })
    await waitFor(() => expect((onSummary.mock.calls.at(-1)![0] as Summary).level).toBe(4))
    fireEvent.click(screen.getAllByRole('button', { name: /^[0-9]{6}$/ })[0])
    expect(await screen.findByRole('status')).toHaveTextContent('已到最细层级')
  })
  it('面包屑与返回上级可逐级回到全国', async () => {
    stubLocalFetch()
    render(<ControlledAgriMap metric="grain" id="100000" theme="dark" onNavigate={() => {}} onSummary={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: '440000' }))
    await screen.findByRole('img', { name: '广东省农业产业分布地图' })
    fireEvent.click(await screen.findByRole('button', { name: '440100' }))
    await screen.findByRole('img', { name: '广州市农业产业分布地图' })
    fireEvent.click(screen.getByRole('button', { name: '返回上级' }))
    await screen.findByRole('img', { name: '广东省农业产业分布地图' })
    fireEvent.click(screen.getByRole('button', { name: '返回上级' }))
    await screen.findByRole('img', { name: '全国农业产业分布地图' })
  })
  it('加载失败可重试，失败保留原层级', async () => {
    stubLocalFetch()
    const loader = vi.fn((id: string) => id === '650000' ? Promise.reject(new Error('本地资产缺失')) : readGeo(id))
    render(<ControlledAgriMap metric="grain" id="100000" theme="dark" onNavigate={() => {}} onSummary={() => {}} loader={loader} />)
    fireEvent.click(await screen.findByRole('button', { name: '650000' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('本地资产缺失')
    fireEvent.click(screen.getByRole('button', { name: '继续查看原层' }))
    await screen.findByRole('img', { name: '全国农业产业分布地图' })
  })
  it('切换指标后汇总数值随指标更新', async () => {
    stubLocalFetch()
    const onSummary = vi.fn()
    const { rerender } = render(<ControlledAgriMap metric="grain" id="100000" theme="dark" onNavigate={() => {}} onSummary={onSummary} />)
    await screen.findByRole('img', { name: '全国农业产业分布地图' })
    rerender(<ControlledAgriMap metric="machinery" id="100000" theme="dark" onNavigate={() => {}} onSummary={onSummary} />)
    await waitFor(() => {
      const summary = onSummary.mock.calls.at(-1)![0] as Summary
      expect(summary.rows.every(row => row.value > 0)).toBe(true)
    })
  })
})
