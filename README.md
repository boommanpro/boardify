# Boardify

可维护的**数据大盘 / 数据看板 / 数据大屏**构建技能（Agent Skill），技术栈固定为 **React + Vite + TypeScript + shadcn/ui + ECharts**，内置中国地图本地化、省市区下钻、强制交付验证与证据门禁。

面向“帮我做一个大盘 / 看板 / 大屏 / 地图下钻”类需求：把一次性 demo 变成可验证、可交付、可维护的前端工程。

这是一个**标准 Agent Skill 仓库**：技能本体是自包含目录 `skills/boardify/`（含 `SKILL.md`、`references/`、`scripts/`、`assets/`），不绑定任何特定平台的安装路径，可按下方说明安装到 Trae、Claude Code 等支持 Agent Skills 的环境。

## 特性

- **工程化**：基于 React + Vite + TypeScript 的可运行模板，shadcn/ui 统一样式，锁文件保证依赖可复现。
- **图表标准化**：统一 ECharts 封装（尺寸观察、事件解绑、销毁），内置图表选型矩阵、option 底座与趋势 / 排行 / 占比模板。
- **国产化地图**：DataV GeoAtlas GeoJSON 本地资源化，运行时零外网依赖；内置 34 省 adcode 权威表、常用城市坐标表与 DataV 实测事实，防模型乱答。
- **多级下钻**：清单驱动、按需加载，支持全国 → 省 → 市 → 区县下钻、面包屑返回、加载失败重试与请求竞态隔离。
- **单屏看板与数据大屏**：单屏看板适配 2560×1440 / 1920×1080 / 1366×768；数据大屏 16:9 定屏等比缩放。
- **强制交付验证**：14 项证据门禁（G-01 ~ G-14），明确通过 / 失败 / 受阻 / 不适用四态；未走完验证流水线不得声称“完成”。

## 目录结构

```text
boardify/
├── README.md                    # 本文件：仓库说明与安装指南
├── LICENSE                      # MIT（地图等第三方数据除外，见文末例外说明）
├── .github/workflows/ci.yml     # CI：技能校验 + 各工程 lint / test / build
├── skills/                      # 标准技能目录（anthropics/skills 布局）
│   └── boardify/                # 技能本体：SKILL.md + references + scripts + assets
│       ├── SKILL.md             # 技能入口：流程、固定边界、硬性规则、文件地图
│       ├── references/          # 按需加载的知识库
│       │   ├── requirements.md  # 需求契约 + 默认假设表
│       │   ├── engineering.md   # 目录结构、职责分离、生命周期、安全部署
│       │   ├── design-system.md # 视觉契约、shadcn 接入、大屏 16:9、oklch 坑
│       │   ├── echarts.md       # 选型矩阵、生命周期、option 模板、故障速查
│       │   ├── china-maps.md    # DataV 事实、adcode 表、坐标表、下钻坑、许可门禁
│       │   ├── ecommerce.md     # 电商单屏示例实践
│       │   └── delivery-validation.md  # 14 项门禁、证据格式、自动化技巧、故障速查
│       ├── scripts/
│       │   ├── init.mjs         # 复制 starter 到新工程
│       │   ├── validate.mjs     # 技能链接 + 模板地图哈希/几何/树校验
│       │   ├── verify.mjs       # 模板 lint/test/build（浏览器如实标未验证）
│       │   └── fetch-maps.mjs   # DataV 地图本地化下载（哈希、清单、--learning-only）
│       └── assets/
│           ├── starter/         # 可运行模板（合成地图，非真实行政区）
│           └── templates/       # 需求记录 / 验收记录 / 交付清单
└── examples/
    ├── ecommerce/               # 单屏电商大盘示例（本地真实地图、省市区下钻）
    └── agriculture/             # 全国农业 16:9 数据大屏示例（省市区下钻、缩放平移）
```

## 安装（把技能装进你的 Agent）

技能本体是 `skills/boardify/`，把它整个目录复制到目标平台能识别的 skills 目录即可：

| 环境 | 安装位置 |
| --- | --- |
| Trae（项目级） | `<项目>/.trae/skills/boardify/` |
| Trae（全局，CN） | `~/.trae-cn/skills/boardify/` |
| Claude Code | `~/.claude/skills/boardify/` 或 `<项目>/.claude/skills/boardify/` |
| 其他 Agent Skills 平台 | 按该平台约定，通常是 `<skills 根>/boardify/` |

复制后确认 `SKILL.md` 位于技能目录顶层，且 `name: boardify` 与目录名一致。

## 快速开始（使用技能）

技能被触发后由 Agent 按 `SKILL.md` 执行。手动在终端使用其脚本：

```sh
# 用模板新建大盘工程（在 skills/boardify 目录执行）
cd skills/boardify
node scripts/init.mjs /absolute/path/to/dashboard
cd /absolute/path/to/dashboard
npm ci
npm run dev
```

### 下载真实中国地图（本地化）

地图资源从 DataV GeoAtlas 下载到工程 `public/maps/`，运行时只从本地加载：

```sh
node skills/boardify/scripts/fetch-maps.mjs /absolute/path/to/dashboard --learning-only
```

`--learning-only` 仅声明学习用途，不代表获得授权。地图许可与合规要求见 `skills/boardify/references/china-maps.md`。

### 强制验证

```sh
cd skills/boardify
node scripts/validate.mjs     # 技能链接 + 模板地图完整性
node scripts/verify.mjs       # 模板测试 + 构建
# 目标工程内：
npm test                      # 单元测试
npm run build                 # 类型检查 + 生产构建
npm run test:browser          # 真实浏览器回归
```

## 电商示例

`examples/ecommerce` 是一个**仅首屏**的电商经营大盘：顶部经营指标、中央本地中国地图（省市区下钻）、两侧趋势 / 渠道 / 转化 / 品类 / 履约，适配 2560×1440、1920×1080、1366×768。

```sh
cd examples/ecommerce
npm ci
npm run dev
```

地图资源因许可限制不随仓库分发，需要本地运行 `node ../../skills/boardify/scripts/fetch-maps.mjs ./ --learning-only` 获取；回归脚本的证据见 `docs/evidence/`。

## 地图合规说明

- 地图源为阿里云 DataV.GeoAtlas（areas_v3，版本 2021.5），**仅供学习交流**，未取得商用、修改、公开再分发许可。
- 中国地图必须完整（含台湾、含南海诸岛九段线）；识别 `100000_JD` 附属要素并保留，不裁剪、不删除。
- 行政区码与城市坐标只准来自内置表或 GeoJSON `properties`，禁止凭记忆编造。
- 推送到公开仓库前，请自行确认地图再分发许可；本仓库不包含实际地图资源文件。

## 验证与测试

技能自带校验流水线，且诚实区分“自动化通过”与“浏览器验收”：

- `validate.mjs` / `verify.mjs`：模板 lint + 17 项测试 + 类型检查 + 生产构建，浏览器证据如实标“未验证”。
- 电商示例：7 项业务测试 + 真实 Chromium 三尺寸浏览器回归（2560 / 1920 / 1366，含下钻、异常恢复、全屏、阻断外网本地加载）。
- CI：`.github/workflows/ci.yml` 在推送与 PR 时自动执行技能校验及三个工程的 lint / test / build。

## 许可

技能文档与代码基于 [LICENSE](LICENSE)（MIT）分发；地图与示例数据许可、审图合规须另行确认，详见 `skills/boardify/references/china-maps.md`。未走完适用门禁的交付一律保持“受阻”状态，不宣称验收完成。
