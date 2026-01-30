<template>
  <div class="dashboard">
    <!-- 系统状态卡片 -->
    <div class="status-cards">
      <n-card class="status-card" v-for="stat in statusCards" :key="stat.key">
        <div class="stat-content">
          <div class="stat-icon" :style="{ backgroundColor: stat.color }">
            <n-icon :size="28" color="#fff">
              <component :is="stat.icon" />
            </n-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 动态图表区域 -->
    <div class="charts-grid">
      <!-- CPU 使用率 -->
      <n-card title="CPU 使用率" class="chart-card">
        <template #header-extra>
          <n-tag :type="cpuUsage > 80 ? 'error' : cpuUsage > 50 ? 'warning' : 'success'" size="small">
            {{ cpuUsage.toFixed(1) }}%
          </n-tag>
        </template>
        <div ref="cpuChartRef" class="chart-container"></div>
      </n-card>

      <!-- 内存使用率 -->
      <n-card title="内存剩余情况" class="chart-card">
        <template #header-extra>
          <n-tag :type="memoryUsage > 80 ? 'error' : memoryUsage > 50 ? 'warning' : 'success'" size="small">
            {{ memoryUsage.toFixed(1) }}%
          </n-tag>
        </template>
        <div ref="memoryChartRef" class="chart-container"></div>
        <div class="memory-info">
          <span>已用: {{ formatBytes(memoryUsed) }}</span>
          <span>总计: {{ formatBytes(memoryTotal) }}</span>
        </div>
      </n-card>

      <!-- 网络流量 -->
      <n-card title="网络流量" class="chart-card">
        <template #header-extra>
          <div class="network-stats">
            <span class="download"><n-icon color="#18a058"><ArrowDownOutline /></n-icon> {{ formatSpeed(totalDownloadSpeed) }}</span>
            <span class="upload"><n-icon color="#f0a020"><ArrowUpOutline /></n-icon> {{ formatSpeed(totalUploadSpeed) }}</span>
          </div>
        </template>
        <div ref="networkChartRef" class="chart-container"></div>
      </n-card>
    </div>

    <!-- 硬件信息 -->
    <div class="dashboard-grid">
      <n-card title="硬件信息" class="hardware-card">
        <template #header-extra>
          <n-button text type="primary" @click="fetchHardwareInfo" :loading="loadingHardware">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            刷新
          </n-button>
        </template>
        <n-spin :show="loadingHardware">
          <div class="hardware-info" v-if="hardwareData">
            <!-- 操作系统 -->
            <div class="info-section">
              <div class="section-header">
                <n-icon><LaptopOutline /></n-icon>
                <span>系统信息</span>
              </div>
              <div class="info-row">
                <span class="info-label">操作系统:</span>
                <span class="info-value">{{ hardwareData.operatingSystem || '未知' }}</span>
              </div>
            </div>

            <!-- CPU信息 -->
            <div class="info-section" v-if="hardwareData.cpuModel">
              <div class="section-header">
                <n-icon><HardwareChipOutline /></n-icon>
                <span>处理器</span>
              </div>
              <div class="info-row">
                <span class="info-label">型号:</span>
                <span class="info-value">{{ hardwareData.cpuModel }}</span>
              </div>
              <div class="info-row" v-if="hardwareData.cpuVendor">
                <span class="info-label">厂商:</span>
                <span class="info-value">{{ hardwareData.cpuVendor }}</span>
              </div>
            </div>

            <!-- 主板信息 -->
            <div class="info-section" v-if="hardwareData.mainBoardModel || hardwareData.mainBoardVendor">
              <div class="section-header">
                <n-icon><GridOutline /></n-icon>
                <span>主板</span>
              </div>
              <div class="info-row" v-if="hardwareData.mainBoardVendor">
                <span class="info-label">厂商:</span>
                <span class="info-value">{{ hardwareData.mainBoardVendor }}</span>
              </div>
              <div class="info-row" v-if="hardwareData.mainBoardModel && hardwareData.mainBoardModel !== 'unknown'">
                <span class="info-label">型号:</span>
                <span class="info-value">{{ hardwareData.mainBoardModel }}</span>
              </div>
            </div>

            <!-- 内存信息 -->
            <div class="info-section" v-if="hardwareData.memoryList && hardwareData.memoryList.length">
              <div class="section-header">
                <n-icon><BarChartOutline /></n-icon>
                <span>内存 ({{ getTotalMemory() }}GB)</span>
              </div>
              <div class="memory-list">
                <div class="memory-item" v-for="(mem, index) in hardwareData.memoryList" :key="index">
                  <div class="info-row">
                    <span class="info-label">插槽 {{ index + 1 }}:</span>
                    <span class="info-value">{{ mem.vendor }} {{ mem.model }} {{ mem.sizeGb }}GB</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 存储信息 -->
            <div class="info-section" v-if="hardwareData.diskList && hardwareData.diskList.length">
              <div class="section-header">
                <n-icon><LibraryOutline /></n-icon>
                <span>存储 ({{ getTotalDisk() }}GB)</span>
              </div>
              <div class="disk-list">
                <div class="disk-item" v-for="(disk, index) in hardwareData.diskList" :key="index">
                  <div class="disk-header">
                    <span class="disk-name">{{ disk.model || disk.vendorOrSerial }}</span>
                  </div>
                  <div class="disk-detail">
                    <span>容量: {{ disk.sizeGb }}GB </span>
                    <span v-if="disk.vendorOrSerial && disk.vendorOrSerial !== disk.model">序列号: {{ disk.vendorOrSerial }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 显卡信息 -->
            <div class="info-section" v-if="hardwareData.gpuList && hardwareData.gpuList.length">
              <div class="section-header">
                <n-icon><TvOutline /></n-icon>
                <span>显卡</span>
              </div>
              <div class="gpu-list">
                <div class="gpu-item" v-for="(gpu, index) in hardwareData.gpuList" :key="index">
                  <div class="info-row">
                    <span class="info-label">{{ index + 1 }}.</span>
                    <span class="info-value">{{ gpu.model }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <n-empty v-else description="暂无硬件信息" />
        </n-spin>
      </n-card>

      <!-- 磁盘使用情况 -->
      <n-card title="磁盘使用情况" class="disk-usage-card">
        <n-spin :show="loadingDisk">
          <div class="disk-usage-list" v-if="diskUsageList.length">
            <div class="disk-usage-item" v-for="(disk, index) in diskUsageList" :key="index">
              <div class="disk-usage-header">
                <span class="disk-name">{{ disk.name }}</span>
                <span class="disk-percent">{{ disk.usage }}%</span>
              </div>
              <n-progress
                type="line"
                :percentage="parseFloat(disk.usage)"
                :color="getProgressColor(parseFloat(disk.usage))"
                :show-indicator="false"
              />
              <div class="disk-usage-detail">
                <span>已用: {{ formatBytes(disk.used) }}</span>
                <span>可用: {{ formatBytes(disk.available) }}</span>
              </div>
            </div>
          </div>
          <n-empty v-else-if="!loadingDisk" description="暂无磁盘信息" />
        </n-spin>
      </n-card>
    </div>

    <!-- 快速操作 -->
    <n-card title="快速操作" class="quick-actions-card">
      <div class="quick-actions">
        <n-button @click="router.push('/files')">
          <template #icon><n-icon><FolderOutline /></n-icon></template>
          文件管理
        </n-button>
        <n-button @click="router.push('/users')" v-if="isAdmin">
          <template #icon><n-icon><PeopleOutline /></n-icon></template>
          用户管理
        </n-button>
        <n-button @click="router.push('/ddns')">
          <template #icon><n-icon><CloudOutline /></n-icon></template>
          DDNS设置
        </n-button>
        <n-button @click="router.push('/settings')">
          <template #icon><n-icon><SettingsOutline /></n-icon></template>
          个人设置
        </n-button>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { hardwareService } from '@/api/services/hardware'
import { useAuthStore } from '@/stores/auth'
import * as echarts from 'echarts'
import type { HardwareInfoDTO } from '@/types'
import {
  RefreshOutline,
  HardwareChipOutline,
  BarChartOutline,
  LibraryOutline,
  ArrowDownOutline,
  ArrowUpOutline,
  FolderOutline,
  PeopleOutline,
  CloudOutline,
  SettingsOutline,
  LaptopOutline,
  GridOutline,
  TvOutline,
} from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

// 状态
const hardwareInfo = ref<HardwareInfoDTO | null>(null)
const hardwareData = ref<any>(null)
const loadingHardware = ref(false)
const loadingDisk = ref(false)
const systemStatus = ref('online')
const cpuChartRef = ref<HTMLElement | null>(null)
const memoryChartRef = ref<HTMLElement | null>(null)
const networkChartRef = ref<HTMLElement | null>(null)

// 实时数据
const cpuUsage = ref(0)
const memoryTotal = ref(0)
const memoryUsed = ref(0)
const memoryUsage = computed(() => memoryTotal.value > 0 ? (memoryUsed.value / memoryTotal.value) * 100 : 0)
const totalDownloadSpeed = ref(0)
const totalUploadSpeed = ref(0)
const diskUsageList = ref<Array<{ name: string; usage: string; used: number; available: number }>>([])

// 图表实例
let cpuChart: echarts.ECharts | null = null
let memoryChart: echarts.ECharts | null = null
let networkChart: echarts.ECharts | null = null

// 数据队列（最多50个点）
const cpuDataQueue = ref<number[]>([])
const memoryDataQueue = ref<number[]>([])
const networkUploadQueue = ref<number[]>([])
const networkDownloadQueue = ref<number[]>([])

// WebSocket
let websocket: WebSocket | null = null
let reconnectAttempts = 0
const maxReconnectAttempts = 10

// 获取新格式的硬件数据
interface HardwareData {
  operatingSystem?: string
  cpuModel?: string
  cpuVendor?: string
  mainBoardModel?: string
  mainBoardVendor?: string
  memoryList?: Array<{ vendor?: string; model?: string; sizeGb: number }>
  diskList?: Array<{ model?: string; vendorOrSerial?: string; sizeGb: number }>
  gpuList?: Array<{ model?: string; vendor?: string }>
}

// 计算属性
const isAdmin = computed(() => authStore.username === 'admin')

// 状态卡片数据
const statusCards = computed(() => [
  {
    key: 'status',
    label: '系统状态',
    value: systemStatus.value === 'online' ? '运行中' : '离线',
    icon: CheckmarkCircleOutline,
    color: systemStatus.value === 'online' ? '#18a058' : '#d03050',
  },
  {
    key: 'cpu',
    label: 'CPU使用率',
    value: cpuUsage.value.toFixed(1) + '%',
    icon: HardwareChipOutline,
    color: cpuUsage.value > 80 ? '#d03050' : cpuUsage.value > 50 ? '#f0a020' : '#18a058',
  },
  {
    key: 'memory',
    label: '内存使用率',
    value: memoryUsage.value.toFixed(1) + '%',
    icon: BarChartOutline,
    color: memoryUsage.value > 80 ? '#d03050' : memoryUsage.value > 50 ? '#f0a020' : '#18a058',
  },
  {
    key: 'network',
    label: '网络下载',
    value: formatSpeed(totalDownloadSpeed.value),
    icon: ArrowDownOutline,
    color: '#2080f0',
  },
])

/**
 * 初始化图表
 */
function initCharts() {
  // CPU 图表
  if (cpuChartRef.value) {
    cpuChart = echarts.init(cpuChartRef.value)
    cpuChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      xAxis: { type: 'category', boundaryGap: false, show: false },
      yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
      series: [{
        name: 'CPU使用率',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        lineStyle: { width: 2 },
        data: [],
        itemStyle: { color: '#2080f0' },
      }],
    })
  }

  // 内存图表
  if (memoryChartRef.value) {
    memoryChart = echarts.init(memoryChartRef.value)
    memoryChart.setOption({
      tooltip: { 
        trigger: 'axis', 
        formatter: (params: any) => `剩余内存: ${params[0].value.toFixed(2)} GB` 
      },
      grid: { left: 60, right: 20, top: 30, bottom: 30 },
      xAxis: { type: 'category', boundaryGap: false, show: false },
      yAxis: { 
        type: 'value', 
        min: 0,
        axisLabel: { formatter: '{value} GB' }
      },
      series: [{
        name: '剩余内存',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        lineStyle: { width: 2 },
        data: [],
        itemStyle: { color: '#f0a020' },
      }],
    })
  }

  // 网络图表
  if (networkChartRef.value) {
    networkChart = echarts.init(networkChartRef.value)
    networkChart.setOption({
      tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0].seriesName}: ${params[0].value.toFixed(2)} KB/s` },
      legend: { data: ['上传', '下载'], top: 0 },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', boundaryGap: false, show: false },
      yAxis: { type: 'value', axisLabel: { formatter: '{value} KB/s' } },
      series: [
        {
          name: '上传',
          type: 'line',
          smooth: true,
          lineStyle: { width: 2 },
          data: [],
          itemStyle: { color: '#f0a020' },
        },
        {
          name: '下载',
          type: 'line',
          smooth: true,
          lineStyle: { width: 2 },
          data: [],
          itemStyle: { color: '#18a058' },
        },
      ],
    })
  }
}

/**
 * 更新图表数据
 */
function updateCharts() {
  // 更新 CPU 图表
  if (cpuChart && cpuDataQueue.value.length > 0) {
    cpuChart.setOption({
      series: [{ data: cpuDataQueue.value }],
    })
  }

  // 更新内存图表
  if (memoryChart && memoryDataQueue.value.length > 0) {
    memoryChart.setOption({
      series: [{ data: memoryDataQueue.value }],
    })
  }

  // 更新网络图表
  if (networkChart && networkUploadQueue.value.length > 0) {
    networkChart.setOption({
      series: [
        { name: '上传', data: networkUploadQueue.value },
        { name: '下载', data: networkDownloadQueue.value },
      ],
    })
  }
}

/**
 * 连接 WebSocket
 */
function connectWebSocket() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8848'
  const token = localStorage.getItem('foxnas_token')
  const wsUrl = `${apiBaseUrl.replace('http', 'ws')}/ws/overview?token=${token}`

  try {
    websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      console.log('WebSocket connected')
      systemStatus.value = 'online'
      reconnectAttempts = 0
    }

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleRealtimeData(data)
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
      }
    }

    websocket.onclose = () => {
      console.log('WebSocket disconnected')
      systemStatus.value = 'offline'
      attemptReconnect()
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      systemStatus.value = 'offline'
    }
  } catch (error) {
    console.error('Failed to connect WebSocket:', error)
    systemStatus.value = 'offline'
  }
}

/**
 * 尝试重连
 */
function attemptReconnect() {
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++
    console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`)
    setTimeout(connectWebSocket, 3000)
  }
}

