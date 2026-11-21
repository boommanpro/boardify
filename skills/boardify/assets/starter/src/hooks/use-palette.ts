import { useEffect, useState } from 'react'

/** 内置品牌色预设（与 index.css 的 [data-palette] 块一一对应） */
export const PALETTES = ['green', 'blue', 'amber', 'violet', 'neutral', 'teal', 'rose', 'midnight'] as const
export type Palette = (typeof PALETTES)[number]

/** 切换器展示用：名称 + 适用场景（与 design-system.md 预设表保持一致） */
export const PALETTE_OPTIONS: { value: Palette; label: string }[] = [
  { value: 'green', label: 'Green · 自然可信' },
  { value: 'blue', label: 'Blue · 稳健企业' },
  { value: 'amber', label: 'Amber · 能量警觉' },
  { value: 'violet', label: 'Violet · 科技创新' },
  { value: 'neutral', label: 'Neutral · 中性高密度' },
  { value: 'teal', label: 'Teal · 医疗健康' },
  { value: 'rose', label: 'Rose · 零售消费' },
  { value: 'midnight', label: 'Midnight · 大屏科技' },
]

const STORAGE_KEY = 'boardify-palette'

function isPalette(value: string | null | undefined): value is Palette {
  return !!value && (PALETTES as readonly string[]).includes(value)
}

function initialPalette(): Palette {
  // 工程默认色板写在 index.html 的 data-palette（按业务场景选定）；localStorage 是用户偏好覆盖
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isPalette(stored)) return stored
  } catch { /* localStorage 不可用时用工程默认 */ }
  const declared = document.documentElement.dataset.palette
  return isPalette(declared) ? declared : 'green'
}

/**
 * 品牌色运行时切换：写入根元素 data-palette 并持久化。
 * chart-theme 适配层按当前计算样式取色，切换后图表在下一次解析时自动联动（主题变化经 useChartTheme 触发）。
 */
export function usePalette() {
  const [palette, setPalette] = useState<Palette>(initialPalette)
  useEffect(() => {
    document.documentElement.dataset.palette = palette
    try { localStorage.setItem(STORAGE_KEY, palette) } catch { /* 持久化失败不影响本次会话 */ }
  }, [palette])
  return { palette, setPalette }
}
