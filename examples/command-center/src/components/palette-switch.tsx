import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PALETTE_OPTIONS, type Palette } from '@/hooks/use-palette'

/**
 * 配色切换器：用户偏好覆盖工程默认色板（use-palette 持久化）。
 * 页头全局操作区使用；不需要给最终用户切换的工程直接不挂载本组件，色板仍由 index.html 决定。
 */
export function PaletteSwitch({ palette, onPaletteChange }: {
  palette: Palette
  onPaletteChange: (palette: Palette) => void
}) {
  return (
    <Select value={palette} onValueChange={value => onPaletteChange(value as Palette)}>
      <SelectTrigger aria-label="配色方案" className="w-32 sm:w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        {PALETTE_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
