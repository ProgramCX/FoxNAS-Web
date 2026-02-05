/**
 * 图表工具函数
 * 提供 ECharts 图表配置生成和导出功能
 */

import type { EChartsOption, SeriesOption } from 'echarts'
import type { SysMainMetrics, ChartExportOptions } from '@/types'
import {
  formatTimestamp,
  getOptimalUnit,
  convertBytesToUnit,
  convertSpeedToUnit,
  calculateMemoryUsagePercent,
  calculateDiskUsagePercent,
} from './format'

/**
 * 图表颜色主题
 */
export const CHART_COLORS = {
  cpu: '#18a058',
  memory: '#2080f0',
  memoryUsed: '#f0a020',
  upload: '#18a058',
  download: '#2080f0',
  disk: ['#18a058', '#2080f0', '#f0a020', '#d03050', '#722ed1', '#13c2c2'],
}

/**
 * 通用图表基础配置
 */
export function getBaseChartOption(isDark: boolean): Partial<EChartsOption> {
  const textColor = isDark ? '#e6e8eb' : '#333639'
  const borderColor = isDark ? '#333' : '#e4e7ed'
  const bgColor = 'transparent'

  return {
    backgroundColor: bgColor,
    textStyle: {
      color: textColor,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#1f1f23' : '#fff',
      borderColor: borderColor,
      textStyle: {
        color: textColor,
      },
    },
    legend: {
      right: '10',
      top: '10',
      textStyle: {
        color: textColor,
      },
    },
    xAxis: {
      type: 'category',
      axisLine: {
        lineStyle: {
          color: borderColor,
        },
      },
      axisLabel: {
        color: textColor,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: borderColor,
        },
      },
      axisLabel: {
        color: textColor,
      },
      splitLine: {
        lineStyle: {
          color: borderColor,
          type: 'dashed',
        },
      },
    },
  }
}

/**
 * 生成时间轴标签
 * @param metrics 指标数据数组
 * @param timeFormat 时间格式
 * @returns 时间标签数组
 */
export function generateTimeLabels(
  metrics: SysMainMetrics[],
  timeFormat: 'full' | 'date' | 'time' | 'short' = 'short'
): string[] {
  return metrics.map((m) => formatTimestamp(m.timestamp, timeFormat))
}

/**
 * 生成 CPU 使用率图表配置
 * @param metrics 指标数据
 * @param isDark 是否暗色主题
 * @param t 国际化函数
 * @returns ECharts 配置
 */
export function generateCpuChartOption(
  metrics: SysMainMetrics[],
  isDark: boolean,
  t: (key: string) => string
): EChartsOption {
  const baseOption = getBaseChartOption(isDark)
  const timeLabels = generateTimeLabels(metrics)
  // 后端返回的 cpu 已经是百分比 (0-100)，不需要再乘 100
  const cpuData = metrics.map((m) => parseFloat(m.cpu.toFixed(1)))

  return {
    ...baseOption,
    title: {
      text: t('monitor.cpuUsage'),
      left: 'center',
      textStyle: {
        color: isDark ? '#e6e8eb' : '#333639',
        fontSize: 16,
      },
    },
    xAxis: {
      ...baseOption.xAxis,
      data: timeLabels,
    },
    yAxis: {
      ...baseOption.yAxis,
      max: 100,
      axisLabel: {
        ...((baseOption.yAxis as any)?.axisLabel || {}),
        formatter: '{value}%',
      },
    },
    series: [
      {
        name: t('monitor.cpuUsage'),
        type: 'line',
        smooth: true,
        data: cpuData,
        itemStyle: {
          color: CHART_COLORS.cpu,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${CHART_COLORS.cpu}40` },
              { offset: 1, color: `${CHART_COLORS.cpu}05` },
            ],
          },
        },
      },
    ],
  } as EChartsOption
}

/**
 * 生成内存使用图表配置
 * @param metrics 指标数据
 * @param isDark 是否暗色主题
 * @param t 国际化函数
 * @returns ECharts 配置
 */
export function generateMemoryChartOption(
  metrics: SysMainMetrics[],
  isDark: boolean,
  t: (key: string) => string
): EChartsOption {
  const baseOption = getBaseChartOption(isDark)
  const timeLabels = generateTimeLabels(metrics)

  // 计算内存使用率
  const memoryUsageData = metrics.map((m) =>
    calculateMemoryUsagePercent(m.usedMemory, m.totalMemory)
  )

  return {
    ...baseOption,
    title: {
      text: t('monitor.memoryUsage'),
      left: 'center',
      textStyle: {
        color: isDark ? '#e6e8eb' : '#333639',
        fontSize: 16,
      },
    },
    xAxis: {
      ...baseOption.xAxis,
      data: timeLabels,
    },
    yAxis: {
      ...baseOption.yAxis,
      max: 100,
      axisLabel: {
        ...((baseOption.yAxis as any)?.axisLabel || {}),
        formatter: '{value}%',
      },
    },
    series: [
      {
        name: t('monitor.memoryUsage'),
        type: 'line',
        smooth: true,
        data: memoryUsageData,
        itemStyle: {
          color: CHART_COLORS.memory,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${CHART_COLORS.memory}40` },
              { offset: 1, color: `${CHART_COLORS.memory}05` },
            ],
          },
        },
      },
    ],
  } as EChartsOption
}

