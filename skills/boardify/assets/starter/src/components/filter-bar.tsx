import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface FilterField {
  /** 筛选字段标识，与筛选状态对象的键一致 */
  key: string
  label: string
  /** select：选项多或需要精确选择；tabs：2-4 个互斥项，一眼可切 */
  control: 'select' | 'tabs'
  options: { value: string; label: string }[]
}

/**
 * 筛选栏：看板共享筛选状态的唯一入口，字段配置驱动。
 * 筛选值统一为 string（数据层负责映射回业务类型）；变化统一交给数据层重新取数（见 data/source.ts）。
 */
export function FilterBar({ fields, value, onChange }: {
  fields: FilterField[]
  value: Record<string, string>
  onChange: (key: string, next: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {fields.map(field => (
        <div key={field.key} className="flex items-center gap-2">
          {field.control === 'select' ? (
            <>
              <Label htmlFor={`filter-${field.key}`} className="text-sm text-muted-foreground">{field.label}</Label>
              <Select value={value[field.key]} onValueChange={next => onChange(field.key, next)}>
                <SelectTrigger id={`filter-${field.key}`} aria-label={field.label}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {field.options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">{field.label}</span>
              <Tabs value={value[field.key]} onValueChange={next => onChange(field.key, next)}>
                <TabsList aria-label={field.label}>
                  {field.options.map(option => <TabsTrigger key={option.value} value={option.value}>{option.label}</TabsTrigger>)}
                </TabsList>
              </Tabs>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
