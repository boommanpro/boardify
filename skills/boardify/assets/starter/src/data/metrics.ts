export const metrics = [
  { label: '总营收', value: '¥ 1,284,600', change: '+12.8%', detail: '较上一统计周期' },
  { label: '服务订单', value: '8,426', change: '+8.2%', detail: '较上一统计周期' },
  { label: '活跃客户', value: '24,891', change: '+16.4%', detail: '较上一统计周期' },
  { label: '履约完成率', value: '98.6%', change: '+1.2%', detail: '较上一统计周期' },
]
export const trend = [42, 56, 49, 71, 64, 83, 92]
export function regionValue(id: string) {
  return 120 + [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 800
}
