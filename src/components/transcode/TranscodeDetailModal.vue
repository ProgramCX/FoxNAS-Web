<template>
  <n-modal
    :show="show"
    preset="card"
    :title="t('transcode.taskDetail')"
    :style="{ width: '90vw', maxWidth: '700px' }"
    @update:show="$emit('update:show', $event)"
  >
    <template v-if="job">
      <!-- Basic Info -->
      <n-card size="small" :title="t('transcode.basicInfo')" style="margin-bottom: 12px">
        <n-descriptions :column="isMobile ? 1 : 2" label-placement="left" bordered size="small">
          <n-descriptions-item :label="t('transcode.jobId')">
            <n-ellipsis :line-clamp="1" :tooltip="true" style="max-width: 240px">
              {{ job.jobId }}
            </n-ellipsis>
          </n-descriptions-item>
          <n-descriptions-item :label="t('transcode.status')">
            <TranscodeStatusTag :status="job.status" />
          </n-descriptions-item>
          <n-descriptions-item :label="t('transcode.videoPath')" :span="isMobile ? 1 : 2">
            <n-ellipsis :line-clamp="2" :tooltip="true">
              {{ job.videoPath }}
            </n-ellipsis>
          </n-descriptions-item>
          <n-descriptions-item :label="t('transcode.createdAt')">
            {{ formatTime(job.createdAt) }}
          </n-descriptions-item>
          <n-descriptions-item :label="t('transcode.updatedAt')">
            {{ formatTime(job.updatedAt) }}
          </n-descriptions-item>
          <n-descriptions-item v-if="job.completedAt" :label="t('transcode.completedAt')">
            {{ formatTime(job.completedAt) }}
          </n-descriptions-item>
          <n-descriptions-item v-if="job.retryCount" :label="t('transcode.retryCount')">
            {{ job.retryCount }}
          </n-descriptions-item>
        </n-descriptions>
      </n-card>

      <!-- Progress Info -->
      <n-card size="small" :title="t('transcode.progressInfo')" style="margin-bottom: 12px">
        <n-space vertical :size="12">
          <div>
            <span style="margin-right: 8px">{{ t('transcode.progress') }}:</span>
            <n-progress
              type="line"
              :percentage="job.progress ?? 0"
              :status="progressStatus"
              :indicator-placement="'inside'"
              :processing="job.status === 'PROCESSING'"
            />
          </div>
          <div v-if="job.totalStages && job.totalStages > 0">
            <span>{{ t('transcode.stage') }}: </span>
            <n-tag size="small" type="info">
              {{ t('transcode.stageProgress', { current: job.currentStage ?? 0, total: job.totalStages }) }}
            </n-tag>
          </div>
        </n-space>
      </n-card>

      <!-- File Info -->
      <n-card size="small" :title="t('transcode.fileInfo')">
        <n-descriptions :column="1" label-placement="left" bordered size="small">
          <n-descriptions-item v-if="job.outputPath" :label="t('transcode.outputPath')">
            <n-ellipsis :line-clamp="2" :tooltip="true">{{ job.outputPath }}</n-ellipsis>
          </n-descriptions-item>
          <n-descriptions-item v-if="job.hlsPath" :label="t('transcode.hlsPath')">
            <n-ellipsis :line-clamp="2" :tooltip="true">{{ job.hlsPath }}</n-ellipsis>
          </n-descriptions-item>
          <n-descriptions-item v-if="job.errorMessage" :label="t('transcode.errorMessage')">
            <n-alert type="error" :show-icon="false" style="word-break: break-word">
              {{ job.errorMessage }}
            </n-alert>
          </n-descriptions-item>
        </n-descriptions>
      </n-card>
    </template>

    <n-empty v-else :description="t('transcode.noTasks')" />
  </n-modal>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TranscodeJob } from '@/types'
import TranscodeStatusTag from './TranscodeStatusTag.vue'

const props = defineProps<{
  show: boolean
  job: TranscodeJob | null
}>()

defineEmits<{
  (e: 'update:show', val: boolean): void
}>()

const { t } = useI18n()
const isMobile = ref(window.innerWidth <= 768)

function handleResize() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

const progressStatus = computed(() => {
  if (!props.job) return 'default'
  const s = props.job.status
  if (s === 'COMPLETED') return 'success'
  if (s === 'FAILED') return 'error'
  if (s === 'PROCESSING') return 'info'
  return 'default'
})

function formatTime(time?: string): string {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString()
  } catch {
    return time
  }
}
</script>
