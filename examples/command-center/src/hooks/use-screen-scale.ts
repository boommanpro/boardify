import { useEffect, useState } from 'react'

/**
 * 大屏等比缩放：设计稿固定尺寸，按视口取宽高比中较小者缩放，居中 letterbox。
 * 低于设计尺寸的窗口如实「等比缩小」，不做响应式重排（大屏与看板分开验收）。
 */
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