/**
 * 生成网络速度图表配置
 * @param metrics 指标数据
 * @param isDark 是否暗色主题
 * @param t 国际化函数
 * @returns ECharts 配置
 */
export function generateNetworkSpeedChartOption(
  metrics: SysMainMetrics[],
  isDark: boolean,
  t: (key: string) => string
): EChartsOption {
  const baseOption = getBaseChartOption(isDark)
  const timeLabels = generateTimeLabels(metrics)

  const uploadSpeeds = metrics.map((m) => m.uploadSpeed)
  const downloadSpeeds = metrics.map((m) => m.downloadSpeed)

  // 获取最佳单位
  const allSpeeds = [...uploadSpeeds, ...downloadSpeeds]
  const optimalUnit = getOptimalUnit(allSpeeds, true)

  // 转换数据
  const uploadData = convertSpeedToUnit(uploadSpeeds, optimalUnit)
  const downloadData = convertSpeedToUnit(downloadSpeeds, optimalUnit)

  return {
    ...baseOption,
    title: {
      text: t('monitor.networkSpeed'),
      left: 'center',
      textStyle: {
        color: isDark ? '#e6e8eb' : '#333639',
        fontSize: 16,
      },
    },
    legend: {
      ...baseOption.legend,
      data: [t('monitor.upload'), t('monitor.download')],
      right: '10',
      top: '10',
    },
    xAxis: {
      ...baseOption.xAxis,
      data: timeLabels,
    },
    yAxis: {
      ...baseOption.yAxis,
      axisLabel: {
        ...((baseOption.yAxis as any)?.axisLabel || {}),
        formatter: `{value} ${optimalUnit}`,
      },
    },
    series: [
      {
        name: t('monitor.upload'),
        type: 'line',
        smooth: true,
        data: uploadData,
        itemStyle: {
          color: CHART_COLORS.upload,
        },
      },
      {
        name: t('monitor.download'),
        type: 'line',
        smooth: true,
        data: downloadData,
        itemStyle: {
          color: CHART_COLORS.download,
        },
      },
    ],
  } as EChartsOption
}

/**
 * 生成网络流量累计图表配置
 * @param metrics 指标数据
 * @param isDark 是否暗色主题
 * @param t 国际化函数
 * @returns ECharts 配置
 */
export function generateNetworkTrafficChartOption(
  metrics: SysMainMetrics[],
  isDark: boolean,
  t: (key: string) => string
): EChartsOption {
  const baseOption = getBaseChartOption(isDark)
  const timeLabels = generateTimeLabels(metrics)

  // 计算累计流量（假设每个数据点间隔为采样间隔，这里简化为速度的累积）
  let uploadAccum = 0
  let downloadAccum = 0
  const uploadTraffic: number[] = []
  const downloadTraffic: number[] = []

  metrics.forEach((m) => {
    uploadAccum += m.uploadSpeed
    downloadAccum += m.downloadSpeed
    uploadTraffic.push(uploadAccum)
    downloadTraffic.push(downloadAccum)
  })

  // 获取最佳单位
  const allTraffic = [...uploadTraffic, ...downloadTraffic]
  const optimalUnit = getOptimalUnit(allTraffic, false)

  // 转换数据
  const uploadData = convertBytesToUnit(uploadTraffic, optimalUnit)
  const downloadData = convertBytesToUnit(downloadTraffic, optimalUnit)

  return {
    ...baseOption,
    title: {
      text: t('monitor.networkTraffic'),
      left: 'center',
      textStyle: {
        color: isDark ? '#e6e8eb' : '#333639',
        fontSize: 16,
      },
    },
    legend: {
      ...baseOption.legend,
      data: [t('monitor.uploadTotal'), t('monitor.downloadTotal')],
      right: '10',
      top: '10',
    },
    xAxis: {
      ...baseOption.xAxis,
      data: timeLabels,
    },
    yAxis: {
      ...baseOption.yAxis,
      axisLabel: {
        ...((baseOption.yAxis as any)?.axisLabel || {}),
        formatter: `{value} ${optimalUnit}`,
      },
    },
    series: [
      {
        name: t('monitor.uploadTotal'),
        type: 'line',
        smooth: true,
        data: uploadData,
        itemStyle: {
          color: CHART_COLORS.upload,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${CHART_COLORS.upload}40` },
              { offset: 1, color: `${CHART_COLORS.upload}05` },
            ],
          },
        },
      },
      {
        name: t('monitor.downloadTotal'),
        type: 'line',
        smooth: true,
        data: downloadData,
        itemStyle: {
          color: CHART_COLORS.download,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${CHART_COLORS.download}40` },
              { offset: 1, color: `${CHART_COLORS.download}05` },
            ],
          },
        },
      },
    ],
  } as EChartsOption
}

