/**
 * 系统监控 API 服务
 * 提供获取系统监控指标数据的网络请求功能
 */

import { http } from '../client'
import { apiEndpoints } from '../config'
import type { SysMainMetrics, TimeUnit } from '@/types'

/**
 * 系统监控服务类
 */
class MonitorService {
  /**
   * 按时间范围获取系统指标
   * GET /api/monitor/byTimeRange
   * @param startTime 开始时间（毫秒时间戳）
   * @param endTime 结束时间（毫秒时间戳）
   */
  async getMetricsByTimeRange(startMills: number, endMills: number): Promise<SysMainMetrics[]> {
    return await http.get<SysMainMetrics[]>(apiEndpoints.monitor.byTimeRange, {
      startMills,
      endMills,
    })
  }

  /**
   * 按相对时间获取系统指标
   * GET /api/monitor/byLastTime
   * @param time 时间数量
   * @param unit 时间单位 (min: 分钟, h: 小时, d: 天, m: 月, y: 年)
   */
  async getMetricsByLastTime(number: number, unit: TimeUnit): Promise<SysMainMetrics[]> {
    return await http.get<SysMainMetrics[]>(apiEndpoints.monitor.byLastTime, {
      number,
      unit,
    })
  }
}

export const monitorService = new MonitorService()
export default monitorService
