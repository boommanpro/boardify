import geometry from '@/data/national-geometry.json'
import { provinceRows, metricOptions, number, type MetricKey } from '@/data/agriculture'

export const mapColors = ['#153e3e', '#22544d', '#376c58', '#6d8056', '#a59c63', '#d7bd7d']

export function NationalMap({ metric, onNavigate }: { metric: MetricKey; onNavigate: (id: string) => void }) {
  const rows = provinceRows(metric)
  const max = Math.max(...rows.map(row => row.value))
  return <><svg className="map" viewBox="0 0 1120 670" aria-label="全国农业产业分布地图"><g className="map-shadow">{geometry.map.filter(item => item.tag === 'path').map((item, index) => {
    const attributes = item.attributes
    const row = rows.find(row => row.name === attributes['data-name'])
    const fill = metric === 'grain' ? attributes.fill : mapColors[Math.min(5, Math.floor((row?.value ?? 0) / max * 6))]
    return <path key={index} className="province" d={attributes.d} fill={fill} data-name={attributes['data-name']} role={row ? 'button' : undefined} tabIndex={row ? 0 : undefined} aria-label={row ? `${row.name}，${number(row.value)}${metricOptions[metric].unit}，下钻` : undefined} onClick={() => row && onNavigate(row.adcode)} onKeyDown={event => { if (row && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onNavigate(row.adcode) } }}><title>{row ? `${row.name} ${number(row.value)} ${metricOptions[metric].unit}` : '南海诸岛'}</title></path>
  })}</g><g pointerEvents="none">{geometry.map.filter(item => item.tag === 'text').map((item, index) => <text key={index} x={item.attributes.x} y={item.attributes.y} className="map-label">{item.text}</text>)}</g></svg><div className="map-inset"><svg viewBox="0 0 120 138">{geometry.inset.map((item, index) => <path key={index} d={item.attributes.d} fill="#234c45" stroke="#799082" strokeWidth=".55" />)}</svg><p>南海诸岛</p></div></>
}
