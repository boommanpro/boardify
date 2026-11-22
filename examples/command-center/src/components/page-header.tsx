/**
 * 页头：看板首屏的标题区。eyebrow（眉题）用于标注业务域，actions 放筛选、主题切换等全局操作。
 */
export function PageHeader({ eyebrow, title, description, aside, actions }: {
  eyebrow?: string
  title: string
  description?: string
  /** 右侧补充信息（如统计范围、数据时间），与 actions 分栏排布 */
  aside?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-xs tracking-[0.2em] text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-3 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {aside && <p className="text-sm text-muted-foreground">{aside}</p>}
        {actions}
      </div>
    </section>
  )
}
