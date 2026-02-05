<template>
  <div class="system-monitor-view">
    <!-- 页面标题 -->
    <n-page-header :title="t('monitor.title')" :subtitle="t('monitor.subtitle')">
      <template #extra>
        <n-space>
          <!-- 刷新按钮 -->
          <n-button :loading="loading" @click="fetchData">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            {{ t('common.refresh') }}
          </n-button>
          <!-- 导出按钮 -->
          <n-dropdown :options="exportOptions" @select="handleExport">
            <n-button type="primary">
              <template #icon>
                <n-icon><DownloadOutline /></n-icon>
              </template>
              {{ t('monitor.export') }}
            </n-button>
          </n-dropdown>
        </n-space>
      </template>
    </n-page-header>

    <!-- 时间范围选择器 -->
    <n-card class="time-range-card" size="small">
      <div class="time-range-content">
        <!-- 预设时间范围 -->
        <div class="preset-section">
          <n-scrollbar x-scrollable class="preset-scrollbar">
            <n-radio-group 
              v-model:value="selectedPreset" 
              @update:value="handlePresetChange"
              class="preset-radio-group"
            >
              <n-radio-button
                v-for="preset in timePresets"
                :key="`${preset.value}-${preset.unit}`"
                :value="`${preset.value}-${preset.unit}`"
                class="preset-radio-button"
              >
                {{ preset.label }}
              </n-radio-button>
            </n-radio-group>
          </n-scrollbar>
        </div>

        <!-- 自定义时间范围 -->
        <div class="custom-range-section">
          <span class="time-range-label">{{ t('monitor.customRange') }}:</span>
          <n-date-picker
            v-model:value="customTimeRange"
            type="datetimerange"
            :placeholder="[t('monitor.startTime'), t('monitor.endTime')]"
            clearable
            class="custom-date-picker"
            @update:value="handleCustomRangeChange"
          />
        </div>
      </div>
    </n-card>

    <!-- 加载状态 -->
    <n-spin :show="loading" description="Loading...">
      <!-- 无数据提示 -->
      <n-empty v-if="!loading && metrics.length === 0" :description="t('common.noData')" />

      <!-- 图表区域 -->
      <div v-else class="charts-container">
        <!-- CPU 使用率图表 -->
        <n-card class="chart-card" size="small">
          <template #header-extra>
            <n-button quaternary circle size="small" @click="exportSingleChart('cpu')">
              <template #icon>
                <n-icon><DownloadOutline /></n-icon>
              </template>
            </n-button>
          </template>
          <v-chart
            ref="cpuChartRef"
            class="chart"
            :option="cpuChartOption"
            autoresize
          />
        </n-card>

        <!-- 内存使用率图表 -->
        <n-card class="chart-card" size="small">
          <template #header-extra>
            <n-button quaternary circle size="small" @click="exportSingleChart('memory')">
              <template #icon>
                <n-icon><DownloadOutline /></n-icon>
              </template>
            </n-button>
          </template>
          <v-chart
            ref="memoryChartRef"
            class="chart"
            :option="memoryChartOption"
            autoresize
          />
        </n-card>

        <!-- 网络速度图表 -->
        <n-card class="chart-card" size="small">
          <template #header-extra>
            <n-button quaternary circle size="small" @click="exportSingleChart('networkSpeed')">
              <template #icon>
                <n-icon><DownloadOutline /></n-icon>
              </template>
            </n-button>
          </template>
          <v-chart
            ref="networkSpeedChartRef"
            class="chart"
            :option="networkSpeedChartOption"
            autoresize
          />
        </n-card>

        <!-- 网络流量累计图表 -->
        <n-card class="chart-card" size="small">
          <template #header-extra>
            <n-button quaternary circle size="small" @click="exportSingleChart('networkTraffic')">
              <template #icon>
                <n-icon><DownloadOutline /></n-icon>
              </template>
            </n-button>
          </template>
          <v-chart
            ref="networkTrafficChartRef"
            class="chart"
            :option="networkTrafficChartOption"
            autoresize
          />
        </n-card>

        <!-- 磁盘使用率图表 -->
        <n-card class="chart-card chart-card-full" size="small">
          <template #header-extra>
            <n-button quaternary circle size="small" @click="exportSingleChart('disk')">
              <template #icon>
                <n-icon><DownloadOutline /></n-icon>
              </template>
            </n-button>
          </template>
          <v-chart
            ref="diskChartRef"
            class="chart"
            :option="diskChartOption"
            autoresize
          />
        </n-card>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import {
  RefreshOutline,
  DownloadOutline,
} from '@vicons/ionicons5'
import { useSettingsStore } from '@/stores/settings'
import { monitorService } from '@/api/services/monitor'
import type { SysMainMetrics, TimeUnit, TimeRangePreset } from '@/types'
import {
  generateCpuChartOption,
  generateMemoryChartOption,
  generateNetworkSpeedChartOption,
  generateNetworkTrafficChartOption,
  generateDiskUsageChartOption,
  exportChart,
  exportAllCharts,
} from '@/utils/chart'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

