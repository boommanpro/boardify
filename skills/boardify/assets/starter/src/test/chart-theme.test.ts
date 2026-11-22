import { describe, expect, it } from 'vitest'
import { resolveChartTheme, toSafeColor } from '@/lib/chart-theme'

describe('图表主题适配层', () => {
  it('hex 与 rgb 原样通过，空值与非法值回退 null', () => {
    expect(toSafeColor('#34815b')).toBe('#34815b')
    expect(toSafeColor('rgb(10, 20, 30)')).toBe('rgb(10, 20, 30)')
    expect(toSafeColor('')).toBeNull()
  })
  it('无法读取令牌时返回完整兜底色板，图表不空白', () => {
    const theme = resolveChartTheme()
    expect(theme.palette).toHaveLength(5)
    for (const value of [theme.text, theme.line, theme.primary, theme.mapFrom, theme.success, theme.warning, theme.destructive, ...theme.palette]) {
      expect(value).toMatch(/^#|^rgb/)
    }
  })
})
