import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'

export type TaskType = 'download' | 'upload'
export type TaskStatus = 'pending' | 'running' | 'paused' | 'completed' | 'cancelled' | 'error'

export interface TransferTask {
  id: string
  type: TaskType
  fileName: string
  progress: number
  loaded: number
  total: number
  speed: number // bytes per second
  status: TaskStatus
  abortController?: AbortController
  startTime: number
  lastUpdateTime: number
  lastLoaded: number
  error?: string
}

// 自动清除完成任务的延迟时间（毫秒）
const AUTO_CLEAR_DELAY = 5000

export const useDownloadProgressStore = defineStore('downloadProgress', () => {
  // 使用 reactive 对象来存储任务，确保响应式
  const tasks = reactive<Record<string, TransferTask>>({})
  
  // 存储自动清除的定时器
  const autoClearTimers = new Map<string, number>()

  const activeTasks = computed(() => Object.values(tasks))
  
  // 是否还有待处理或正在运行的任务
  const hasActiveTasks = computed(() => {
    return Object.values(tasks).some(
      task => task.status === 'pending' || task.status === 'running'
    )
  })
  
  // 待处理或正在运行的任务数量
  const pendingTaskCount = computed(() => {
    return Object.values(tasks).filter(
      task => task.status === 'pending' || task.status === 'running'
    ).length
  })
  
  // 下载任务列表
  const downloadTasks = computed(() => {
    return Object.values(tasks).filter(task => task.type === 'download')
  })
  
  // 上传任务列表
  const uploadTasks = computed(() => {
    return Object.values(tasks).filter(task => task.type === 'upload')
  })
  
  /**
   * 设置自动清除定时器
   */
  function setAutoClearTimer(taskId: string) {
    // 清除已有的定时器
    const existingTimer = autoClearTimers.get(taskId)
    if (existingTimer) {
      window.clearTimeout(existingTimer)
    }
    
    // 设置新的定时器
    const timer = window.setTimeout(() => {
      delete tasks[taskId]
      autoClearTimers.delete(taskId)
    }, AUTO_CLEAR_DELAY)
    
    autoClearTimers.set(taskId, timer)
  }
  
  /**
   * 取消自动清除定时器
   */
  function cancelAutoClearTimer(taskId: string) {
    const timer = autoClearTimers.get(taskId)
    if (timer) {
      window.clearTimeout(timer)
      autoClearTimers.delete(taskId)
    }
  }

  /**
   * 添加任务
   */
  function addTask(
    id: string, 
    fileName: string, 
    type: TaskType = 'download',
    abortController?: AbortController
  ): TransferTask {
    const now = Date.now()
    tasks[id] = {
      id,
      type,
      fileName,
      progress: 0,
      loaded: 0,
      total: 0,
      speed: 0,
      status: 'pending',
      abortController,
      startTime: now,
      lastUpdateTime: now,
      lastLoaded: 0,
    }
    return tasks[id]
  }

  /**
   * 更新进度并计算速率
   */
  function updateProgress(id: string, loaded: number, total: number) {
    const task = tasks[id]
    if (!task) return

    const now = Date.now()
    const timeDiff = now - task.lastUpdateTime
    
    // 计算速率 (每 500ms 更新一次速率，避免跳动)
    if (timeDiff >= 500) {
      const loadedDiff = loaded - task.lastLoaded
      task.speed = Math.round((loadedDiff * 1000) / timeDiff) // bytes per second
      task.lastUpdateTime = now
      task.lastLoaded = loaded
    }
    
    task.loaded = loaded
    task.total = total
    task.progress = total > 0 ? Math.round((loaded / total) * 100) : 0
    
    if (task.status === 'pending') {
      task.status = 'running'
    }
  }

  /**
   * 取消任务
   */
  function cancelTask(id: string) {
    const task = tasks[id]
    if (!task) return

    if (task.abortController) {
      task.abortController.abort()
    }
    task.status = 'cancelled'
    task.speed = 0
    
    // 自动清除
    setAutoClearTimer(id)
  }

  /**
   * 标记任务完成
   */
  function completeTask(id: string) {
    const task = tasks[id]
    if (!task) return

    task.status = 'completed'
    task.progress = 100
    task.speed = 0
    
    // 自动清除
    setAutoClearTimer(id)
  }

  /**
   * 标记任务失败
   */
  function failTask(id: string, error?: string) {
    const task = tasks[id]
    if (!task) return

    task.status = 'error'
    task.speed = 0
    if (error) {
      task.error = error
    }
    
    // 自动清除
    setAutoClearTimer(id)
  }

  /**
   * 移除任务
   */
  function removeTask(id: string) {
    // 取消自动清除定时器
    cancelAutoClearTimer(id)
    
    // 如果任务还在运行，先取消
    const task = tasks[id]
    if (task && (task.status === 'pending' || task.status === 'running')) {
      cancelTask(id)
    }
    delete tasks[id]
  }

  /**
   * 获取任务
   */
  function getTask(id: string): TransferTask | undefined {
    return tasks[id]
  }

  /**
   * 取消所有任务
   */
  function cancelAllTasks() {
    Object.values(tasks).forEach(task => {
      if (task.status === 'pending' || task.status === 'running') {
        cancelTask(task.id)
      }
    })
  }

  /**
   * 清除已完成的任务
   */
  function clearCompletedTasks() {
    Object.keys(tasks).forEach(id => {
      const task = tasks[id]
      if (task.status === 'completed' || task.status === 'cancelled' || task.status === 'error') {
        cancelAutoClearTimer(id)
        delete tasks[id]
      }
    })
  }

  return {
    tasks,
    activeTasks,
    hasActiveTasks,
    pendingTaskCount,
    downloadTasks,
    uploadTasks,
    addTask,
    updateProgress,
    cancelTask,
    completeTask,
    failTask,
    removeTask,
    getTask,
    cancelAllTasks,
    clearCompletedTasks,
  }
})

/**
 * 格式化速率
 */
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s'
  const k = 1024
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化大小
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化剩余时间
 */
export function formatRemainingTime(loaded: number, total: number, speed: number): string {
  if (speed <= 0 || total <= 0 || loaded >= total) return ''
  const remainingBytes = total - loaded
  const remainingSeconds = Math.ceil(remainingBytes / speed)
  
  if (remainingSeconds < 60) {
    return `${remainingSeconds}s`
  } else if (remainingSeconds < 3600) {
    return `${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s`
  } else {
    const hours = Math.floor(remainingSeconds / 3600)
    const minutes = Math.floor((remainingSeconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}
