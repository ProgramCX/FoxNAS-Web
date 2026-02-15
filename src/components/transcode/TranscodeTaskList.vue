<template>
  <div class="task-list">
    <!-- Desktop: Data Table -->
    <div class="desktop-table hide-on-mobile">
      <n-data-table
        :columns="columns"
        :data="filteredJobs"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: TranscodeJob) => row.jobId"
        :scroll-x="1450"
        :single-line="false"
        @update:page="(p: number) => $emit('pageChange', p)"
        @update:page-size="(s: number) => $emit('pageSizeChange', s)"
      />
    </div>

    <!-- Mobile: Card List -->
    <div class="mobile-cards hide-on-desktop">
      <n-empty v-if="filteredJobs.length === 0 && !loading" :description="t('transcode.noTasks')" />
      <n-spin :show="loading">
        <div class="card-list">
          <n-card
            v-for="job in filteredJobs"
            :key="job.jobId"
            size="small"
            class="task-card"
            @click="$emit('viewDetail', job)"
          >
            <div class="card-header">
              <TranscodeStatusTag :status="job.status" />
              <n-ellipsis style="max-width: 60%; font-size: 13px; color: var(--text-color-tertiary)">
                {{ extractFileName(job.videoPath) }}
              </n-ellipsis>
            </div>

            <div class="card-progress" v-if="job.status === 'PROCESSING' || job.status === 'PENDING'">
              <div class="progress-label">{{ t('transcode.progress') }}</div>
              <n-progress
                type="line"
                :percentage="job.progress ?? 0"
                :status="job.status === 'PROCESSING' ? 'info' : 'default'"
                :processing="job.status === 'PROCESSING'"
                :indicator-placement="'inside'"
              />
              <template v-if="job.totalStages && job.totalStages > 0">
                <div class="progress-label">{{ t('transcode.stage') }}</div>
                <n-progress
                  type="line"
                  :percentage="getStagePercentage(job)"
                  status="default"
                  :indicator-placement="'inside'"
                />
                <span class="stage-text">
                  {{ t('transcode.stageProgress', { current: job.currentStage ?? 0, total: job.totalStages }) }}
                </span>
              </template>
            </div>

            <div class="card-meta">
              <span>{{ formatTime(job.createdAt) }}</span>
              <span v-if="job.retryCount" class="retry-badge">↻ {{ job.retryCount }}</span>
            </div>

            <div class="card-actions" @click.stop>
              <n-button
                v-if="canStop(job)"
                size="tiny"
                type="warning"
                secondary
                @click="$emit('stop', job)"
              >
                {{ t('transcode.stopTask') }}
              </n-button>
              <n-button
                v-if="canRetry(job)"
                size="tiny"
                type="info"
                secondary
                @click="$emit('retry', job)"
              >
                {{ t('transcode.retryTask') }}
              </n-button>
              <n-button
                size="tiny"
                type="error"
                secondary
                @click="$emit('delete', job)"
              >
                {{ t('transcode.deleteTask') }}
              </n-button>
            </div>
          </n-card>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NSpace, NProgress, NEllipsis, NTooltip, type DataTableColumns } from 'naive-ui'
import type { TranscodeJob } from '@/types'
import TranscodeStatusTag from './TranscodeStatusTag.vue'

const props = defineProps<{
  jobs: TranscodeJob[]
  loading: boolean
  pagination: {
    page: number
    pageSize: number
    pageCount: number
    itemCount: number
    showSizePicker: boolean
    pageSizes: number[]
  }
  statusFilter: string
}>()

const emit = defineEmits<{
  (e: 'viewDetail', job: TranscodeJob): void
  (e: 'stop', job: TranscodeJob): void
  (e: 'retry', job: TranscodeJob): void
  (e: 'delete', job: TranscodeJob): void
  (e: 'pageChange', page: number): void
  (e: 'pageSizeChange', size: number): void
}>()

const { t } = useI18n()

const filteredJobs = computed(() => {
  if (props.statusFilter === 'ALL') return props.jobs
  return props.jobs.filter(
    (j) => j.status.toUpperCase() === props.statusFilter.toUpperCase()
  )
})

function canStop(job: TranscodeJob): boolean {
  const s = job.status.toUpperCase()
  return s === 'PENDING' || s === 'PROCESSING'
}

function canRetry(job: TranscodeJob): boolean {
  const s = job.status.toUpperCase()
  return s === 'FAILED' || s === 'CANCELLED'
}

function extractFileName(path: string): string {
  if (!path) return '-'
  const parts = path.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || path
}

function formatTime(time?: string): string {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString()
  } catch {
    return time
  }
}

