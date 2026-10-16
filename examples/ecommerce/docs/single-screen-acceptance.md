# 单屏大盘验收 · 2026-10-15

结论：本次本地单屏功能与三尺寸浏览器验证通过；地图公开发布合规、完整无障碍与性能门禁仍受阻，不声称全部门禁通过。未提交版本，未发布，未增加代码注释。旧 acceptance.md 与旧截图是六专题历史记录，不代表本次版本。

## 环境与版本

执行者：自动化代码助手。工作目录为 examples/ecommerce；macOS，Asia/Shanghai，固定种子 20261015。复用现有锁定依赖，本轮未重新 npm ci，未添加依赖。生产服务器为 Vite preview 4173；真实无头 Chromium 156.0.8078.4。执行时间、生产入口 SHA-256、各视口几何与请求状态见 evidence/single-screen/results.json。浏览器使用原生点击、选择、日期输入与键盘操作，不修改 React 内部状态。

## 当前证据

| 编号 | 范围 / 门禁 | 实际检查与结果 | 证据 |
| --- | --- | --- | --- |
| S-01 | R-02/R-03，G-01/G-05 | 单屏替代专题；同一事实集合；7 项测试通过，含维度守恒、全量地图哈希及几何、图表生命周期、主题 | single-screen-tests.log |
| S-02 | G-02/G-03 | npm run build，TypeScript 与 Vite 通过，生产产物生成 | single-screen-build.log |
| S-03 | R-08，G-07/G-09 | 2560×1440、1920×1080、1366×768：页面 scrollWidth/Height 等于视口，面板边界完整，无内容溢出；5 个 ECharts 容器与 SVG 尺寸一致 | evidence/single-screen/results.json |
| S-04 | R-08，G-07 | 三尺寸全国、区县、暗色共9张视口截图；已逐张查看三张全国截图，无可见面板裁切 | evidence/single-screen/*national.png、*district.png、*dark.png |
| S-05 | R-03/R-09，G-04/G-13 | 真实图形点击到北京；广东→深圳→南山及返回，东莞无下级；日期变化与重置，非法日期空数据；键盘返回、主题持久化、全屏进入退出通过 | single-screen-browser.log、results.json |
| S-06 | R-10，G-06/G-13 | 404 保留原层与指标，重试恢复；损坏空几何保留原层；取消延迟加载、广东慢请求后改选浙江，旧结果未覆盖 | missing-preserved.png、recovered.png、results.json |
| S-07 | G-10/G-13 | 每尺寸全新会话阻断外网，本地服务可达；正常路径控制台错误与外网请求均为空；地图多填充色断言通过 | results.json |
| S-08 | 技能规范 | validate/verify 均退出0；模板检查仅证明模板，不代替本示例浏览器验收 | single-screen-skill-validate.log、single-screen-skill-verify.log |

截图与结果路径均相对于 docs/evidence/single-screen；日志相对于 docs。执行 `npm test`、`npm run build`、`npm run preview`，另终端 `npm run test:browser` 可复测。

## 变更范围

App.tsx、index.css 改为视口网格；business-panel.tsx 与 business-charts.ts 分离图表；chart.tsx 支持百分比高度；commerce-map.tsx 保留加载事务、使用紧凑选择器和显式色阶。package.json 浏览器入口更新为 single-screen.cjs。同步 README、单屏契约和技能 references/ecommerce.md。未修改事实生成器或地图资产。

## 限制与解除条件

- 地图仍为 DataV 2021.5 学习资产；商用、缓存再分发、公开发布审图、坐标控制点及最新区划未经确认，需权利人和合规责任人核实。
- 仅真实 Chromium 自动化；未验证 Safari/Firefox、实际多显示器或操作系统全屏行为。目标尺寸以100%浏览器缩放验收，小于1100px重排并允许滚动。
- 未配置独立 lint；编辑器诊断调用受访问限制，TypeScript 编译检查通过。未完成对比度量化、读屏器实测和完整无障碍审计。
- 未测性能 SLA、堆内存曲线和全部3238节点点击。地图源清单缺口不补造；旧六专题卸载重入测试不作为本轮证据。
- 主入口 1074.68 kB、图表分块580.09 kB，保留大于500 kB构建警告；可后续拆分树元数据优化，不以修改警告阈值掩盖。
- 无真实接口、身份认证、导出和支付；相关服务端门禁不适用。离线只指外网阻断且本地服务器可达，不承诺双击 HTML 或停服运行。
- 首轮浏览器脚本用方向键假定原生选择器提交到北京导致超时，改为原生选择操作加键盘返回后完整重跑通过；未把失败结果当作应用通过证据。
