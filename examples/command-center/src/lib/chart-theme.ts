/*
 * 图表主题适配层：从语义令牌产出 ECharts 可直接消费的 hex 颜色。
 * 业务代码与 option 工厂只准使用本模块的返回值，禁止裸写颜色字面量（SKILL.md 硬性规则）。
 */
export type ChartTheme = {
  /** 坐标轴、标签、图例文字 */
  text: string
  /** 地图区域标签等需要高对比的正文色 */
  foreground: string
  /** 卡片底色，用于地图区域描边等需要与底融合的边线 */
  surface: string
  /** 网格线、分割线 */
  line: string
  /** 系列色板（chart-1..5），同一业务实体按稳定顺序取色 */
  palette: string[]
  primary: string
  /** 地图色阶低端（高端固定用 primary） */
  mapFrom: string
  success: string
  warning: string
  destructive: string
}

/** 令牌读取失败时的兜底色板（green 亮色），保证图表永远不空白 */
const FALLBACK: ChartTheme = {
  text: '#6b7a73',
  foreground: '#1a2925',
  surface: '#ffffff',
  line: '#dce4dc',
  palette: ['#34815b', '#7fb069', '#e0a458', '#d66853', '#5b8e7d'],
  primary: '#24644b',
  mapFrom: '#d4e8cf',
  success: '#2e7d4f',
  warning: '#b07908',
  destructive: '#b33d38',
}

let canvas: HTMLCanvasElement | null = null

/**
 * 把任意 CSS 颜色转换为 zrender 可靠解析的形式。
 * hex/rgb(a) 直接通过；oklch() 等新格式经 canvas fillStyle 往返转为浏览器已归一化的 rgb()；
 * 无法转换返回 null，由调用方回退兜底，绝不把未验证格式交给 ECharts。
 */
export function toSafeColor(value: string): string | null {
  const color = value.trim()
  if (!color) return null
  if (/^#[0-9a-fA-F]{3,8}$/.test(color) || /^rgba?\(/.test(color)) return color
  if (typeof document === 'undefined') return null
  canvas ??= document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return null
  context.fillStyle = '#000000'
  context.fillStyle = color
  const resolved = context.fillStyle
  return resolved && resolved !== '#000000' || color === '#000000' ? resolved : null
}

const TOKEN_KEYS = {
  text: '--muted-foreground',
  foreground: '--foreground',
  surface: '--card',
  line: '--border',
  primary: '--primary',
  mapFrom: '--chart-fill',
  success: '--success',
  warning: '--warning',
  destructive: '--destructive',
} as const

/** 读取当前根元素计算样式中的语义令牌并转换为安全颜色；任一令牌无效则该角色回退到兜底色 */
export function resolveChartTheme(): ChartTheme {
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') return FALLBACK
  const styles = getComputedStyle(document.documentElement)
  const pick = (token: string, fallback: string) => toSafeColor(styles.getPropertyValue(token)) ?? fallback
  const palette = [1, 2, 3, 4, 5].map(index => pick(`--chart-${index}`, FALLBACK.palette[index - 1]))
  return {
    text: pick(TOKEN_KEYS.text, FALLBACK.text),
    foreground: pick(TOKEN_KEYS.foreground, FALLBACK.foreground),
    surface: pick(TOKEN_KEYS.surface, FALLBACK.surface),
    line: pick(TOKEN_KEYS.line, FALLBACK.line),
    palette,
    primary: pick(TOKEN_KEYS.primary, FALLBACK.primary),
    mapFrom: pick(TOKEN_KEYS.mapFrom, FALLBACK.mapFrom),
    success: pick(TOKEN_KEYS.success, FALLBACK.success),
    warning: pick(TOKEN_KEYS.warning, FALLBACK.warning),
    destructive: pick(TOKEN_KEYS.destructive, FALLBACK.destructive),
  }
}
