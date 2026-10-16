# ECharts 实施规范

## 版本与模块

先记录实际安装版本、锁文件和适用官方文档；不得把 v5 升级说明当作当前版本声明。优先按需引入 echarts/core、需要的图表、组件与渲染器，再调用 use 注册。

| 用途 | 必须核对的模块 |
| --- | --- |
| 折线／条形 | 对应 Chart、GridComponent、所用 Tooltip/Legend/Dataset 组件 |
| 数据缩放 | DataZoomComponent |
| 地图着色 | MapChart、所用 VisualMapComponent |
| 地理坐标点位 | GeoComponent、相应散点 Chart |
| 无障碍描述 | AriaComponent 与当前版本支持的配置 |
| 渲染 | CanvasRenderer 或 SVGRenderer，至少一个 |

以实际 option 为准补齐模块；不能把表当作所有配置的完整导入清单。使用 TypeScript 时采用已安装版本提供的类型，禁止用任意类型屏蔽配置错误。

## 图表选型矩阵（数据问题 → 图表）

先按要回答的问题选图表，再写 option。以下为项目内置选型矩阵，拿不准时给用户两个选项，不自行决定：

| 要回答的问题 | 用什么 | 备注 |
| --- | --- | --- |
| 指标随时间怎么变 | 折线 / 面积图 | 点多时 `sampling: 'lttb'`；时间跨度大加 dataZoom |
| 类别谁多谁少 | 柱状图（类目多或名字长用条形） | 先排序再展示；条形默认从下往上小值在下 |
| 整体构成占比 | 环形饼 | 类别超过 6 个时聚合为“其他” |
| 单个核心指标现在多少 | KPI 数字卡（非图表） | 可加迷你趋势线 |
| 地域分布 | 中国地图填色 choropleth | 见 china-maps.md |
| 城市点位 / 重点标记 | 地图 + effectScatter | 见 china-maps.md |
| 两地流向 | 地图飞线 lines | 见 china-maps.md |
| 两个变量是否相关 | 散点 / 气泡 | 气泡用第三维 |
| 多维度综合对比 | 雷达 | 维度 3 至 8 个合适 |
| 单指标离目标多远 | 仪表盘 gauge | 仅用户明确要求仪表盘时 |
| 时间 × 类别的量 | 堆叠柱 / 热力图 | — |

## 生命周期强制流程

沿用 starter 的图表容器并保留尺寸观察、事件解绑和销毁机制。当前容器使用 SVG 渲染器，在 option 或 theme 变化时销毁并重建实例；这不是数据增量更新或交互状态保留的完整实现。接入业务更新时按下列要求补齐，不能将模板存在视为全部要求已满足。

1. 容器挂载且宽高大于零后初始化；隐藏标签页延迟初始化或显现后 resize。
2. 同一容器保持一个有效实例，数据变化用 setOption 更新；卸载销毁后才重新初始化。
3. 使用 ResizeObserver 观察容器变化并合并频繁调用；仅监听窗口 resize 不能覆盖侧栏展开或栅格重排。
4. 为系列与数据集设置稳定标识。减少系列或切换地图时，明确使用当前版本支持的替换／非合并策略，防止旧系列残留；不要每次无差别 clear 破坏选择与缩放。
5. 事件处理器保持稳定且只注册一次；卸载移除监听、观察器、定时器并 dispose；异步回调写入前确认实例有效。
6. 主题变化更新颜色或按需重建实例，保留筛选、图例选择和缩放状态；验证切换不会重复绑定事件。

## 数据与配置

- 表格型数据优先使用 dataset，显式声明 dimensions 和 encode；配置、原始数据、业务转换分离。树、图等特殊结构按对应系列使用 series.data。
- 对同一系列不要同时依赖 dataset 和 series.data 的隐含优先级；明确唯一数据来源。
- 坐标轴、提示、标签和导出复用格式化函数；单位缩放仅发生一次。百分数、金额、时间采用 requirements.md 的口径。
- 缺失保持缺失语义；零与负值使用真实数值。折线是否跨缺失连线必须由业务决定，不能默认制造连续趋势。
- 数值比较条形默认从零起；非零基线、双轴、对数轴必须提供业务理由与清晰标识。
- 显式控制图例、坐标轴标签、网格留白和提示位置；长中文名称允许截断但必须能查看全文。
- tooltip 优先文本或安全渲染模式；使用 HTML formatter 时必须转义所有不可信字段，禁止拼接接口返回 HTML。

## option 底座与模板

每个 option 工厂合并一份底座，保证整页 tooltip、legend、网格、边距观感一致；option 一律 `useMemo`，生成函数（工厂）放图表配置目录，数据从数据层取：

```ts
// 图表配置底座
export const baseOption = {
  tooltip: { trigger: 'axis', confine: true }, // confine：防止 tooltip 被卡片裁掉
  legend: { top: 0 },
  grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
}
```

趋势折线（含 dataZoom）：

```ts
export function buildTrendOption(data) {
  return {
    ...baseOption,
    xAxis: { type: 'category', boundaryGap: false, data: data.map(d => d.date) },
    yAxis: { type: 'value' },
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 0 }],
    series: [{ type: 'line', name: '销售额', smooth: true, data: data.map(d => d.value), areaStyle: { opacity: 0.12 } }],
  }
}
```

类别排行条形（小值在下，从下往上）：