/**
 * 生成磁盘使用率图表配置
 * @param metrics 指标数据
 * @param isDark 是否暗色主题
 * @param t 国际化函数
 * @returns ECharts 配置
 */
export function generateDiskUsageChartOption(
  metrics: SysMainMetrics[],
  isDark: boolean,
  t: (key: string) => string
): EChartsOption {
  const baseOption = getBaseChartOption(isDark)
  const timeLabels = generateTimeLabels(metrics)

  // 收集所有磁盘名称
  const diskNames = new Set<string>()
  metrics.forEach((m) => {
    m.diskMetricsList?.forEach((disk) => {
      diskNames.add(disk.diskName)
    })
  })

  const diskNameArray = Array.from(diskNames)

  // 为每个磁盘生成数据系列
  const series: SeriesOption[] = diskNameArray.map((diskName, index) => {
    const data = metrics.map((m) => {
      const disk = m.diskMetricsList?.find((d) => d.diskName === diskName)
      if (disk) {
        return calculateDiskUsagePercent(disk.usedSpace, disk.totalSpace)
      }
      return null
    })

    return {
      name: diskName,
      type: 'line',
      smooth: true,
      data,
      itemStyle: {
        color: CHART_COLORS.disk[index % CHART_COLORS.disk.length],
      },
      connectNulls: true,
    }
  })

  return {
    ...baseOption,
    title: {
      text: t('monitor.diskUsage'),
      left: 'center',
      textStyle: {
        color: isDark ? '#e6e8eb' : '#333639',
        fontSize: 16,
      },
    },
    legend: {
      ...baseOption.legend,
      data: diskNameArray,
      right: '10',
      top: '10',
      type: 'scroll',
    },
    grid: {
      ...baseOption.grid,
      top: '20%',
    },
    xAxis: {
      ...baseOption.xAxis,
      data: timeLabels,
    },
    yAxis: {
      ...baseOption.yAxis,
      max: 100,
      axisLabel: {
        ...((baseOption.yAxis as any)?.axisLabel || {}),
        formatter: '{value}%',
      },
    },
    series,
  } as EChartsOption
}

/**
 * 导出单个图表为图片
 * @param chartInstance ECharts 实例
 * @param options 导出选项
 */
export function exportChart(
  chartInstance: any,
  options: ChartExportOptions = {}
): void {
  const {
    filename = `chart_${Date.now()}`,
    type = 'png',
    pixelRatio = 2,
    backgroundColor = '#fff',
  } = options

  if (!chartInstance) {
    console.warn('Chart instance is not available')
    return
  }

  const url = chartInstance.getDataURL({
    type,
    pixelRatio,
    backgroundColor,
  })

  const link = document.createElement('a')
  link.download = `${filename}.${type}`
  link.href = url
  link.click()
}

/**
 * 导出多个图表为合并图片
 * @param chartInstances ECharts 实例数组
 * @param options 导出选项
 */
export async function exportAllCharts(
  chartInstances: any[],
  options: ChartExportOptions = {}
): Promise<void> {
  const {
    filename = `monitor_${Date.now()}`,
    type = 'png',
    pixelRatio = 2,
    backgroundColor = '#fff',
  } = options

  const validCharts = chartInstances.filter((chart) => chart)
  if (validCharts.length === 0) {
    console.warn('No chart instances available')
    return
  }

  // 获取所有图表的图片数据
  const images: HTMLImageElement[] = await Promise.all(
    validCharts.map((chart) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const url = chart.getDataURL({
          type,
          pixelRatio,
          backgroundColor,
        })
        const img = new Image()
        img.onload = () => resolve(img)
        img.src = url
      })
    })
  )

  // 计算合并后的画布尺寸（2列布局）
  const cols = 2
  const rows = Math.ceil(images.length / cols)
  const chartWidth = images[0]?.width || 800
  const chartHeight = images[0]?.height || 400
  const padding = 20

  const canvasWidth = cols * chartWidth + (cols + 1) * padding
  const canvasHeight = rows * chartHeight + (rows + 1) * padding

  // 创建画布并绘制
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.warn('Failed to get canvas context')
    return
  }

  // 填充背景
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 绘制每个图表
  images.forEach((img, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const x = padding + col * (chartWidth + padding)
    const y = padding + row * (chartHeight + padding)
    ctx.drawImage(img, x, y, chartWidth, chartHeight)
  })

  // 导出
  const link = document.createElement('a')
  link.download = `${filename}.${type}`
  link.href = canvas.toDataURL(`image/${type}`)
  link.click()
}
