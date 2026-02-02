import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'

export interface DownloadTask {
  id: string
  fileName: string
  progress: number
  loaded: number
  total: number
}

export const useDownloadProgressStore = defineStore('downloadProgress', () => {
  // 使用 reactive 对象来存储任务，确保响应式
  const tasks = reactive<Record<string, DownloadTask>>({})

  const activeTasks = computed(() => Object.values(tasks))
  const hasActiveTasks = computed(() => Object.keys(tasks).length > 0)

  function addTask(id: string, fileName: string) {
    tasks[id] = {
      id,
      fileName,
      progress: 0,
      loaded: 0,
      total: 0,
    }
  }

  function updateProgress(id: string, loaded: number, total: number) {
    if (tasks[id]) {
      tasks[id].loaded = loaded
      tasks[id].total = total
      tasks[id].progress = total > 0 ? Math.round((loaded / total) * 100) : 0
    }
  }

  function removeTask(id: string) {
    delete tasks[id]
  }

  function getTask(id: string): DownloadTask | undefined {
    return tasks[id]
  }

  return {
    tasks,
    activeTasks,
    hasActiveTasks,
    addTask,
    updateProgress,
    removeTask,
    getTask,
  }
})
