import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Chart } from '@/components/chart'
import type { EChartsOption } from '@/lib/charts'
import type { Theme } from '@/hooks/use-theme'

export function BusinessPanel({ title, detail, option, theme, values }: { title: string; detail: string; option: EChartsOption; theme: Theme; values: { name: string; value: string }[] }) {
  return <Card className="business-panel"><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{detail}</CardDescription></CardHeader><CardContent><Chart option={option} theme={theme} label={title} height="100%" /><dl className="sr-only">{values.map(row => <div key={row.name}><dt>{row.name}</dt><dd>{row.value}</dd></div>)}</dl></CardContent></Card>
}
