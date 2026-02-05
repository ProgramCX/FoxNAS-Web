/**
 * 系统监控 Composable
 * 提供系统监控数据获取和处理的响应式逻辑
 */

import { ref, computed, type Ref } from 'vue'
import { monitorService } from '@/api/services/monitor'
import type { SysMainMetrics, TimeUnit } from '@/types'

/**
 * 时间范围配置
 */
export interface TimeRangeConfig {
  type: 'preset' | 'custom'
  // 预设时间
  presetValue?: number
  presetUnit?: TimeUnit
  // 自定义时间范围
  startTime?: number
  endTime?: number
}

/**
 * 使用系统监控数据
 */
export function useMonitorData() {
  // 状态
  const loading = ref(false)
  const error = ref<string | null>(null)
  const metrics = ref<SysMainMetrics[]>([])

  // 当前时间范围配置
  const timeRangeConfig = ref<TimeRangeConfig>({
    type: 'preset',
    presetValue: 1,
    presetUnit: 'h',
  })

  // 计算属性：是否有数据
  const hasData = computed(() => metrics.value.length > 0)

  // 计算属性：数据点数量
  const dataPointsCount = computed(() => metrics.value.length)

  // 计算属性：时间范围描述
  const timeRangeDescription = computed(() => {
    if (metrics.value.length === 0) return ''
    const first = metrics.value[0]
    const last = metrics.value[metrics.value.length - 1]
    if (!first || !last) return ''
    return `${new Date(first.timestamp).toLocaleString()} - ${new Date(last.timestamp).toLocaleString()}`
  })

  // 计算属性：所有磁盘名称
  const diskNames = computed(() => {
    const names = new Set<string>()
    metrics.value.forEach((m) => {
      m.diskMetricsList?.forEach((disk) => {
        names.add(disk.diskName)
      })
    })
    return Array.from(names)
  })

  /**
   * 按预设时间获取数据
   */
  async function fetchByPreset(value: number, unit: TimeUnit) {
    loading.value = true
    error.value = null
    try {
      metrics.value = await monitorService.getMetricsByLastTime(value, unit)
      timeRangeConfig.value = {
        type: 'preset',
        presetValue: value,
        presetUnit: unit,
      }
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch metrics'
      console.error('Failed to fetch metrics by preset:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 按自定义时间范围获取数据
   */
  async function fetchByTimeRange(startTime: number, endTime: number) {
    loading.value = true
    error.value = null
    try {
      metrics.value = await monitorService.getMetricsByTimeRange(startTime, endTime)
      timeRangeConfig.value = {
        type: 'custom',
        startTime,
        endTime,
      }
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch metrics'
      console.error('Failed to fetch metrics by time range:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新当前数据
   */
  async function refresh() {
    const config = timeRangeConfig.value
    if (config.type === 'preset' && config.presetValue && config.presetUnit) {
      await fetchByPreset(config.presetValue, config.presetUnit)
    } else if (config.type === 'custom' && config.startTime && config.endTime) {
      await fetchByTimeRange(config.startTime, config.endTime)
    }
  }

  /**
   * 清空数据
   */
  function clearData() {
    metrics.value = []
    error.value = null
  }

  return {
    // 状态
    loading,
    error,
    metrics,
    timeRangeConfig,
    // 计算属性
    hasData,
    dataPointsCount,
    timeRangeDescription,
    diskNames,
    // 方法
    fetchByPreset,
    fetchByTimeRange,
    refresh,
    clearData,
  }
}

/**
 * 提取 CPU 数据
 * 注意：后端返回的 cpu 已经是百分比 (0-100)，不需要再乘 100
 */
export function extractCpuData(metrics: Ref<SysMainMetrics[]>) {
  return computed(() => metrics.value.map((m) => parseFloat(m.cpu.toFixed(1))))
}

/**
 * 提取内存使用率数据
 */
export function extractMemoryUsageData(metrics: Ref<SysMainMetrics[]>) {
  return computed(() =>
    metrics.value.map((m) => {
      if (m.totalMemory === 0) return 0
      return parseFloat(((m.usedMemory / m.totalMemory) * 100).toFixed(1))
    })
  )
}

/**
 * 提取网络速度数据
 */
export function extractNetworkSpeedData(metrics: Ref<SysMainMetrics[]>) {
  return computed(() => ({
    upload: metrics.value.map((m) => m.uploadSpeed),
    download: metrics.value.map((m) => m.downloadSpeed),
  }))
}

/**
 * 提取时间戳
 */
export function extractTimestamps(metrics: Ref<SysMainMetrics[]>) {
  return computed(() => metrics.value.map((m) => m.timestamp))
}
