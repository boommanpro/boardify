<p align="center">
  <img src=".github/logo.svg" width="96" alt="boardify logo">
</p>
<h1 align="center">boardify</h1>
<p align="center">
  把一次性 demo 变成可验证、可交付、可维护的数据大盘。<br>
  一个面向 AI Agent 的 <strong>数据看板 / 大屏构建技能</strong>（React + Vite + TypeScript + shadcn/ui + ECharts）。
</p>
<p align="center">
  <a href="https://github.com/boommanpro/boardify/actions/workflows/ci.yml"><img src="https://github.com/boommanpro/boardify/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://boommanpro.github.io/boardify/"><img src="https://img.shields.io/badge/demo-GitHub%20Pages-green" alt="Live Demo"></a>
</p>

---

## 特性

- **场景配方**：经营看板 / 指挥大屏 / 运维监控 / 增长分析 / 物流地域 / 人力财务六大配方，组件块 × 图表工厂 × 配色一键组合，字段替换即成业务看板。
- **看板组件套件**：PageHeader、FilterBar、KpiCard（迷你趋势/目标进度）、ChartCard、DataTable、StatusBlock、RegionMap 与大屏 ScreenFrame/Panel，全走语义令牌。
- **多品牌色**：green / blue / amber / violet / neutral / teal / rose / midnight 八套明暗双模预设，按业务场景一行选定，用户偏好可运行时切换；图表颜色经令牌适配层自动联动。
- **图表标准化**：统一 ECharts 封装（尺寸观察、事件解绑、销毁），内置趋势/排行/占比/堆叠/热力/散点/雷达/漏斗/仪表/地图打点飞线 option 工厂与选型矩阵。
- **国产化地图**：DataV GeoAtlas 本地资源化，运行时零外网依赖；内置 34 省 adcode 权威表与实测事实，防止模型编造边界。
- **多级下钻**：全国 → 省 → 市 → 区县逐级下钻，面包屑返回、失败重试、请求竞态隔离。
- **强制交付验证**：14 项证据门禁（G-01 ~ G-14），未走完验证流水线不得声称"完成"。

## 在线演示

示例工程维护于 `examples` 分支，自动构建并发布（[示例索引页](https://boommanpro.github.io/boardify/)）：

- [电商单屏经营大盘](https://boommanpro.github.io/boardify/ecommerce/) — 省市区地图下钻，三分辨率适配
- [全国农业数据大屏](https://boommanpro.github.io/boardify/agriculture/) — 16:9 定屏等比缩放，滚轮缩放平移
- [运维监控看板](https://boommanpro.github.io/boardify/ops-monitor/) — 自动刷新、P50/P95 延迟、错误热力与分级告警
- [销售增长分析看板](https://boommanpro.github.io/boardify/sales-growth/) — 转化漏斗、留存矩阵、用户分层气泡
- [营销活动指挥大屏](https://boommanpro.github.io/boardify/command-center/) — midnight 配色、合成地图下钻、六维画像雷达

## 快速开始

将技能本体 `skills/boardify/` 复制到 Agent 平台的 skills 目录（Trae / Claude Code 等），然后：

```sh
cd skills/boardify
node scripts/init.mjs /absolute/path/to/dashboard   # 从模板新建工程
cd /absolute/path/to/dashboard && npm ci && npm run dev
```

## 文档

| 文档 | 内容 |
| --- | --- |
| [SKILL.md](skills/boardify/SKILL.md) | 技能入口：流程、固定边界、硬性规则 |
| [references/](skills/boardify/references/) | 需求契约、工程规范、设计系统、ECharts、中国地图、交付验证 |
| [场景配方](skills/boardify/references/scenarios.md) | 六大场景的组件 × 图表 × 配色组合约定 |
| [China Maps 规范](skills/boardify/references/china-maps.md) | 地图来源、许可门禁与防乱答事实表 |

## 许可

文档与代码基于 [MIT](LICENSE) 分发；地图与示例数据源自阿里云 DataV.GeoAtlas，仅供学习交流，未取得商用与再分发许可，详见 [地图合规](skills/boardify/references/china-maps.md)。
