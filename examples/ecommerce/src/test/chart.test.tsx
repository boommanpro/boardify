import { render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Chart } from '@/components/chart'

const mocks = vi.hoisted(() => ({
  setOption: vi.fn(), on: vi.fn(), off: vi.fn(), resize: vi.fn(), dispose: vi.fn(),
}))
vi.mock('@/lib/charts', () => ({ echarts: { init: vi.fn(() => mocks) } }))
afterEach(() => vi.unstubAllGlobals())

it('图表响应尺寸变化、分发点击，并清理事件和实例', () => {
  let resize!: () => void
  const observe = vi.fn()
  const disconnect = vi.fn()
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback }
    observe = observe
    disconnect = disconnect
  })
  const onSelect = vi.fn()
  const { rerender, unmount } = render(<Chart option={{}} theme="light" label="图表" onSelect={onSelect} />)
  expect(observe).toHaveBeenCalled()
  expect(mocks.setOption).toHaveBeenCalledWith({ backgroundColor: 'transparent' }, { notMerge: true })
  resize()
  expect(mocks.resize).toHaveBeenCalled()
  mocks.on.mock.calls[0][1]({ componentType: 'series', seriesType: 'map', name: '测试区域' })
  expect(onSelect).toHaveBeenCalledWith('测试区域')
  rerender(<Chart option={{ series: [] }} theme="light" label="图表" />)
  expect(mocks.dispose).not.toHaveBeenCalled()
  rerender(<Chart option={{}} theme="dark" label="图表" />)
  expect(mocks.dispose).toHaveBeenCalledTimes(1)
  unmount()
  expect(mocks.dispose).toHaveBeenCalledTimes(2)
  expect(disconnect).toHaveBeenCalledTimes(2)
  expect(mocks.off).toHaveBeenCalledTimes(2)
})