const { t } = useI18n()
const message = useMessage()
const settingsStore = useSettingsStore()

// 主题状态
const isDark = computed(() => settingsStore.currentTheme.darkMode)

// 加载状态
const loading = ref(false)

// 指标数据
const metrics = ref<SysMainMetrics[]>([])

// 图表引用
const cpuChartRef = ref<InstanceType<typeof VChart> | null>(null)
const memoryChartRef = ref<InstanceType<typeof VChart> | null>(null)
const networkSpeedChartRef = ref<InstanceType<typeof VChart> | null>(null)
const networkTrafficChartRef = ref<InstanceType<typeof VChart> | null>(null)
const diskChartRef = ref<InstanceType<typeof VChart> | null>(null)

// 时间范围预设
const timePresets = computed<TimeRangePreset[]>(() => [
  { label: t('monitor.timePresets.5min'), value: 5, unit: 'min' as TimeUnit },
  { label: t('monitor.timePresets.15min'), value: 15, unit: 'min' as TimeUnit },
  { label: t('monitor.timePresets.30min'), value: 30, unit: 'min' as TimeUnit },
  { label: t('monitor.timePresets.1hour'), value: 1, unit: 'h' as TimeUnit },
  { label: t('monitor.timePresets.6hours'), value: 6, unit: 'h' as TimeUnit },
  { label: t('monitor.timePresets.12hours'), value: 12, unit: 'h' as TimeUnit },
  { label: t('monitor.timePresets.1day'), value: 1, unit: 'd' as TimeUnit },
  { label: t('monitor.timePresets.7days'), value: 7, unit: 'd' as TimeUnit },
  { label: t('monitor.timePresets.30days'), value: 30, unit: 'd' as TimeUnit },
])

// 选中的预设
const selectedPreset = ref('1-h')

// 自定义时间范围
const customTimeRange = ref<[number, number] | null>(null)

// 导出选项
const exportOptions = computed(() => [
  {
    label: t('monitor.exportSingle'),
    key: 'single',
    children: [
      { label: t('monitor.cpuUsage'), key: 'cpu' },
      { label: t('monitor.memoryUsage'), key: 'memory' },
      { label: t('monitor.networkSpeed'), key: 'networkSpeed' },
      { label: t('monitor.networkTraffic'), key: 'networkTraffic' },
      { label: t('monitor.diskUsage'), key: 'disk' },
    ],
  },
  {
    label: t('monitor.exportAll'),
    key: 'all',
  },
])

// 图表配置
const cpuChartOption = computed(() =>
  generateCpuChartOption(metrics.value, isDark.value, t)
)

const memoryChartOption = computed(() =>
  generateMemoryChartOption(metrics.value, isDark.value, t)
)

const networkSpeedChartOption = computed(() =>
  generateNetworkSpeedChartOption(metrics.value, isDark.value, t)
)

const networkTrafficChartOption = computed(() =>
  generateNetworkTrafficChartOption(metrics.value, isDark.value, t)
)

const diskChartOption = computed(() =>
  generateDiskUsageChartOption(metrics.value, isDark.value, t)
)

/**
 * 获取数据
 */
async function fetchData() {
  loading.value = true
  try {
    if (customTimeRange.value) {
      // 使用自定义时间范围
      const [startTime, endTime] = customTimeRange.value
      metrics.value = await monitorService.getMetricsByTimeRange(startTime, endTime)
    } else {
      // 使用预设时间
      const parts = selectedPreset.value.split('-')
      const value = parts[0] ?? '1'
      const unit = parts[1] ?? 'h'
      metrics.value = await monitorService.getMetricsByLastTime(
        parseInt(value),
        unit as TimeUnit
      )
    }
  } catch (error: any) {
    console.error('Failed to fetch metrics:', error)
    message.error(error?.message || t('common.fetchFailed'))
  } finally {
    loading.value = false
  }
}

