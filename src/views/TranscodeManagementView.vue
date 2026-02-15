<template>
  <div class="transcode-management-container">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">{{ t('transcode.title') }}</h1>
      <p class="page-subtitle">{{ t('transcode.subtitle') }}</p>
    </div>

    <!-- Statistics -->
    <TranscodeStatistics :stats="statistics" />

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <TranscodeFilter v-model="statusFilter" :stats="statistics" />
      </div>
      <div class="toolbar-right">
        <n-space :size="8">
          <n-button type="primary" @click="showCreateModal = true">
            <template #icon><n-icon><AddOutline /></n-icon></template>
            {{ t('transcode.createTask') }}
          </n-button>
          <n-button @click="fetchData">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            {{ t('transcode.refreshList') }}
          </n-button>
          <n-popconfirm
            :positive-text="t('common.confirm')"
            :negative-text="t('common.cancel')"
            @positive-click="handleDeleteAll"
          >
            <template #trigger>
              <n-button type="error" :disabled="statistics.total === 0">
                <template #icon><n-icon><TrashOutline /></n-icon></template>
                {{ t('transcode.deleteAllTasks') }}
              </n-button>
            </template>
            {{ t('transcode.confirmDeleteAll') }}
          </n-popconfirm>
        </n-space>
      </div>
    </div>

    <!-- Task List -->
    <TranscodeTaskList
      :jobs="jobs"
      :loading="loading"
      :pagination="pagination"
      :status-filter="statusFilter"
      @view-detail="handleViewDetail"
      @stop="handleStop"
      @retry="handleRetry"
      @delete="handleDelete"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />

    <!-- Create Modal -->
    <TranscodeCreateModal
      v-model:show="showCreateModal"
      :loading="createLoading"
      @submit="handleCreateJob"
    />

    <!-- Detail Modal -->
    <TranscodeDetailModal
      v-model:show="showDetailModal"
      :job="selectedJob"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, useDialog } from 'naive-ui'
import {
  AddOutline,
  RefreshOutline,
  TrashOutline,
} from '@vicons/ionicons5'
import { transcodeJobService } from '@/api/services/transcode'
import type {
  TranscodeJob,
  TranscodeJobStatus,
  TranscodeJobProgress,
  TranscodeStatistics,
  CreateTranscodeJobRequest,
} from '@/types'
import TranscodeStatistics_ from '@/components/transcode/TranscodeStatistics.vue'
import TranscodeFilter from '@/components/transcode/TranscodeFilter.vue'
import TranscodeTaskList from '@/components/transcode/TranscodeTaskList.vue'
import TranscodeCreateModal from '@/components/transcode/TranscodeCreateModal.vue'
import TranscodeDetailModal from '@/components/transcode/TranscodeDetailModal.vue'

// Workaround: component name clashes with type name
const TranscodeStatistics = TranscodeStatistics_

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

// State
const loading = ref(false)
const createLoading = ref(false)
const jobs = ref<TranscodeJob[]>([])
const statistics = ref<TranscodeStatistics>({
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  cancelled: 0,
})
const statusFilter = ref('ALL')
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const selectedJob = ref<TranscodeJob | null>(null)

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  pageCount: 1,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

// Auto-refresh timer
let refreshTimer: ReturnType<typeof setInterval> | null = null
let progressPollTimer: ReturnType<typeof setInterval> | null = null
let pollingInProgress = false

const ACTIVE_STATUSES: TranscodeJobStatus[] = ['PENDING', 'PROCESSING']

function isActiveStatus(status?: string): boolean {
  return ACTIVE_STATUSES.includes((status || '').toUpperCase() as TranscodeJobStatus)
}

// ==================== Data Fetching ====================

async function fetchData() {
  await Promise.all([fetchJobs(), fetchStatistics()])
}

async function fetchJobs() {
  loading.value = true
  try {
    const res = await transcodeJobService.listJobs(currentPage.value, pageSize.value)
    if (res.code === 200 && res.data) {
      jobs.value = res.data.records || []
      totalItems.value = res.data.total
      pagination.page = res.data.current
      pagination.pageSize = res.data.size
      pagination.pageCount = res.data.pages
      pagination.itemCount = res.data.total
    }
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('transcode.fetchFailed'))
  } finally {
    loading.value = false
  }
}

async function fetchStatistics() {
  try {
    const res = await transcodeJobService.getStatistics()
    if (res.code === 200 && res.data) {
      statistics.value = {
        total: (res.data as any).total ?? 0,
        pending: (res.data as any).pending ?? (res.data as any).PENDING ?? 0,
        processing: (res.data as any).processing ?? (res.data as any).PROCESSING ?? 0,
        completed: (res.data as any).completed ?? (res.data as any).COMPLETED ?? 0,
        failed: (res.data as any).failed ?? (res.data as any).FAILED ?? 0,
        cancelled: (res.data as any).cancelled ?? (res.data as any).CANCELLED ?? 0,
      }
    }
  } catch {
    // Silent fail for statistics
  }
}

/**
 * 轮询进行中的任务进度，并实时更新进度条
 * 对应后端接口：GET /api/transcode/jobs/{jobId}/progress
 */
