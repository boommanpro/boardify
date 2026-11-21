import { useEffect, useRef } from 'react'

/**
 * 定时刷新：监控/值守类看板轮询数据用。
 * 间隔不小于 1 秒（防打爆后端）；enabled 为 false 时停表（页面隐藏或用户暂停）。
 * 刷新是取数行为不是动画，不适用 prefers-reduced-motion；数值变化的过渡动画仍须尊重该设置。
 */
export function useAutoRefresh(onTick: () => void, intervalMs = 30000, enabled = true) {
  const callback = useRef(onTick)
  useEffect(() => { callback.current = onTick })
  useEffect(() => {
    if (!enabled || intervalMs < 1000) return
    const timer = setInterval(() => callback.current(), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs, enabled])
}
