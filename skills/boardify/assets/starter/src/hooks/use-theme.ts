import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
function initialTheme(): Theme {
  try {
    const value = localStorage.getItem('boardify-theme')
    if (value === 'light' || value === 'dark') return value
  } catch { /* localStorage 不可用（如隐私模式）时回退到系统主题 */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    try { localStorage.setItem('boardify-theme', theme) } catch { /* 持久化失败不影响本次会话 */ }
  }, [theme])
  return { theme, toggleTheme: () => setTheme(value => value === 'dark' ? 'light' : 'dark') }
}