```ts
export function buildRankOption(rows) {
  const sorted = [...rows].sort((a, b) => a.value - b.value)
  return {
    ...baseOption,
    tooltip: { trigger: 'item', confine: true },
    grid: { ...baseOption.grid, bottom: 0 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: sorted.map(r => r.name) },
    series: [{ type: 'bar', name: '数值', data: sorted.map(r => r.value), barMaxWidth: 18 }],
  }
}
```

占比环形：

```ts
export function buildShareOption(rows) {
  return {
    tooltip: { trigger: 'item', confine: true },
    legend: { bottom: 0, type: 'scroll' },
    series: [{ type: 'pie', radius: ['55%', '80%'], center: ['50%', '45%'], data: rows, label: { formatter: '{b} {d}%' } }],
  }
}
```

实际类型与字段以目标项目的数据类型为准；这里只表达可复制范式，不做 `any`。区域填色模板见 china-maps.md 的 choropleth 示例。

## 主题适配

从当前元素的计算样式读取设计令牌，解析为目标渲染器已经验证的具体颜色；必要时统一转换为 RGB／十六进制。只读取到 oklch(...) 字符串不代表当前 ECharts／zrender 版本支持该格式。记录转换策略并检查明暗主题、截图和导出一致性。

文字、轴线、网格、浮层、选中与无数据样式全部走语义角色。series 顺序变化不能让同一业务实体换色。动画服从减少动态效果偏好，大数据不启用无意义循环动画。

## 交互和无障碍

事件先核对 componentType、seriesType 和数据标识，不能用展示名称作为唯一业务键。图例联动监听适用的 legendselectchanged；程序触发用 dispatchAction，但这不能代替浏览器真实点击验收。联动图表避免事件回环。

为图表提供中文标题、范围、结论、键盘可操作的外部控件及数据表。开启可用的 ARIA 描述，必要时使用纹理增强区分；自动描述不等于支持键盘下钻。

下钻类地图的系列选型与交互坑（geo 组件点击不触发、打点拦截点击、不双画叠层、先注册再 setOption）见 [china-maps.md](china-maps.md) 的“下钻与地图交互实测坑”。地图/图表验证不能只检查 canvas 元素存在，还要核对可见数据、色阶非单色和交互结果。

官方 ARIA 手册读取内容同时出现 aria.show 与 aria.enabled 等写法。必须以实际版本类型、配置文档及生成的 DOM 描述验证具体属性；不能照抄混用后宣称生效。

## 常见故障速查

| 症状 | 根因 | 修复 |
| --- | --- | --- |
| 图表空白、无报错 | 容器高度为 0 | 给确定高度；flex 布局加 `min-h-0` |
| Unknown series / component | 未按需注册 | 在 echarts 注册入口补 `echarts.use` 对应项 |
| tooltip 被裁剪 | 溢出容器 | `tooltip.confine: true`（底座已含） |
| 数据量大卡顿 | 全量渲染 | `sampling: 'lttb'` / `large: true` / dataZoom |
| 切数据残留旧系列 | 合并更新残留 | 用替换策略；不要每次无差别 clear |
| 主题切换后图表颜色不变 | 色板在挂载时读取 | 需要重建时用 `key={theme}` 强制重建 |
| Map xxx not exists | 未注册就渲染 | 先 `await loadGeo(code)` 完成 registerMap 再 setOption |

## 必测用例

| 编号 | 操作 | 通过条件 |
| --- | --- | --- |
| E-01 | 初始加载、隐藏后显现、侧栏展开、窗口缩放 | 尺寸正确，无空白或裁切 |
| E-02 | 连续更新并减少系列，进入空数据再恢复 | 无旧系列残留，单位与总量正确 |
| E-03 | 进入退出页面至少 10 次 | 无重复点击响应，无持续增长的实例或监听；记录观察方法 |
| E-04 | 切换主题、长标签、极值与缺失数据 | 可读、无无效颜色、缺失不冒充零 |
| E-05 | 真实操作图例、缩放、提示及筛选 | 图表与表格状态一致，可重置 |
| E-06 | 约定最大数据量连续操作 | 满足已记录性能预算；无预算则不能声称性能达标 |

## 来源与无法验证项

调研日期：2026-10-15；以下官方正文均已读取。

| 来源 | 支撑结论 |
| --- | --- |
| https://echarts.apache.org/handbook/en/basics/import/ | 按需注册、显式渲染器、ComposeOption |
| https://echarts.apache.org/handbook/en/concepts/chart-size/ | 容器尺寸、resize、ResizeObserver、dispose |
| https://echarts.apache.org/handbook/en/concepts/dataset/ | 数据配置分离、dimensions、encode、series.data 优先性 |
| https://echarts.apache.org/handbook/en/concepts/event/ | 事件参数、查询过滤、legendselectchanged、dispatchAction |
| https://echarts.apache.org/handbook/en/best-practices/aria/ | 描述与纹理能力；属性写法存在需按版本复核处 |
| https://echarts.apache.org/handbook/en/basics/release-note/v5-upgrade-guide/ | v5 移除内置 GeoJSON、默认导出等迁移变化 |

上述官方文档调研不构成 ECharts 运行验证；starter 已声明 ECharts 依赖并提供锁文件，但具体版本兼容性、浏览器、渲染器颜色格式、内存曲线与性能仍须以目标工程实测为准。以上用例是强制验收要求，不是已通过的测试结果。
