import { useState } from 'react'
import { AgriMap, type Summary } from '@/components/agri-map'
import { NationalMap, mapColors } from '@/components/national-map'
import { useScreenScale } from '@/hooks/use-screen-scale'
import { metricOptions, provinceRows, nationalTotals, grainTrend, cropComposition, industryComposition, number, rate, regionStats, type MetricKey } from '@/data/agriculture'
import './national.css'
import './national-interactions.css'

const shortName = (name: string) => name.replace(/省|市|维吾尔自治区|壮族自治区|回族自治区|自治区|特别行政区/g, '')
const cropColors = ['#d1b87c', '#8fa982', '#517e68']
const industryColors = ['#d3ba7c', '#95aa81', '#5a846f', '#365d50', '#244840']

export default function NationalOverview() {
  const scale = useScreenScale()
  const [metric, setMetric] = useState<MetricKey>('grain')
  const [id, setId] = useState('100000')
  const [summary, setSummary] = useState<Summary>({ id: '100000', name: '全国', level: 1, rows: provinceRows('grain') })
  const [controls, setControls] = useState(false)
  const national = id === '100000'
  const rows = national ? provinceRows(metric) : summary.rows
  const ranking = [...rows].sort((a, b) => b.value - a.value).slice(0, 5)
  const info = metricOptions[metric]
  const totals = nationalTotals
  const points = grainTrend.map((row, index) => `${8 + index * 30},${120 - (row.value - 58900) / 180}`)
  const top = ranking[0]
  const total = national ? totals[metric] : regionStats(id)[metric]
  const defaultView = national && metric === 'grain'
  return <main id="screen" className="national-overview" style={{ transform: `scale(${scale})` }}>
    <header><div className="brand"><span className="seal">◈</span>农业数据观测<small>全国 · 省域 · 生产要素</small></div><h1>全国农业总览</h1><div className="sub">农业生产态势与资源分布</div><div className="time">2025 年度<small>固定种子演示数据 · 非官方统计</small></div></header>
    <section className="hero"><div className="primary"><div className="caption">全国粮食总产量</div><div className="value">{number(totals.grain)}<span>万吨</span></div><div className="growth">同比 {rate(totals.grainYoY)}{'　'}<span style={{ color: '#78978a' }}> / 全国省级汇总</span></div></div><div className="secondary"><div><label>农林牧渔总产值</label><b>{(totals.output / 10000).toFixed(2)}<small>万亿元</small></b></div><div><label>耕地面积</label><b>{(totals.arable / 10000).toFixed(2)}<small>亿亩</small></b></div></div></section>
    <aside className="wing left"><h2 className="section-title">粮食生产趋势<em>01</em></h2><div className="muted">全国粮食产量 · 2016—2025</div><div className="feature-number">{(totals.grain / 10000).toFixed(2)}<small>亿吨</small></div>
      <svg className="trend" viewBox="0 0 280 150" role="img" aria-label="全国粮食产量年度趋势"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ceb777" stopOpacity=".2" /><stop offset="1" stopColor="#ceb777" stopOpacity="0" /></linearGradient></defs><path d={`M${points.join(' L')} L278,145 L8,145 Z`} fill="url(#area)" /><path d="M0 45H280 M0 95H280 M0 145H280" stroke="#9db09825" strokeDasharray="3 5" /><polyline points={points.join(' ')} fill="none" stroke="#d4ba7b" strokeWidth="2" />{points.map((point, index) => <circle key={point} cx={point.split(',')[0]} cy={point.split(',')[1]} r={index === 9 ? 4 : 2} fill="#e0c78c" />)}</svg>
      <div className="axis"><span>2016</span><span>2020</span><span>2025</span></div><div className="rule" /><h2 className="section-title">主要粮食作物<em>02</em></h2><div className="muted">产量结构 · 占全国粮食总产量</div>{cropComposition.slice(0, 3).map((row, index) => <div className="crop" key={row.name}><div className="row"><span>{row.name}</span><span>{(row.value / totals.grain * 100).toFixed(1)}<small>%</small></span></div><div className="track"><div className="fill" style={{ width: `${row.value / totals.grain * 100}%`, background: cropColors[index] }} /></div></div>)}<p className="insight">玉米、稻谷、小麦合计占比<br /><b>{(cropComposition.slice(0, 3).reduce((sum, row) => sum + row.value, 0) / totals.grain * 100).toFixed(1)}%</b>，构成粮食生产主体。</p>
    </aside>
    <section className={`map-area ${national ? '' : 'regional'}`}><div className="map-caption">{national ? `省域${info.label}分布` : `${summary.name}${info.label}分布`}<b>{national ? '全国 34 个省级区域' : `${summary.name} · 区域详情`}</b></div>
      {national ? <NationalMap metric={metric} onNavigate={setId} /> : <AgriMap metric={metric} id={id} theme="dark" onNavigate={setId} onSummary={setSummary} />}
      {top && <div className="callout">{info.label}首位 · {shortName(top.name)}<b>{number(top.value)} <span style={{ fontSize: 12 }}>{info.unit}</span></b></div>}
      {national && <><div className="legend"><p>{info.label} / {info.unit}</p><div className="swatches">{mapColors.map(color => <span key={color} style={{ background: color }} />)}</div><div className="axis"><span>0</span><span>{metric === 'grain' ? '2,500' : number(Math.round((top?.value ?? 0) / 2))}</span><span>{metric === 'grain' ? '6,000+' : number(top?.value ?? 0)}</span></div></div><div className="map-note">省域边界 · 源自项目现有地理数据</div></>}
    </section>
    <aside className="wing right"><h2 className="section-title">{defaultView ? '粮食主产省份' : '区域指标排行'}<em>03</em></h2><div className="muted">{defaultView ? '省级粮食产量前五位' : `${national ? '全国' : summary.name} · ${info.label}前五位`} · {info.unit}</div>{ranking.map((row, index) => <div className="rank" key={row.adcode}><div className="row"><i>{String(index + 1).padStart(2, '0')}</i><strong>{shortName(row.name)}</strong><span>{number(row.value)}</span></div><div className="track"><div className="fill" style={{ width: `${row.value / Math.max(1, top?.value ?? 1) * 100}%`, background: index === 0 ? '#d1b87c' : '#6f9073' }} /></div></div>)}<p className="insight">{defaultView ? '前五省份贡献全国粮食产量的' : '前五区域占当前指标总量的'} <b>{(ranking.reduce((sum, row) => sum + row.value, 0) / Math.max(1, total) * 100).toFixed(1)}%</b></p><div className="rule" /><h2 className="section-title">农业产业结构<em>04</em></h2><div className="muted">农林牧渔总产值构成</div><div className="industry">{industryComposition.map((row, index) => <span key={row.name} style={{ width: `${row.value / totals.output * 100}%`, background: industryColors[index] }} />)}</div><div className="industry-list">{industryComposition.slice(0, 4).map(row => <div key={row.name}>{row.name}<b>{(row.value / totals.output * 100).toFixed(1)}<span style={{ fontSize: 12 }}>%</span></b></div>)}</div><p className="muted" style={{ marginTop: 22 }}>农林牧渔服务业 {(industryComposition[4].value / totals.output * 100).toFixed(1)}%</p></aside>
    <footer className="foot"><button className="view-control" aria-label="打开地图指标与区域控制" aria-expanded={controls} onClick={() => setControls(value => !value)}><span className="gold">●</span>{'　'}{national ? '全国视角' : summary.name}{'　'} /{'　'}{metric === 'grain' ? '粮食生产' : info.label}</button><span>数据来源：项目演示数据集{'　'} ·{'　'}地图：项目全国省域 GeoJSON</span><span>独立视觉稿{'　'} /{'　'}不代表当期官方统计</span></footer>
    {controls && <section className="interaction-panel" aria-label="地图交互控制"><div role="group" aria-label="切换地图指标">{(Object.keys(metricOptions) as MetricKey[]).map(key => <button key={key} aria-pressed={metric === key} onClick={() => setMetric(key)}>{metricOptions[key].label}</button>)}</div>{national && <label>区域下钻<select aria-label="选择下钻区域" value="" onChange={event => { setId(event.target.value); setControls(false) }}><option value="">点击地图或选择下级行政区</option>{provinceRows(metric).map(row => <option key={row.adcode} value={row.adcode}>{row.name}</option>)}</select></label>}<button onClick={() => setControls(false)}>关闭控制</button></section>}
  </main>
}