/**
 * 处理实时数据
 */
function handleRealtimeData(data: any) {
  // CPU 使用率
  if (data.cpu !== undefined) {
    cpuUsage.value = data.cpu
    cpuDataQueue.value.push(data.cpu)
    if (cpuDataQueue.value.length > 50) {
      cpuDataQueue.value.shift()
    }
  }

  // 内存信息
  if (data.memory) {
    memoryTotal.value = data.memory.total || 0
    memoryUsed.value = data.memory.used || 0
    // 转换为 GB 存入队列用于图表显示
    const freeMemoryGB = (memoryTotal.value - memoryUsed.value) / (1024 * 1024 * 1024)
    memoryDataQueue.value.push(parseFloat(freeMemoryGB.toFixed(2)))
    if (memoryDataQueue.value.length > 50) {
      memoryDataQueue.value.shift()
    }
  }

  // 网络信息
  if (data.network && Array.isArray(data.network)) {
    let uploadTotal = 0
    let downloadTotal = 0

    data.network.forEach((net: any) => {
      uploadTotal += net.sentSpeed || 0
      downloadTotal += net.recvSpeed || 0
    })

    totalUploadSpeed.value = uploadTotal
    totalDownloadSpeed.value = downloadTotal

    // 转换为 KB/s
    const uploadKB = uploadTotal / 1024
    const downloadKB = downloadTotal / 1024

    networkUploadQueue.value.push(uploadKB)
    networkDownloadQueue.value.push(downloadKB)
    if (networkUploadQueue.value.length > 50) {
      networkUploadQueue.value.shift()
      networkDownloadQueue.value.shift()
    }
  }

  // 磁盘信息
  if (data.disk && Array.isArray(data.disk)) {
    diskUsageList.value = data.disk.map((disk: any) => ({
      name: disk.name,
      usage: ((disk.used / disk.total) * 100).toFixed(1),
      used: disk.used,
      available: disk.free,
    }))
  }

  updateCharts()
}

