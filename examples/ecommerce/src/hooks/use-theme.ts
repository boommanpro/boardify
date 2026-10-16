import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
function initialTheme(): Theme {
  try {
    const value = localStorage.getItem('boardify-theme')
    if (value === 'light' || value === 'dark') return value
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    try { localStorage.setItem('boardify-theme', theme) } catch {}
  }, [theme])
  return { theme, toggleTheme: () => setTheme(value => value === 'dark' ? 'light' : 'dark') }
}
