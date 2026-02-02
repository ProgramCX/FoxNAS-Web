<template>
  <div class="download-progress-list">
    <div v-for="task in downloadStore.activeTasks" :key="task.id" class="download-item">
      <div class="file-name">{{ task.fileName }}</div>
      <div class="progress-rail">
        <div
          class="progress-fill"
          :style="{ width: `${getPercent(task)}%` }"
        ></div>
      </div>
      <div class="progress-info">
        <span>{{ formatSize(task.loaded) }} / {{ formatSize(task.total) }}</span>
        <span>{{ task.progress }}%</span>
      </div>
    </div>
    <div v-if="downloadStore.activeTasks.length === 0" class="no-downloads">
      没有正在下载的文件
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDownloadProgressStore, type DownloadTask } from '@/stores/downloadProgress'

const downloadStore = useDownloadProgressStore()

function getPercent(task: DownloadTask): number {
  if (task.total > 0) {
    return Math.min(100, Math.round((task.loaded / task.total) * 100))
  }
  const value = Number(task.progress)
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.download-progress-list {
  max-height: 400px;
  overflow-y: auto;
  min-width: 300px;
}

.download-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.download-item:last-child {
  margin-bottom: 0;
}

.file-name {
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
  word-break: break-all;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

.progress-rail {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e5e5e5;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  width: 0%;
  border-radius: 4px;
  background: linear-gradient(90deg, #18a058, #36ad6a);
  transition: width 0.2s ease;
}

.no-downloads {
  text-align: center;
  color: #999;
  padding: 20px;
}
</style>
