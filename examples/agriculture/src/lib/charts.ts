import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart, RadarChart, MapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent, LegendComponent, RadarComponent, GraphicComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

echarts.use([
  LineChart, BarChart, PieChart, RadarChart, MapChart,
  GridComponent, TooltipComponent, VisualMapComponent, LegendComponent, RadarComponent,
  SVGRenderer, GraphicComponent,
])
export { echarts }
export type { EChartsOption } from 'echarts'
