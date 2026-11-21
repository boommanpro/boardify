# 场景配方：从需求到看板

## 用法

配方 = 「组件块 × 图表工厂 × 配色」的组合约定，不是页面代码，更不是默认需求。流程不变：先按 [requirements.md](requirements.md) 定契约，命中下表信号词后按对应配方组装，字段与指标一律替换为业务口径，最后照 [delivery-validation.md](delivery-validation.md) 验收。用户需求跨场景时拆分区域，不为凑配方塞进无关模块。

所有配方共享的固定动作：

- 页头用 `PageHeader`，筛选统一进 `FilterBar`，图表一律包 `ChartCard` 并提供可访问数据表。
- 数据层（`data/source.ts`）是唯一出口；KPI、图表、表格共用同一筛选口径。
- 颜色只经 `useChartTheme(theme, palette)`；KPI 方向好坏用 `KpiCard` 的 `tone` 显式声明。
- 未列出的场景按 [echarts.md](echarts.md) 选型矩阵自行组合，不发明新图表类型。

## 配方总览

| 配方 | 信号词 | 布局形态 | 推荐配色 |
| --- | --- | --- | --- |
| 经营运营看板 | 看板、总览、经营分析 | 响应式 Web | green（默认） |
| 指挥大屏 | 大屏、指挥中心、投屏、值守 | 16:9 定屏缩放 | midnight（强制深色） |
| 运维监控 | 监控、告警、值班、SLO | 响应式 + 自动刷新 | amber / midnight |
| 销售增长分析 | 转化、留存、漏斗、增长 | 响应式 Web | violet |
| 物流地域分析 | 物流、流向、网点、调度 | 响应式 + 地图 | blue |
| 人力财务分析 | 人力、成本、预算、编制 | 表格密集型 | neutral / blue |

## 1. 经营运营看板（默认形态）

starter 演示页即此配方的完整参照，直接在其上替换字段。

- **骨架**：`PageHeader` + `FilterBar` → KPI 区（`KpiCard`×4，sparkline/progress 按需）→ 趋势 + 构成两卡 → 地图（可选）+ 排行卡 → 明细 `DataTable`。
- **图表工厂**：`buildTrendOption`（新增/完成等多系列）、`buildShareOption`、`buildRankOption`、`buildStackedBarOption`；地域数据走 `RegionMap`。
- **数据契约**：同环比口径写清比较窗口；构成类各分项求和须等于卡片汇总。
- **追加验证**：G-05 手算一组分项加总 = 总量；筛选切换后所有卡片同步变化。

## 2. 指挥大屏（16:9 定屏）

- **骨架**：`ScreenFrame`（内部强制深色 + 等比缩放）内用 `Panel` 组网：顶部标题栏（时钟、全屏）→ KPI 条 → 左右 `Panel` 列 + 中央地图/主图 → 底部趋势条。不用响应式重排，低于设计尺寸如实等比缩小。
- **图表工厂**：中央 `RegionMap` 或 `buildGeoOption` + `buildMapScatterSeries`；构成 `buildShareOption`；多维对比 `buildRadarOption`；趋势 `buildTrendOption`。
- **配色**：`midnight` 写入 index.html；大屏不提供明暗切换。
- **数据契约**：单屏信息量有上限——KPI ≤ 6，每面板一个结论；数据时间与口径在大屏上可见。
- **追加验证**：缩放后文字最小可读字号 ≥ 14px（设计稿尺寸）；下钻原位交互不被缩放破坏；G-07 在目标分辨率与 2K 各截图一次。

## 3. 运维监控

- **骨架**：`PageHeader`（含自动刷新开关与倒计时）→ 服务健康 KPI（可用率/延迟/错误率/告警数，`tone` 显式声明好坏）→ 多序列延迟趋势 → 资源负载 `Panel` → 告警明细 `DataTable`（级别 Badge、可排序）。内容区加载态用 `StatusBlock`。
- **图表工厂**：`buildTrendOption`（多序列：P50/P95/P99）、`buildHeatmapOption`（时段错误分布）、`buildStackedBarOption`（按服务维度拆分请求量）。仪表盘只在用户明确要求时用 `buildGaugeOption`，否则 KPI 卡 + Progress 更合适。
- **刷新**：`useAutoRefresh(onTick, intervalMs, enabled)`；轮询间隔 ≥ 1s 并在需求中记录；页面隐藏（`visibilitychange`）或用户暂停时停表。
- **数据契约**：每次刷新整体推进一个数据版本，禁止只有 KPI 跳动而图表不动；告警级别（提示/警告/严重）映射 `warning`/`destructive` 语义色并附文字，不只靠颜色。
- **追加验证**：刷新期间排序与筛选状态不丢；告警出现→确认→恢复全链路可见；G-06 注入一次失败展示可重试。

