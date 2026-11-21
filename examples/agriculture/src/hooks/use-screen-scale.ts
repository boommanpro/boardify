import { useEffect, useState } from 'react'

// 大屏 16:9 定屏等比缩放：设计稿 1920×1080，按视口最小比例缩放。
export function useScreenScale(designWidth = 1920, designHeight = 1080) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / designWidth, window.innerHeight / designHeight))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [designWidth, designHeight])
  return scale
}
