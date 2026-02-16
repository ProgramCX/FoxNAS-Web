/**
 * 转码进度 Store
 * 管理文件管理器中发起的转码任务的进度轮询和状态
 */

import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { mediaService } from '@/api/services/media'
import type { TranscodeStatusResponse } from '@/types'

export type TranscodeTaskState = 'checking' | 'selecting' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface TranscodeTask {
  id: string           // jobId
  filePath: string
  fileName: string
  state: TranscodeTaskState
  progress: number     // 0-100
  stages?: number
  currentStage?: number
  hlsPath?: string
  message?: string
  createdAt: number
}

const POLL_INTERVAL = 2000 // 2s

export const useTranscodeProgressStore = defineStore('transcodeProgress', () => {
  const tasks = reactive<Record<string, TranscodeTask>>({})
  const pollingTimers = new Map<string, ReturnType<typeof setInterval>>()

  // 悬浮按钮可见性（有活跃任务时显示）
  const hasActiveTasks = computed(() =>
    Object.values(tasks).some(t => t.state === 'pending' || t.state === 'processing')
  )

  const activeTaskCount = computed(() =>
    Object.values(tasks).filter(t => t.state === 'pending' || t.state === 'processing').length
  )

  const allTasks = computed(() =>
    Object.values(tasks).sort((a, b) => b.createdAt - a.createdAt)
  )

  /**
   * 添加转码任务并开始轮询
   */
  function addTask(jobId: string, filePath: string, fileName: string, initialState: TranscodeTaskState = 'pending') {
    tasks[jobId] = {
      id: jobId,
      filePath,
      fileName,
      state: initialState,
      progress: 0,
      createdAt: Date.now(),
    }
    if (initialState === 'pending' || initialState === 'processing') {
      startPolling(jobId)
    }
  }

  /**
   * 标记任务已完成（接收 hlsPath）
   */
  function markCompleted(jobId: string, hlsPath?: string) {
    const task = tasks[jobId]
    if (!task) return
    task.state = 'completed'
    task.progress = 100
    task.hlsPath = hlsPath
    stopPolling(jobId)
  }

  /**
   * 标记任务失败
   */
  function markFailed(jobId: string, message?: string) {
    const task = tasks[jobId]
    if (!task) return
    task.state = 'failed'
    task.message = message
    stopPolling(jobId)
  }

  /**
   * 移除任务
   */
  function removeTask(jobId: string) {
    stopPolling(jobId)
    delete tasks[jobId]
  }

  /**
   * 更新任务状态（从后端 response）
   */
  function updateFromResponse(jobId: string, resp: TranscodeStatusResponse) {
    const task = tasks[jobId]
    if (!task) return

    task.progress = resp.progress ?? 0
    task.stages = resp.stages
    task.currentStage = resp.currentStage
    task.hlsPath = resp.hlsPath
    task.message = resp.message

    switch (resp.state) {
      case 'COMPLETED':
        task.state = 'completed'
        task.progress = 100
        stopPolling(jobId)
        break
      case 'FAILED':
        task.state = 'failed'
        stopPolling(jobId)
        break
      case 'CANCELLED':
        task.state = 'cancelled'
        stopPolling(jobId)
        break
      case 'PROCESSING':
        task.state = 'processing'
        break
      case 'PENDING':
        task.state = 'pending'
        break
    }
  }

  /**
   * 开始轮询任务状态
   */
  function startPolling(jobId: string) {
    stopPolling(jobId) // 避免重复轮询

    const timer = setInterval(async () => {
      try {
        const res = await mediaService.getTranscodeStatus(jobId)
        updateFromResponse(jobId, res)
      } catch (err) {
        console.error(`[TranscodeProgress] 轮询任务 ${jobId} 失败:`, err)
      }
    }, POLL_INTERVAL)

    pollingTimers.set(jobId, timer)
  }

  /**
   * 停止轮询
   */
  function stopPolling(jobId: string) {
    const timer = pollingTimers.get(jobId)
    if (timer) {
      clearInterval(timer)
      pollingTimers.delete(jobId)
    }
  }

  /**
   * 停止所有轮询
   */
  function stopAllPolling() {
    pollingTimers.forEach((timer) => clearInterval(timer))
    pollingTimers.clear()
  }

  /**
   * 获取指定任务
   */
  function getTask(jobId: string): TranscodeTask | undefined {
    return tasks[jobId]
  }

  /**
   * 清除已结束的任务
   */
  function clearFinished() {
    Object.keys(tasks).forEach(id => {
      const task = tasks[id]
      if (task.state === 'completed' || task.state === 'failed' || task.state === 'cancelled') {
        delete tasks[id]
      }
    })
  }

  return {
    tasks,
    hasActiveTasks,
    activeTaskCount,
    allTasks,
    addTask,
    markCompleted,
    markFailed,
    removeTask,
    updateFromResponse,
    startPolling,
    stopPolling,
    stopAllPolling,
    getTask,
    clearFinished,
  }
})
