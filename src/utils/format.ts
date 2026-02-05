/**
 * 数据格式化工具函数
 * 提供字节、速度、百分比等数据的格式化和单位转换
 */

/**
 * 字节单位转换结果
 */
export interface ByteFormatResult {
  value: number
  unit: string
  formatted: string
}

/**
 * 速度单位转换结果
 */
export interface SpeedFormatResult {
  value: number
  unit: string
  formatted: string
}

/**
 * 字节单位列表（从小到大）
 */
const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

/**
 * 速度单位列表（从小到大）
 */
const SPEED_UNITS = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']

/**
 * 格式化字节数为人类可读格式
 * @param bytes 字节数
 * @param decimals 小数位数，默认 2
 * @returns 格式化结果
 */
export function formatBytes(bytes: number, decimals = 2): ByteFormatResult {
  if (bytes === 0 || !Number.isFinite(bytes)) {
    return { value: 0, unit: 'B', formatted: '0 B' }
  }

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))
  const unitIndex = Math.min(i, BYTE_UNITS.length - 1)
  const value = bytes / Math.pow(k, unitIndex)

  return {
    value: parseFloat(value.toFixed(dm)),
    unit: BYTE_UNITS[unitIndex] ?? 'B',
    formatted: `${value.toFixed(dm)} ${BYTE_UNITS[unitIndex] ?? 'B'}`,
  }
}

/**
 * 格式化速度为人类可读格式
 * @param bytesPerSecond 每秒字节数
 * @param decimals 小数位数，默认 2
 * @returns 格式化结果
 */
export function formatSpeed(bytesPerSecond: number, decimals = 2): SpeedFormatResult {
  if (bytesPerSecond === 0 || !Number.isFinite(bytesPerSecond)) {
    return { value: 0, unit: 'B/s', formatted: '0 B/s' }
  }

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const i = Math.floor(Math.log(Math.abs(bytesPerSecond)) / Math.log(k))
  const unitIndex = Math.min(i, SPEED_UNITS.length - 1)
  const value = bytesPerSecond / Math.pow(k, unitIndex)

  return {
    value: parseFloat(value.toFixed(dm)),
    unit: SPEED_UNITS[unitIndex] ?? 'B/s',
    formatted: `${value.toFixed(dm)} ${SPEED_UNITS[unitIndex] ?? 'B/s'}`,
  }
}

/**
 * 将字节数组转换为指定单位的数值数组
 * @param bytesArray 字节数数组
 * @param targetUnit 目标单位 (B, KB, MB, GB, TB, PB)
 * @returns 转换后的数值数组
 */
export function convertBytesToUnit(bytesArray: number[], targetUnit: string): number[] {
  const unitIndex = BYTE_UNITS.indexOf(targetUnit)
  if (unitIndex === -1) return bytesArray

  const divisor = Math.pow(1024, unitIndex)
  return bytesArray.map((bytes) => parseFloat((bytes / divisor).toFixed(2)))
}

/**
 * 将速度数组转换为指定单位的数值数组
 * @param speedArray 速度数组（字节/秒）
 * @param targetUnit 目标单位 (B/s, KB/s, MB/s, GB/s, TB/s)
 * @returns 转换后的数值数组
 */
export function convertSpeedToUnit(speedArray: number[], targetUnit: string): number[] {
  const unitIndex = SPEED_UNITS.indexOf(targetUnit)
  if (unitIndex === -1) return speedArray

  const divisor = Math.pow(1024, unitIndex)
  return speedArray.map((speed) => parseFloat((speed / divisor).toFixed(2)))
}

/**
 * 根据数据最大值自动选择最佳显示单位
 * @param values 数值数组
 * @param isSpeed 是否为速度单位
 * @returns 最佳单位
 */
export function getOptimalUnit(values: number[], isSpeed = false): string {
  const units = isSpeed ? SPEED_UNITS : BYTE_UNITS
  const maxValue = Math.max(...values.filter((v) => Number.isFinite(v)))

  if (maxValue === 0 || !Number.isFinite(maxValue)) {
    return units[0] ?? (isSpeed ? 'B/s' : 'B')
  }

  const k = 1024
  const i = Math.floor(Math.log(maxValue) / Math.log(k))
  return units[Math.min(i, units.length - 1)] ?? (isSpeed ? 'B/s' : 'B')
}

/**
 * 格式化百分比
 * @param value 小数值 (0-1) 或百分比值 (0-100)
 * @param isDecimal 是否为小数值，默认 true
 * @param decimals 小数位数，默认 1
 * @returns 格式化后的百分比字符串
 */
export function formatPercent(value: number, isDecimal = true, decimals = 1): string {
  const percent = isDecimal ? value * 100 : value
  return `${percent.toFixed(decimals)}%`
}

/**
 * 格式化时间戳为本地时间字符串
 * @param timestamp ISO 时间戳字符串
 * @param format 格式类型: 'full' | 'date' | 'time' | 'short'
 * @returns 格式化后的时间字符串
 */
export function formatTimestamp(
  timestamp: string,
  format: 'full' | 'date' | 'time' | 'short' = 'short'
): string {
  const date = new Date(timestamp)

  if (isNaN(date.getTime())) {
    return timestamp
  }

  switch (format) {
    case 'full':
      return date.toLocaleString()
    case 'date':
      return date.toLocaleDateString()
    case 'time':
      return date.toLocaleTimeString()
    case 'short':
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    default:
      return date.toLocaleString()
  }
}

/**
 * 根据时间范围计算合适的时间格式
 * @param startTime 开始时间戳
 * @param endTime 结束时间戳
 * @returns 适合的时间格式
 */
export function getTimeFormatByRange(startTime: number, endTime: number): 'full' | 'date' | 'time' | 'short' {
  const duration = endTime - startTime
  const hour = 60 * 60 * 1000
  const day = 24 * hour

  if (duration <= hour) {
    return 'short' // 1小时内，显示 HH:mm
  } else if (duration <= day) {
    return 'time' // 1天内，显示完整时间
  } else if (duration <= 7 * day) {
    return 'short' // 7天内，显示 HH:mm
  } else {
    return 'date' // 超过7天，显示日期
  }
}

/**
 * 计算磁盘使用率
 * @param used 已用空间（字节）
 * @param total 总空间（字节）
 * @returns 使用率百分比 (0-100)
 */
export function calculateDiskUsagePercent(used: number, total: number): number {
  if (total === 0 || !Number.isFinite(total)) return 0
  return parseFloat(((used / total) * 100).toFixed(1))
}

/**
 * 计算内存使用率
 * @param used 已用内存（字节）
 * @param total 总内存（字节）
 * @returns 使用率百分比 (0-100)
 */
export function calculateMemoryUsagePercent(used: number, total: number): number {
  if (total === 0 || !Number.isFinite(total)) return 0
  return parseFloat(((used / total) * 100).toFixed(1))
}
