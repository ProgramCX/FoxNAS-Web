<template>
  <div class="dashboard">
    <!-- 系统状态卡片 -->
    <div class="status-cards">
      <n-card class="status-card" v-for="stat in statusCards" :key="stat.key">
        <div class="stat-content">
          <div class="stat-icon" :style="{ backgroundColor: stat.color }">
            <n-icon :size="24" :color="stat.color">
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

    <!-- 主要内容区 -->
    <div class="dashboard-grid">
      <!-- 硬件信息 -->
      <n-card title="硬件信息" class="hardware-card">
        <template #header-extra>
          <n-button text type="primary" @click="fetchHardwareInfo" :loading="loadingHardware">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            刷新
          </n-button>
        </template>
        <n-spin :show="loadingHardware">
          <div class="hardware-info" v-if="hardwareInfo">
            <!-- CPU信息 -->
            <div class="info-section" v-if="hardwareInfo.cpu">
              <div class="section-header">
                <n-icon><HardwareChipOutline /></n-icon>
                <span>CPU</span>
              </div>
              <n-progress
                type="line"
                :percentage="hardwareInfo.cpu.usage"
                :indicator-placement="'inside'"
                :color="getProgressColor(hardwareInfo.cpu.usage)"
              >
                <span class="progress-text">{{ hardwareInfo.cpu.usage }}%</span>
              </n-progress>
              <div class="info-row">
                <span class="info-label">型号:</span>
                <span class="info-value">{{ hardwareInfo.cpu.name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">核心/线程:</span>
                <span class="info-value">{{ hardwareInfo.cpu.cores }} 核 / {{ hardwareInfo.cpu.threads }} 线程</span>
              </div>
            </div>

            <!-- 内存信息 -->
            <div class="info-section" v-if="hardwareInfo.memory">
              <div class="section-header">
                <n-icon><BarChartOutline /></n-icon>
                <span>内存</span>
              </div>
              <n-progress
                type="line"
                :percentage="getMemoryUsage()"
                :indicator-placement="'inside'"
                :color="getProgressColor(getMemoryUsage())"
              >
                <span class="progress-text">{{ formatBytes(hardwareInfo.memory.used) }} / {{ formatBytes(hardwareInfo.memory.total) }}</span>
              </n-progress>
            </div>

            <!-- 磁盘信息 -->
            <div class="info-section" v-if="hardwareInfo.disk && hardwareInfo.disk.length">
              <div class="section-header">
                <n-icon><LibraryOutline /></n-icon>
                <span>存储</span>
              </div>
              <div class="disk-list">
                <div class="disk-item" v-for="(disk, index) in hardwareInfo.disk" :key="index">
                  <div class="disk-header">
                    <span class="disk-name">{{ disk.mountPoint || disk.device }}</span>
                    <span class="disk-usage">{{ disk.usage }}</span>
                  </div>
                  <n-progress
                    type="line"
                    :percentage="parseFloat(disk.usage)"
                    :color="getProgressColor(parseFloat(disk.usage))"
                  />
                  <div class="disk-detail">
                    <span>已用: {{ formatBytes(disk.used) }}</span>
                    <span>可用: {{ formatBytes(disk.available) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <n-empty v-else description="暂无硬件信息" />
        </n-spin>
      </n-card>

      <!-- 网络信息 -->
      <n-card title="网络流量" class="network-card">
        <template #header-extra>
          <n-button text type="primary" @click="fetchHardwareInfo" :loading="loadingHardware">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            刷新
          </n-button>
        </template>
        <n-spin :show="loadingHardware">
          <div class="network-list" v-if="hardwareInfo?.network?.length">
            <div class="network-item" v-for="(net, index) in hardwareInfo.network" :key="index">
              <div class="network-header">
                <n-icon><WifiOutline /></n-icon>
                <span class="network-name">{{ net.name }}</span>
              </div>
              <div class="network-stats">
                <div class="stat-item">
                  <n-icon color="#18a058"><ArrowDownOutline /></n-icon>
                  <span>下载: {{ net.downloadSpeed }}</span>
                </div>
                <div class="stat-item">
                  <n-icon color="#f0a020"><ArrowUpOutline /></n-icon>
                  <span>上传: {{ net.uploadSpeed }}</span>
                </div>
              </div>
            </div>
          </div>
          <n-empty v-else description="暂无网络信息" />
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { hardwareService } from '@/api/services/hardware'
import { useAuthStore } from '@/stores/auth'
import type { HardwareInfoDTO } from '@/types'
import {
  RefreshOutline,
  HardwareChipOutline,
  BarChartOutline,
  LibraryOutline,
  WifiOutline,
  ArrowDownOutline,
  ArrowUpOutline,
  FolderOutline,
  PeopleOutline,
  CloudOutline,
  SettingsOutline,
} from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

// 状态
const hardwareInfo = ref<HardwareInfoDTO | null>(null)
const loadingHardware = ref(false)
const systemStatus = ref('online')

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
    value: hardwareInfo.value?.cpu?.usage ? `${hardwareInfo.value.cpu.usage}%` : '-',
    icon: HardwareChipOutline,
    color: '#2080f0',
  },
  {
    key: 'memory',
    label: '内存使用率',
    value: hardwareInfo.value?.memory ? getMemoryUsage() + '%' : '-',
    icon: BarChartOutline,
    color: '#f0a020',
  },
  {
    key: 'disk',
    label: '磁盘使用率',
    value: hardwareInfo.value?.disk?.[0]?.usage || '-',
    icon: LibraryOutline,
    color: '#18a058',
  },
])

/**
 * 获取硬件信息
 */
async function fetchHardwareInfo() {
  loadingHardware.value = true
  try {
    hardwareInfo.value = await hardwareService.getHardwareInfo()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '获取硬件信息失败')
  } finally {
    loadingHardware.value = false
  }
}

/**
 * 计算内存使用率
 */
function getMemoryUsage(): number {
  if (!hardwareInfo.value?.memory) return 0
  const { used, total } = hardwareInfo.value.memory
  return Math.round((used / total) * 100)
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
 * 获取进度条颜色
 */
function getProgressColor(percentage: number): string {
  if (percentage < 50) return '#18a058'
  if (percentage < 80) return '#f0a020'
  return '#d03050'
}

// 生命周期
onMounted(() => {
  fetchHardwareInfo()
})
</script>

<script lang="ts">
// 额外导入
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

/* 内容网格 */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

/* 硬件信息 */
.hardware-card,
.network-card {
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

.progress-text {
  color: #fff;
  font-weight: 500;
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

/* 磁盘列表 */
.disk-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.disk-item {
  padding: 12px;
  background: var(--bg-color-secondary);
  border-radius: 8px;
}

.disk-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.disk-name {
  font-weight: 500;
  color: var(--text-color-base);
}

.disk-usage {
  font-weight: 500;
  color: var(--text-color-base);
}

.disk-detail {
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
