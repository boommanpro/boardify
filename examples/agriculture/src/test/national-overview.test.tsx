import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import NationalOverview from '@/national-overview'
import { NationalMap } from '@/components/national-map'

vi.mock('@/hooks/use-screen-scale', () => ({ useScreenScale: () => 1 }))
afterEach(cleanup)

describe('批准稿全国页面', () => {
  it('展示全国数据并通过控制入口切换指标', () => {
    render(<NationalOverview />)
    expect(screen.getByRole('heading', { name: '全国农业总览' })).toBeInTheDocument()
    expect(screen.getByText('70,111')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: '切换地图指标' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '打开地图指标与区域控制' }))
    fireEvent.click(screen.getByRole('button', { name: '耕地面积' }))
    expect(screen.getByRole('button', { name: '耕地面积' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('耕地面积 / 万亩')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '关闭控制' }))
    expect(screen.queryByRole('group', { name: '切换地图指标' })).not.toBeInTheDocument()
  })
  it('全国全部省域支持点击、回车与空格下钻', () => {
    const navigate = vi.fn()
    render(<NationalMap metric="grain" onNavigate={navigate} />)
    expect(screen.getAllByRole('button')).toHaveLength(34)
    const province = screen.getByRole('button', { name: /黑龙江省，/ })
    fireEvent.click(province)
    fireEvent.keyDown(province, { key: 'Enter' })
    fireEvent.keyDown(province, { key: ' ' })
    expect(navigate).toHaveBeenCalledTimes(3)
    expect(navigate).toHaveBeenLastCalledWith('230000')
  })
})
