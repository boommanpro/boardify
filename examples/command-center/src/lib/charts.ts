import * as echarts from 'echarts/core'
import {
  BarChart,
  LineChart,
  MapChart,
  PieChart,
  RadarChart,
} from 'echarts/charts'
import {
  AriaComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

// 套件全集注册：业务工程删减工厂时同步删减注册项，减小产物体积（见 references/echarts.md）
echarts.use([
  BarChart, LineChart, MapChart, PieChart, RadarChart,
  AriaComponent, DataZoomComponent, GridComponent, LegendComponent, RadarComponent, TooltipComponent, VisualMapComponent,
  SVGRenderer,
])
export { echarts }
export type { EChartsOption } from 'echarts'
