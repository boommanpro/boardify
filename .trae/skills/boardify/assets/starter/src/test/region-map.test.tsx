import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RegionMap } from '@/components/region-map'
import { loadMap, type MapData } from '@/lib/maps'
import { echarts } from '@/lib/charts'

vi.mock('@/components/chart', () => ({ Chart: ({ label, option }: { label: string; option: { series: { map: string; data: { name: string }[] }[] } }) => {
  const series = option.series[0]
  const registered = echarts.getMap(series.map)
  expect(registered, `图表渲染前必须注册 ${series.map}`).toBeDefined()
  expect(series.data.map(item => item.name)).toEqual((registered.geoJSON as MapData).features.map(feature => feature.properties.name))
  return <div role="img" aria-label={label} />
} }))
describe('地图交互', () => {
  it('下级注册完成前不挂载图表，等待期间切换主题也不使用旧数据', async () => {
    let resolve!: (data: MapData) => void
    const loader = vi.fn((id: string) => id === 'south' ? new Promise<MapData>(done => { resolve = done }) : loadMap(id))
    const { rerender } = render(<RegionMap theme="light" loader={loader} />)
    fireEvent.click(await screen.findByRole('button', { name: '南部示范区' }))
    await waitFor(() => expect(loader).toHaveBeenCalledWith('south'))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('正在加载本地地图…')).toBeInTheDocument()
    rerender(<RegionMap theme="dark" loader={loader} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    await act(async () => { resolve(await loadMap('south')) })
    expect(await screen.findByRole('img', { name: '南部示范区合成服务地图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '星湖片区' })).toBeEnabled()
  })
  it('支持三级下钻、叶级提示、返回和面包屑', async () => {
    render(<RegionMap theme="light" />)
    expect(screen.getByText('正在加载本地地图…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '返回上级' })).toBeDisabled()
    fireEvent.click(await screen.findByRole('button', { name: '北部示范区' }))
    fireEvent.click(await screen.findByRole('button', { name: '云港片区' }))
    fireEvent.click(await screen.findByRole('button', { name: '核心服务网格' }))
    expect(screen.getByRole('status')).toHaveTextContent('已到第三级')
    fireEvent.click(screen.getByRole('button', { name: '返回上级' }))
    expect(await screen.findByRole('button', { name: '云港片区' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: '全域' }))
    expect(await screen.findByRole('button', { name: '南部示范区' })).toBeEnabled()
  })
  it('加载失败后可重试', async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error('资源读取失败')).mockImplementation(loadMap)
    render(<RegionMap theme="dark" loader={loader} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('资源读取失败')
    fireEvent.click(screen.getByRole('button', { name: '重试' }))
    expect(await screen.findByRole('button', { name: '北部示范区' })).toBeEnabled()
  })
  it('加载下级失败时仍能返回', async () => {
    const loader = vi.fn((id: string) => id === 'north' ? Promise.reject(new Error('下级缺失')) : loadMap(id))
    render(<RegionMap theme="light" loader={loader} />)
    fireEvent.click(await screen.findByRole('button', { name: '北部示范区' }))
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: '返回上级' }))
    expect(await screen.findByRole('button', { name: '南部示范区' })).toBeEnabled()
  })
  it('忽略返回后才完成的旧请求', async () => {
    let resolve!: (data: MapData) => void
    const loader = vi.fn((id: string) => id === 'north' ? new Promise<MapData>(done => { resolve = done }) : loadMap(id))
    render(<RegionMap theme="light" loader={loader} />)
    fireEvent.click(await screen.findByRole('button', { name: '北部示范区' }))
    await waitFor(() => expect(loader).toHaveBeenCalledWith('north'))
    fireEvent.click(screen.getByRole('button', { name: '返回上级' }))
    await screen.findByRole('button', { name: '南部示范区' })
    resolve(await loadMap('north'))
    await waitFor(() => expect(screen.queryByRole('button', { name: '云港片区' })).not.toBeInTheDocument())
  })
})