async function pollActiveJobProgress() {
  if (pollingInProgress) return

  const activeJobs = jobs.value.filter((job) => isActiveStatus(job.status))
  if (activeJobs.length === 0) return

  pollingInProgress = true
  let hasTerminalStateChange = false

  try {
    const results = await Promise.all(
      activeJobs.map(async (job) => {
        try {
          const res = await transcodeJobService.getJobProgress(job.jobId)
          return { jobId: job.jobId, res }
        } catch {
          return null
        }
      })
    )

    for (const item of results) {
      if (!item?.res || item.res.code !== 200 || !item.res.data) continue

      const progressData = item.res.data as TranscodeJobProgress
      const targetJob = jobs.value.find((job) => job.jobId === item.jobId)
      if (!targetJob) continue

      const parsedProgress = Number.parseFloat(progressData.progress)
      if (!Number.isNaN(parsedProgress)) {
        targetJob.progress = parsedProgress
      }

      const parsedCurrentStage = Number.parseInt(progressData.currentStage ?? '', 10)
      if (!Number.isNaN(parsedCurrentStage)) {
        targetJob.currentStage = parsedCurrentStage
      }

      const parsedTotalStages = Number.parseInt(progressData.totalStages ?? '', 10)
      if (!Number.isNaN(parsedTotalStages)) {
        targetJob.totalStages = parsedTotalStages
      }

      const latestStatus = (progressData.state || '').toUpperCase() as TranscodeJobStatus
      if (latestStatus && latestStatus !== targetJob.status) {
        targetJob.status = latestStatus
        if (!isActiveStatus(latestStatus)) {
          hasTerminalStateChange = true
        }
      }

      if (selectedJob.value?.jobId === targetJob.jobId) {
        selectedJob.value = { ...targetJob }
      }
    }

    // 有任务从进行中切换到终态时，刷新列表和统计，保证数据一致
    if (hasTerminalStateChange) {
      await fetchData()
    }
  } finally {
    pollingInProgress = false
  }
}

// ==================== Actions ====================

async function handleCreateJob(data: CreateTranscodeJobRequest) {
  createLoading.value = true
  try {
    const res = await transcodeJobService.createJob(data)
    if (res.code === 200) {
      message.success(res.message || t('transcode.createSuccess'))
      showCreateModal.value = false
      await fetchData()
    } else {
      message.error(res.message || t('transcode.createFailed'))
    }
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('transcode.createFailed'))
  } finally {
    createLoading.value = false
  }
}

function handleViewDetail(job: TranscodeJob) {
  selectedJob.value = job
  showDetailModal.value = true
}

function handleStop(job: TranscodeJob) {
  dialog.warning({
    title: t('common.warning'),
    content: t('transcode.confirmStop'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        const res = await transcodeJobService.stopJob(job.jobId)
        if (res.code === 200) {
          message.success(res.message || t('transcode.stopSuccess'))
          await fetchData()
        } else {
          message.error(res.message || t('transcode.stopFailed'))
        }
      } catch (error: unknown) {
        const err = error as Error
        message.error(err.message || t('transcode.stopFailed'))
      }
    },
  })
}

function handleRetry(job: TranscodeJob) {
  dialog.info({
    title: t('common.info'),
    content: t('transcode.confirmRetry'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        const res = await transcodeJobService.retryJob(job.jobId)
        if (res.code === 200) {
          message.success(res.message || t('transcode.retrySuccess'))
          await fetchData()
        } else {
          message.error(res.message || t('transcode.retryFailed'))
        }
      } catch (error: unknown) {
        const err = error as Error
        message.error(err.message || t('transcode.retryFailed'))
      }
    },
  })
}

function handleDelete(job: TranscodeJob) {
  dialog.error({
    title: t('common.warning'),
    content: t('transcode.confirmDelete'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        const res = await transcodeJobService.deleteJob(job.jobId)
        if (res.code === 200) {
          message.success(res.message || t('transcode.deleteSuccess'))
          await fetchData()
        } else {
          message.error(res.message || t('transcode.deleteFailed'))
        }
      } catch (error: unknown) {
        const err = error as Error
        message.error(err.message || t('transcode.deleteFailed'))
      }
    },
  })
}

async function handleDeleteAll() {
  try {
    const res = await transcodeJobService.deleteAllJobs()
    if (res.code === 200) {
      message.success(res.message || t('transcode.deleteAllSuccess'))
      await fetchData()
    } else {
      message.error(res.message || t('transcode.deleteAllFailed'))
    }
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('transcode.deleteAllFailed'))
  }
}

// ==================== Pagination ====================

function handlePageChange(page: number) {
  currentPage.value = page
  fetchJobs()
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  fetchJobs()
}

// ==================== Lifecycle ====================

function startAutoRefresh() {
  stopAutoRefresh()
  // Auto-refresh every 10 seconds when there are active tasks
  refreshTimer = setInterval(() => {
    if (statistics.value.processing > 0 || statistics.value.pending > 0) {
      fetchData()
    }
  }, 10000)
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function startProgressPolling() {
  stopProgressPolling()
  // 更高频率的进度轮询，保证进度条实时更新
  progressPollTimer = setInterval(() => {
    pollActiveJobProgress()
  }, 2000)
}

function stopProgressPolling() {
  if (progressPollTimer) {
    clearInterval(progressPollTimer)
    progressPollTimer = null
  }
}

onMounted(() => {
  fetchData()
  startAutoRefresh()
  startProgressPolling()
})

onUnmounted(() => {
  stopAutoRefresh()
  stopProgressPolling()
})
</script>

<style scoped>
.transcode-management-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--text-color-base);
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-color-tertiary);
  margin: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar-left {
  flex: 1;
  min-width: 0;
}

.toolbar-right {
  flex-shrink: 0;
}

@media screen and (max-width: 768px) {
  .page-title {
    font-size: 20px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .toolbar {
    flex-direction: column;
  }

  .toolbar-right {
    width: 100%;
  }

  .toolbar-right :deep(.n-space) {
    width: 100%;
    flex-wrap: wrap;
  }

  .toolbar-right :deep(.n-button) {
    flex: 1;
    min-width: 0;
  }
}

@media screen and (max-width: 480px) {
  .page-title {
    font-size: 18px;
  }
}
</style>
