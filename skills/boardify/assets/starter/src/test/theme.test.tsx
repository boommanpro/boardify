import { act, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useTheme } from '@/hooks/use-theme'

it('读取持久化主题并切换', () => {
  localStorage.setItem('boardify-theme', 'dark')
  const { result } = renderHook(useTheme)
  expect(document.documentElement).toHaveClass('dark')
  act(() => result.current.toggleTheme())
  expect(result.current.theme).toBe('light')
  expect(localStorage.getItem('boardify-theme')).toBe('light')
  expect(document.documentElement).not.toHaveClass('dark')
})
it('存储不可用时仍能切换', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied') })
  const { result } = renderHook(useTheme)
  act(() => result.current.toggleTheme())
  expect(result.current.theme).toBe('dark')
})