## 4. 销售增长分析

- **骨架**：`PageHeader` + 时间/客群 `FilterBar` → 转化漏斗卡 → 留存热力卡 → 各阶段趋势 → 客单分布 → 明细 `DataTable`。
- **图表工厂**：`buildFunnelOption`（漏斗占比按首级口径，工厂已处理）、`buildHeatmapOption`（周次 × 生命周期留存）、`buildScatterOption`（客单价 × 频次，气泡 = 消费额）、`buildTrendOption`。
- **数据契约**：漏斗各级包含关系（访问 ⊃ 下单 ⊃ 支付 ⊃ 复购）；留存矩阵分母为同期队列人数；转化率写明分母。
- **追加验证**：G-05 手算漏斗相邻两级转化率与界面一致；留存对角线语义正确（注册当周为 100%）。

## 5. 物流地域分析

- **骨架**：`PageHeader` + 发货/到货 `FilterBar` → 全国地图（填色 + 打点 + 飞线）→ 干线流向排行 → 网点时效 `DataTable`。地图须先过 [china-maps.md](china-maps.md) 许可门禁。
- **图表工厂**：填色下钻用 `RegionMap`（map series）；只打点/飞线时用 `buildGeoOption` + `buildMapScatterSeries` + `buildMapLinesSeries`，**不与 map series 双画叠层**；需要下钻的地图上打点必须 `silent: true` 穿透。时效排行 `buildRankOption`。
- **数据契约**：流向数据成对（起讫点 adcode + 坐标），坐标只来自内置表或 GeoJSON `properties.center`；单量与流向粗细量纲写明。
- **追加验证**：G-12/G-13 全量适用；打点不拦截区域点击下钻；飞线动画尊重减少动态效果偏好。

## 6. 人力财务分析

- **骨架**：`PageHeader` + 周期/主体 `FilterBar` → 预算执行 KPI（`progress` 目标达成）→ 编制/成本构成 → 部门对比堆叠 → 大宽明细 `DataTable`（分页或虚拟滚动，先定策略）。此配方表格是主体，图表是摘要。
- **图表工厂**：`buildStackedBarOption`（部门 × 费用科目）、`buildShareOption`（编制构成）、`buildTrendOption`（预算执行进度）。
- **数据契约**：金额统一币种与单位缩放（分存储、展示万元）；预算达成率 = 实际/预算，超支用 `destructive` 并配文字；比例分母为零显示缺失。
- **追加验证**：G-05 抽三个部门手算合计对总卡；导出与屏幕同筛选同口径；长文本部门名不破版（G-07）。

## 组件速查

| 组件 / Hook | 职责 | 慎用 |
| --- | --- | --- |
| `PageHeader` / `FilterBar` | 页头与共享筛选唯一入口 | 筛选散落在卡片内各写一套 |
| `KpiCard` | 数字卡：方向 + 好坏 tone + sparkline + progress | 用图表实现单个指标 |
| `Sparkline` | 内联 SVG 迷你趋势线 | 为迷你线建 ECharts 实例 |
| `ChartCard` + `Chart` | 图表卡片与统一 ECharts 容器 | 绕过容器散落 `echarts.init` |
| `DataTable` | 列配置明细表（排序/空态/数字列） | 手写表格丢掉空态与对齐 |
| `StatusBlock` | loading/empty/error 统一展示 | 永久骨架或空白面板 |
| `RegionMap` | 三级下钻填色地图（合成演示图） | 未经许可接入真实地图 |
| `ScreenFrame` / `Panel` | 大屏 16:9 缩放与面板 | 与响应式看板混用 |
| `useAutoRefresh` | 轮询刷新（可暂停） | 无上限高频轮询 |
| `usePalette` / `PaletteSwitch` | 色板运行时覆盖（用户偏好） | 每个页面各选各的色板 |

## 来源与无法验证项

配方为 boardify 项目规范，不是外部最佳实践摘录；信号词来自已交付示例（电商经营大盘、农业大屏）与常见任务描述。各配色的场景适配是建议起点，用户品牌约束始终优先（requirements.md 默认假设表）。