/**
 * 获取硬件信息
 */
async function fetchHardwareInfo() {
  loadingHardware.value = true
  try {
    const response = await hardwareService.getHardwareInfo()
    if (response && typeof response === 'object' && 'data' in response) {
      hardwareData.value = (response as any).data
    } else {
      hardwareInfo.value = response as HardwareInfoDTO
    }
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '获取硬件信息失败')
  } finally {
    loadingHardware.value = false
  }
}

/**
 * 格式化字节
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取合适的单位（用于图表轴）
 */
function getUnitAndValue(bytes: number): { value: number; unit: string } {
  if (bytes === 0) return { value: 0, unit: 'B' }
  const k = 1024
  const units: string[] = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1)
  return {
    value: bytes / Math.pow(k, i),
    unit: units[i],
  }
}

/**
 * 格式化速度
 */
function formatSpeed(bytes: number): string {
  if (bytes === 0) return '0 B/s'
  const { value, unit } = getUnitAndValue(bytes)
  return `${value.toFixed(2)} ${unit}/s`
}

/**
 * 获取进度条颜色
 */
function getProgressColor(percentage: number): string {
  if (percentage < 50) return '#18a058'
  if (percentage < 80) return '#f0a020'
  return '#d03050'
}

/**
 * 获取总内存容量
 */
