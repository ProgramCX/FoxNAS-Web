<template>
  <div class="statistics-cards">
    <n-grid :x-gap="16" :y-gap="16" :cols="responsiveCols">
      <n-gi>
        <n-card size="small" class="stat-card stat-total">
          <div class="stat-content">
            <div class="stat-icon">
              <n-icon :size="28"><LayersOutline /></n-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">{{ t('transcode.totalTasks') }}</span>
            </div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" class="stat-card stat-pending">
          <div class="stat-content">
            <div class="stat-icon">
              <n-icon :size="28"><TimeOutline /></n-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.pending }}</span>
              <span class="stat-label">{{ t('transcode.pendingTasks') }}</span>
            </div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" class="stat-card stat-processing">
          <div class="stat-content">
            <div class="stat-icon">
              <n-icon :size="28"><SyncOutline /></n-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.processing }}</span>
              <span class="stat-label">{{ t('transcode.processingTasks') }}</span>
            </div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" class="stat-card stat-completed">
          <div class="stat-content">
            <div class="stat-icon">
              <n-icon :size="28"><CheckmarkCircleOutline /></n-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.completed }}</span>
              <span class="stat-label">{{ t('transcode.completedTasks') }}</span>
            </div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" class="stat-card stat-failed">
          <div class="stat-content">
            <div class="stat-icon">
              <n-icon :size="28"><CloseCircleOutline /></n-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.failed }}</span>
              <span class="stat-label">{{ t('transcode.failedTasks') }}</span>
            </div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" class="stat-card stat-cancelled">
          <div class="stat-content">
            <div class="stat-icon">
              <n-icon :size="28"><BanOutline /></n-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.cancelled }}</span>
              <span class="stat-label">{{ t('transcode.cancelledTasks') }}</span>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  LayersOutline,
  TimeOutline,
  SyncOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  BanOutline,
} from '@vicons/ionicons5'
import type { TranscodeStatistics } from '@/types'

const props = defineProps<{
  stats: TranscodeStatistics
}>()

const { t } = useI18n()

const windowWidth = ref(window.innerWidth)

const responsiveCols = computed(() => {
  if (windowWidth.value <= 480) return 2
  if (windowWidth.value <= 768) return 3
  return 6
})

function handleResize() {
  windowWidth.value = window.innerWidth
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<style scoped>
.statistics-cards {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--text-color-tertiary);
  white-space: nowrap;
}

.stat-total .stat-icon { background: rgba(64, 128, 255, 0.12); color: #4080ff; }
.stat-pending .stat-icon { background: rgba(250, 173, 20, 0.12); color: #faad14; }
.stat-processing .stat-icon { background: rgba(24, 144, 255, 0.12); color: #1890ff; }
.stat-completed .stat-icon { background: rgba(24, 160, 88, 0.12); color: #18a058; }
.stat-failed .stat-icon { background: rgba(208, 48, 80, 0.12); color: #d03050; }
.stat-cancelled .stat-icon { background: rgba(128, 128, 128, 0.12); color: #808080; }

@media screen and (max-width: 480px) {
  .stat-value {
    font-size: 20px;
  }
  .stat-label {
    font-size: 11px;
  }
  .stat-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