function getStagePercentage(job: TranscodeJob): number {
  const total = Number(job.totalStages ?? 0)
  const current = Number(job.currentStage ?? 0)
  if (total <= 0) return 0
  const raw = (current / total) * 100
  return Math.max(0, Math.min(100, Number(raw.toFixed(2))))
}

const columns = computed<DataTableColumns<TranscodeJob>>(() => [
  {
    title: t('transcode.status'),
    key: 'status',
    width: 130,
    render(row) {
      return h(TranscodeStatusTag, { status: row.status })
    },
  },
  {
    title: t('transcode.videoPath'),
    key: 'videoPath',
    minWidth: 200,
    ellipsis: { tooltip: true },
    render(row) {
      return h(NEllipsis, { lineClamp: 1, tooltip: true }, () => extractFileName(row.videoPath))
    },
  },
  {
    title: t('transcode.stage'),
    key: 'stage',
    width: 120,
    render(row) {
      if (!row.totalStages || row.totalStages <= 0) return '-'
      return `${row.currentStage ?? 0}/${row.totalStages}`
    },
  },
  {
    title: t('transcode.progress'),
    key: 'progress',
    width: 260,
    render(row) {
      const status =
        row.status === 'COMPLETED' ? 'success' : row.status === 'FAILED' ? 'error' : 'default'
      return h(NSpace, { vertical: true, size: 6 }, {
        default: () => {
          const bars: ReturnType<typeof h>[] = []
          bars.push(
            h(NTooltip, {}, {
              trigger: () =>
                h(NProgress, {
                  type: 'line',
                  percentage: row.progress ?? 0,
                  status,
                  processing: row.status === 'PROCESSING',
                  indicatorPlacement: 'inside',
                }),
              default: () => `${t('transcode.progress')}: ${(row.progress ?? 0).toFixed(1)}%`,
            })
          )

          if (row.totalStages && row.totalStages > 0) {
            bars.push(
              h(NTooltip, {}, {
                trigger: () =>
                  h(NProgress, {
                    type: 'line',
                    percentage: getStagePercentage(row),
                    status: 'default',
                    indicatorPlacement: 'inside',
                  }),
                default: () =>
                  t('transcode.stageProgress', {
                    current: row.currentStage ?? 0,
                    total: row.totalStages,
                  }),
              })
            )
          }

          return bars
        },
      })
    },
  },
  {
    title: t('transcode.retryCount'),
    key: 'retryCount',
    width: 80,
    align: 'center',
    render(row) {
      return String(row.retryCount ?? 0)
    },
  },
  {
    title: t('transcode.createdAt'),
    key: 'createdAt',
    width: 170,
    render(row) {
      return formatTime(row.createdAt)
    },
  },
  {
    title: t('transcode.actions'),
    key: 'actions',
    width: 240,
    fixed: 'right',
    render(row) {
      const buttons: ReturnType<typeof h>[] = []
      buttons.push(
        h(
          NButton,
          { size: 'small', type: 'info', secondary: true, onClick: () => emit('viewDetail', row) },
          { default: () => t('transcode.viewDetail') }
        )
      )
      if (canStop(row)) {
        buttons.push(
          h(
            NButton,
            { size: 'small', type: 'warning', secondary: true, onClick: () => emit('stop', row) },
            { default: () => t('transcode.stopTask') }
          )
        )
      }
      if (canRetry(row)) {
        buttons.push(
          h(
            NButton,
            { size: 'small', type: 'info', secondary: true, onClick: () => emit('retry', row) },
            { default: () => t('transcode.retryTask') }
          )
        )
      }
      buttons.push(
        h(
          NButton,
          { size: 'small', type: 'error', secondary: true, onClick: () => emit('delete', row) },
          { default: () => t('transcode.deleteTask') }
        )
      )
      return h(NSpace, { size: 4, wrap: true }, () => buttons)
    },
  },
])
</script>

<style scoped>
.hide-on-mobile {
  display: block;
}

.hide-on-desktop {
  display: none;
}

.task-card {
  margin-bottom: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.task-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-progress {
  margin-bottom: 8px;
}

.progress-label {
  font-size: 11px;
  color: var(--text-color-tertiary);
  margin-top: 6px;
  margin-bottom: 2px;
}

.stage-text {
  font-size: 11px;
  color: var(--text-color-tertiary);
  margin-top: 2px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-color-tertiary);
  margin-bottom: 8px;
}

.retry-badge {
  color: var(--warning-color);
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media screen and (max-width: 768px) {
  .hide-on-mobile {
    display: none !important;
  }
  .hide-on-desktop {
    display: block !important;
  }
}

@media screen and (min-width: 769px) {
  .hide-on-desktop {
    display: none !important;
  }
}
</style>
