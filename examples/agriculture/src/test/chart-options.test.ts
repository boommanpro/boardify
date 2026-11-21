import { expect, it } from 'vitest'
import { shareOption } from '@/lib/chart-options'

it('环图占满可用区域并为底部图例预留空间', () => {
  const option = shareOption([{ name: '农业', value: 100 }], { label: '总产值', value: '100' })
  expect(option.series).toEqual([expect.objectContaining({
    type: 'pie', top: 0, bottom: 26, radius: ['66%', '94%'], center: ['50%', '50%'],
  })])
  expect(option.legend).toEqual(expect.objectContaining({ bottom: 0, type: 'scroll' }))
})
