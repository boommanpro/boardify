import * as echarts from 'echarts/core'
import { LineChart, BarChart, MapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

echarts.use([LineChart, BarChart, MapChart, GridComponent, TooltipComponent, VisualMapComponent, SVGRenderer])
export { echarts }
export type { EChartsOption } from 'echarts'
