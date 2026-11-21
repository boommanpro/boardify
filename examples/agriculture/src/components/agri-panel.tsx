import type { ReactNode } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export function AgriPanel({ title, detail, values, children }: { title: string; detail: string; values?: { name: string; value: string }[]; children: ReactNode }) {
  return <Card className="agri-panel"><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{detail}</CardDescription></CardHeader><CardContent>{children}{values ? <dl className="sr-only">{values.map(row => <div key={row.name}><dt>{row.name}</dt><dd>{row.value}</dd></div>)}</dl> : null}</CardContent></Card>
}