function getTotalMemory(): number {
  if (!hardwareData.value?.memoryList || !Array.isArray(hardwareData.value.memoryList)) return 0
  return hardwareData.value.memoryList.reduce((total: number, mem: { sizeGb?: number }) => total + (mem.sizeGb || 0), 0)
}

/**
 * 获取总磁盘容量
 */
function getTotalDisk(): number {
  if (!hardwareData.value?.diskList || !Array.isArray(hardwareData.value.diskList)) return 0
  return hardwareData.value.diskList.reduce((total: number, disk: { sizeGb?: number }) => total + (disk.sizeGb || 0), 0)
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
  cpuChart?.resize()
  memoryChart?.resize()
  networkChart?.resize()
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    initCharts()
    connectWebSocket()
    fetchHardwareInfo()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  if (websocket) {
    websocket.close()
  }
  cpuChart?.dispose()
  memoryChart?.dispose()
  networkChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<script lang="ts">
import { CheckmarkCircleOutline } from '@vicons/ionicons5'
</script>

<style scoped lang="css">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 状态卡片 */
.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.status-card {
  border-radius: 12px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(24, 160, 88, 0.1);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color-base);
}

.stat-label {
  font-size: 14px;
  color: var(--text-color-tertiary);
}

/* 动态图表区域 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.chart-card {
  border-radius: 12px;
}

.chart-container {
  height: 180px;
  width: 100%;
}

.network-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.network-stats .download,
.network-stats .upload {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.n-card__header) {
  flex-wrap: wrap;
}

:deep(.n-card__header-extra) {
  margin-left: auto;
}

.memory-info {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-color-tertiary);
}

/* 内容网格 */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

