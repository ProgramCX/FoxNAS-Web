import { type Ref } from 'vue'
import type { Router } from 'vue-router'

export interface ProgressBarRef {
  start: () => void
  setProgress: (value: number) => void
  finish: () => void
}

export function useRouterProgress(router: Router, progressRef: Ref<ProgressBarRef | null>) {
  let loadingCount = 0

  function startLoading() {
    loadingCount++
    if (loadingCount === 1) {
      progressRef.value?.start()
    }
  }

  function stopLoading() {
    loadingCount = Math.max(0, loadingCount - 1)
    if (loadingCount === 0) {
      progressRef.value?.finish()
    }
  }

  router.beforeEach((_to, _from, next) => {
    startLoading()
    next()
  })

  router.afterEach(() => {
    setTimeout(stopLoading, 100)
  })

  router.onError(() => {
    stopLoading()
  })

  return {
    startLoading,
    stopLoading,
  }
}

import type { ComponentInternalInstance } from 'vue'

let progressBarInstance: ComponentInternalInstance | null = null

export function setGlobalProgressBar(instance: ComponentInternalInstance) {
  progressBarInstance = instance
}

export function getGlobalProgressBar(): ComponentInternalInstance | null {
  return progressBarInstance
}
