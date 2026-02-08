<template>
  <div class="transfer-progress-list">
    <!-- 下载任务 -->
    <div v-if="downloadTasks.length > 0" class="task-section">
      <div class="section-title">
        <n-icon size="16"><DownloadOutline /></n-icon>
        <span>{{ t('files.downloadTasks') }} ({{ downloadTasks.length }})</span>
      </div>
      <div v-for="task in downloadTasks" :key="task.id" class="transfer-item">
        <div class="file-info">
          <div class="file-name">
            <n-icon size="14" :class="getStatusIconClass(task.status)">
              <component :is="getStatusIcon(task.status)" />
            </n-icon>
            <span class="name-text" :title="task.fileName">{{ task.fileName }}</span>
          </div>
          <n-button 
            v-if="task.status === 'pending' || task.status === 'running'"
            text 
            size="tiny" 
            type="error"
            @click="cancelTask(task.id)"
          >
            <template #icon><n-icon><CloseCircleOutline /></n-icon></template>
          </n-button>
          <n-button 
            v-else
            text 
            size="tiny"
            @click="removeTask(task.id)"
          >
            <template #icon><n-icon><CloseOutline /></n-icon></template>
          </n-button>
        </div>
        <div class="progress-rail">
          <div
            class="progress-fill"
            :class="getProgressClass(task.status)"
            :style="{ width: `${task.progress}%` }"
          ></div>
        </div>
        <div class="progress-info">
          <span class="size-info">{{ formatSize(task.loaded) }} / {{ formatSize(task.total) }}</span>
          <span v-if="task.status === 'running' && task.speed > 0" class="speed-info">
            {{ formatSpeed(task.speed) }}
            <span class="time-remaining" v-if="getRemainingTime(task)">
              ({{ getRemainingTime(task) }})
            </span>
          </span>
          <span v-else-if="task.status === 'cancelled'" class="status-text cancelled">{{ t('files.cancelled') }}</span>
          <span v-else-if="task.status === 'error'" class="status-text error">{{ t('files.failed') }}</span>
          <span v-else-if="task.status === 'completed'" class="status-text completed">{{ t('files.completed') }}</span>
          <span class="percent">{{ task.progress }}%</span>
        </div>
      </div>
    </div>

    <!-- 上传任务 -->
    <div v-if="uploadTasks.length > 0" class="task-section">
      <div class="section-title">
        <n-icon size="16"><CloudUploadOutline /></n-icon>
        <span>{{ t('files.uploadTasks') }} ({{ uploadTasks.length }})</span>
      </div>
      <div v-for="task in uploadTasks" :key="task.id" class="transfer-item">
        <div class="file-info">
          <div class="file-name">
            <n-icon size="14" :class="getStatusIconClass(task.status)">
              <component :is="getStatusIcon(task.status)" />
            </n-icon>
            <span class="name-text" :title="task.fileName">{{ task.fileName }}</span>
          </div>
          <n-button 
            v-if="task.status === 'pending' || task.status === 'running'"
            text 
            size="tiny" 
            type="error"
            @click="cancelTask(task.id)"
          >
            <template #icon><n-icon><CloseCircleOutline /></n-icon></template>
          </n-button>
          <n-button 
            v-else
            text 
            size="tiny"
            @click="removeTask(task.id)"
          >
            <template #icon><n-icon><CloseOutline /></n-icon></template>
          </n-button>
        </div>
        <div class="progress-rail">
          <div
            class="progress-fill"
            :class="getProgressClass(task.status)"
            :style="{ width: `${task.progress}%` }"
          ></div>
        </div>
        <div class="progress-info">
          <span class="size-info">{{ formatSize(task.loaded) }} / {{ formatSize(task.total) }}</span>
          <span v-if="task.status === 'running' && task.speed > 0" class="speed-info">
            {{ formatSpeed(task.speed) }}
            <span class="time-remaining" v-if="getRemainingTime(task)">
              ({{ getRemainingTime(task) }})
            </span>
          </span>
          <span v-else-if="task.status === 'cancelled'" class="status-text cancelled">{{ t('files.cancelled') }}</span>
          <span v-else-if="task.status === 'error'" class="status-text error">{{ t('files.failed') }}</span>
          <span v-else-if="task.status === 'completed'" class="status-text completed">{{ t('files.completed') }}</span>
          <span class="percent">{{ task.progress }}%</span>
        </div>
      </div>
    </div>

    <div v-if="downloadTasks.length === 0 && uploadTasks.length === 0" class="no-tasks">
      <n-empty :description="t('files.noActiveTasks')" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  DownloadOutline, 
  CloudUploadOutline, 
  CloseCircleOutline, 
  CloseOutline,
  TimeOutline,
  CheckmarkCircleOutline,
  AlertCircleOutline
} from '@vicons/ionicons5'
import { 
  useDownloadProgressStore, 
  type TransferTask, 
  formatSize, 
  formatSpeed,
  formatRemainingTime 
} from '@/stores/downloadProgress'
import type { Component } from 'vue'

const { t } = useI18n()
const downloadStore = useDownloadProgressStore()

const downloadTasks = computed(() => downloadStore.downloadTasks)
const uploadTasks = computed(() => downloadStore.uploadTasks)

function cancelTask(id: string) {
  downloadStore.cancelTask(id)
}

function removeTask(id: string) {
  downloadStore.removeTask(id)
}

function getStatusIcon(status: string): Component {
  switch (status) {
    case 'completed':
      return CheckmarkCircleOutline
    case 'error':
      return AlertCircleOutline
    case 'cancelled':
      return CloseCircleOutline
    default:
      return TimeOutline
  }
}

function getStatusIconClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'icon-success'
    case 'error':
    case 'cancelled':
      return 'icon-error'
    default:
      return 'icon-pending'
  }
}

function getProgressClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'progress-success'
    case 'error':
      return 'progress-error'
    case 'cancelled':
      return 'progress-cancelled'
    default:
      return 'progress-running'
  }
}

function getRemainingTime(task: TransferTask): string {
  return formatRemainingTime(task.loaded, task.total, task.speed)
}
</script>

<style scoped>
.transfer-progress-list {
  max-height: 500px;
  overflow-y: auto;
  min-width: 400px;
}

.task-section {
  margin-bottom: 20px;
}

.task-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-color-base);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--divider-color);
}

.transfer-item {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--card-color);
  border-radius: 8px;
  border: 1px solid var(--divider-color);
}

.transfer-item:last-child {
  margin-bottom: 0;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.name-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: var(--text-color-base);
}

.icon-success {
  color: var(--success-color);
}

.icon-error {
  color: var(--error-color);
}

.icon-pending {
  color: var(--warning-color);
}

.progress-rail {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--divider-color);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.2s ease;
}

.progress-running {
  background: linear-gradient(90deg, var(--primary-color), var(--primary-color-hover));
}

.progress-success {
  background: var(--success-color);
}

.progress-error {
  background: var(--error-color);
}

.progress-cancelled {
  background: var(--text-color-disabled);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
}

.size-info {
  color: var(--text-color-2);
}

.speed-info {
  color: var(--primary-color);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.time-remaining {
  color: var(--text-color-3);
  font-weight: normal;
}

.status-text {
  font-weight: 500;
}

.status-text.completed {
  color: var(--success-color);
}

.status-text.error {
  color: var(--error-color);
}

.status-text.cancelled {
  color: var(--text-color-disabled);
}

.percent {
  color: var(--text-color-2);
  font-weight: 500;
  min-width: 40px;
  text-align: right;
}

.no-tasks {
  padding: 40px 20px;
}
</style>