/* 硬件信息 */
.hardware-card,
.disk-usage-card {
  border-radius: 12px;
}

.info-section {
  margin-bottom: 24px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--text-color-base);
}

.info-row {
  display: flex;
  margin-top: 8px;
  font-size: 14px;
}

.info-label {
  color: var(--text-color-tertiary);
  margin-right: 8px;
}

.info-value {
  color: var(--text-color-base);
}

/* 磁盘使用情况 */
.disk-usage-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.disk-usage-item {
  padding: 12px;
  background: var(--bg-color-secondary);
  border-radius: 8px;
}

.disk-usage-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.disk-name {
  font-weight: 500;
  color: var(--text-color-base);
}

.disk-percent {
  font-weight: 500;
  color: var(--text-color-base);
}

.disk-usage-detail {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-color-tertiary);
}

/* 网络列表 */
.network-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.network-item {
  padding: 12px;
  background: var(--bg-color-secondary);
  border-radius: 8px;
}

.network-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.network-name {
  font-weight: 500;
  color: var(--text-color-base);
}

.network-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-color-secondary);
}

/* 快速操作 */
.quick-actions-card {
  border-radius: 12px;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* 响应式 */
@media screen and (max-width: 768px) {
  .charts-grid,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .status-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 480px) {
  .status-cards {
    grid-template-columns: 1fr;
  }
}
</style>
