<template>
  <div class="task-filter">
    <n-space :wrap="true" :size="[12, 8]" align="center">
      <n-button
        v-for="filter in filterOptions"
        :key="filter.value"
        :type="currentFilter === filter.value ? 'primary' : 'default'"
        :secondary="currentFilter !== filter.value"
        size="small"
        @click="$emit('update:modelValue', filter.value)"
      >
        {{ filter.label }}
        <template v-if="filter.count !== undefined" #icon>
          <n-badge :value="filter.count" :max="99" :type="getBadgeType(filter.value)" processing />
        </template>
      </n-button>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TranscodeStatistics } from '@/types'

const props = defineProps<{
  modelValue: string
  stats: TranscodeStatistics
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { t } = useI18n()

const currentFilter = computed(() => props.modelValue)

const filterOptions = computed(() => [
  { label: t('transcode.filterAll'), value: 'ALL', count: props.stats.total },
  { label: t('transcode.statusPending'), value: 'PENDING', count: props.stats.pending },
  { label: t('transcode.statusProcessing'), value: 'PROCESSING', count: props.stats.processing },
  { label: t('transcode.statusCompleted'), value: 'COMPLETED', count: props.stats.completed },
  { label: t('transcode.statusFailed'), value: 'FAILED', count: props.stats.failed },
  { label: t('transcode.statusCancelled'), value: 'CANCELLED', count: props.stats.cancelled },
])

function getBadgeType(status: string): 'default' | 'info' | 'success' | 'warning' | 'error' {
  const map: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    ALL: 'info',
    PENDING: 'warning',
    PROCESSING: 'info',
    COMPLETED: 'success',
    FAILED: 'error',
    CANCELLED: 'default',
  }
  return map[status] || 'default'
}
</script>

<style scoped>
.task-filter {
  margin-bottom: 16px;
}
</style>
