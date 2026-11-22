import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export type DataTable = { columns: string[]; rows: (string | number)[][] }

/**
 * 图表卡片：统一标题/描述/操作区/高度，图表之后可展开可访问数据表（不以 Canvas 元素存在作为图表正确的证据）。
 */
export function ChartCard({ title, description, action, table, children, footer }: {
  title: string
  description?: string
  action?: React.ReactNode
  table?: DataTable
  children: React.ReactNode
  footer?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {children}
        {table && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none">查看数据表</summary>
            <Table className="mt-2">
              <TableHeader><TableRow>{table.columns.map(column => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
              <TableBody>{table.rows.map((row, index) => <TableRow key={index}>{row.map((cell, cellIndex) => <TableCell key={cellIndex} className="tabular-nums">{cell}</TableCell>)}</TableRow>)}</TableBody>
            </Table>
          </details>
        )}
        {footer && <p className="text-xs text-muted-foreground">{footer}</p>}
      </CardContent>
    </Card>
  )
}