/**
 * 处理预设时间范围变更
 */
function handlePresetChange() {
  // 清除自定义时间范围
  customTimeRange.value = null
  fetchData()
}

/**
 * 处理自定义时间范围变更
 */
function handleCustomRangeChange(value: [number, number] | null) {
  if (value) {
    // 清除预设选择（通过设置为空字符串，因为没有匹配的预设）
    selectedPreset.value = ''
    fetchData()
  }
}

/**
 * 导出单个图表
 */
function exportSingleChart(chartType: string) {
  const chartRefMap: Record<string, any> = {
    cpu: cpuChartRef.value,
    memory: memoryChartRef.value,
    networkSpeed: networkSpeedChartRef.value,
    networkTraffic: networkTrafficChartRef.value,
    disk: diskChartRef.value,
  }

  const chart = chartRefMap[chartType]
  if (chart) {
    exportChart(chart, {
      filename: `${chartType}_${Date.now()}`,
      backgroundColor: isDark.value ? '#18181c' : '#ffffff',
    })
    message.success(t('monitor.exportSuccess'))
  }
}

/**
 * 处理导出
 */
function handleExport(key: string) {
  if (key === 'all') {
    // 导出所有图表
    const charts = [
      cpuChartRef.value,
      memoryChartRef.value,
      networkSpeedChartRef.value,
      networkTrafficChartRef.value,
      diskChartRef.value,
    ]
    exportAllCharts(charts, {
      filename: `system_monitor_${Date.now()}`,
      backgroundColor: isDark.value ? '#18181c' : '#ffffff',
    })
    message.success(t('monitor.exportSuccess'))
  } else {
    // 导出单个图表
    exportSingleChart(key)
  }
}

// 监听主题变化重新渲染图表
watch(isDark, () => {
  // 图表配置会自动通过 computed 更新
})

// 组件挂载时获取数据
onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="css">
.system-monitor-view {
  padding: var(--spacing-lg);
}

/* 时间范围选择器 */
.time-range-card {
  margin: var(--spacing-md) 0;
}

.time-range-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.preset-section {
  width: 100%;
}

.preset-scrollbar {
  max-width: 100%;
}

.preset-radio-group {
  display: flex;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.preset-radio-button {
  flex-shrink: 0;
}

.custom-range-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.time-range-label {
  color: var(--text-color-secondary);
  font-size: 14px;
  flex-shrink: 0;
}

.custom-date-picker {
  flex: 1;
  min-width: 200px;
}

/* 图表区域 */
.charts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.chart-card {
  min-height: 350px;
}

.chart-card-full {
  grid-column: 1 / -1;
}

.chart {
  width: 100%;
  height: 300px;
}

/* 平板设备 */
@media (max-width: 1200px) {
  .charts-container {
    grid-template-columns: 1fr;
  }

  .chart-card-full {
    grid-column: 1;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .system-monitor-view {
    padding: var(--spacing-sm);
  }

  /* 页面标题区域 */
  .system-monitor-view :deep(.n-page-header) {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .system-monitor-view :deep(.n-page-header__extra) {
    width: 100%;
  }

  .system-monitor-view :deep(.n-page-header__extra .n-space) {
    width: 100%;
    justify-content: flex-end;
  }

  /* 时间范围选择器 */
  .time-range-card {
    margin: var(--spacing-sm) 0;
  }

  .time-range-content {
    gap: var(--spacing-sm);
  }

  .preset-section {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .preset-radio-group {
    padding-bottom: var(--spacing-xs);
  }

  .preset-radio-button {
    font-size: 12px;
    padding: 0 8px;
  }

  .custom-range-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .custom-date-picker {
    width: 100%;
    min-width: unset;
  }

  /* 图表区域 */
  .charts-container {
    gap: var(--spacing-sm);
  }

  .chart-card {
    min-height: 280px;
  }

  .chart {
    height: 240px;
  }

  /* 图表卡片内的按钮 */
  .chart-card :deep(.n-card-header__extra) {
    padding: 0;
  }
}

/* 超小屏幕 */
@media (max-width: 480px) {
  .system-monitor-view {
    padding: var(--spacing-xs);
  }

  .chart-card {
    min-height: 250px;
  }

  .chart {
    height: 200px;
  }

  .preset-radio-button {
    font-size: 11px;
    padding: 0 6px;
  }
}
</style>
