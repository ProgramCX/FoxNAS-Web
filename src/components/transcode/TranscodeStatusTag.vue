<template>
  <n-tag :type="tagType" :bordered="false" size="small" round>
    <template #icon>
      <n-icon :component="statusIcon" />
    </template>
    {{ statusLabel }}
  </n-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  TimeOutline,
  SyncOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  BanOutline,
  HelpCircleOutline,
} from '@vicons/ionicons5'
import type { TranscodeJobStatus } from '@/types'

const props = defineProps<{
  status: TranscodeJobStatus | string
}>()

const { t } = useI18n()

const normalizedStatus = computed(() => (props.status || '').toUpperCase())

const tagType = computed(() => {
  const map: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    PENDING: 'warning',
    PROCESSING: 'info',
    COMPLETED: 'success',
    FAILED: 'error',
    CANCELLED: 'default',
  }
  return map[normalizedStatus.value] || 'default'
})

const statusIcon = computed(() => {
  const map: Record<string, any> = {
    PENDING: TimeOutline,
    PROCESSING: SyncOutline,
    COMPLETED: CheckmarkCircleOutline,
    FAILED: CloseCircleOutline,
    CANCELLED: BanOutline,
  }
  return map[normalizedStatus.value] || HelpCircleOutline
})

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    PENDING: t('transcode.statusPending'),
    PROCESSING: t('transcode.statusProcessing'),
    COMPLETED: t('transcode.statusCompleted'),
    FAILED: t('transcode.statusFailed'),
    CANCELLED: t('transcode.statusCancelled'),
  }
  return map[normalizedStatus.value] || props.status
})
</script>
