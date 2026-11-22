import { useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataTableColumn<Row> {
  key: string
  header: React.ReactNode
  cell: (row: Row) => React.ReactNode
  /** 数字列：右对齐 + 等宽数字 */
  numeric?: boolean
  /** 提供取值函数即启用点击表头排序（数值或字符串比较） */
  sortValue?: (row: Row) => string | number
}

/**
 * 明细表：列配置驱动，替代各页面手写表格。
 * 排序只依赖 sortValue 的返回值；空数据显示 empty 文案而不是伪造零行。
 */
export function DataTable<Row>({ columns, rows, rowKey, empty = '暂无数据', className }: {
  columns: DataTableColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string | number
  empty?: React.ReactNode
  className?: string
}) {
  const [sort, setSort] = useState<{ key: string; direction: 1 | -1 } | null>(null)
  const sorted = sort
    ? [...rows].sort((a, b) => {
        const column = columns.find(column => column.key === sort.key)
        if (!column?.sortValue) return 0
        const left = column.sortValue(a)
        const right = column.sortValue(b)
        return (left < right ? -1 : left > right ? 1 : 0) * sort.direction
      })
    : rows
  function toggle(key: string) {
    const column = columns.find(column => column.key === key)
    if (!column?.sortValue) return
    setSort(current => current?.key === key
      ? current.direction === 1 ? { key, direction: -1 } : null
      : { key, direction: 1 })
  }
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map(column => {
            const sortable = Boolean(column.sortValue)
            const active = sort?.key === column.key
            const Icon = !active ? ArrowUpDown : sort.direction === 1 ? ArrowUp : ArrowDown
            return (
              <TableHead
                key={column.key}
                aria-sort={active ? (sort!.direction === 1 ? 'ascending' : 'descending') : sortable ? 'none' : undefined}
                className={cn(column.numeric && 'text-right', sortable && 'cursor-pointer select-none', active && 'text-foreground')}
              >
                {sortable
                  ? <button type="button" onClick={() => toggle(column.key)} className={cn('inline-flex items-center gap-1', column.numeric && 'flex-row-reverse')}>
                    {column.header}
                    <Icon className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">排序</span>
                  </button>
                  : column.header}
              </TableHead>
            )
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.length === 0
          ? <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">{empty}</TableCell></TableRow>
          : sorted.map(row => (
            <TableRow key={rowKey(row)}>
              {columns.map(column => (
                <TableCell key={column.key} className={cn(column.numeric && 'text-right tabular-nums')}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  )
}
