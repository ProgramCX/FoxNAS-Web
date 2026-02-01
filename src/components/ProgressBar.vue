<template>
  <Transition name="progress">
    <div v-if="visible" class="progress-bar-container">
      <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const progress = ref(0)
const visible = ref(false)
let progressTimer: ReturnType<typeof setInterval> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

function start() {
  visible.value = true
  progress.value = 0
  
  if (progressTimer) clearInterval(progressTimer)
  
  progressTimer = setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 15
    }
  }, 200)
}

function setProgress(value: number) {
  progress.value = Math.min(100, Math.max(0, value))
}

function finish() {
  progress.value = 100
  
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
  
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    visible.value = false
    progress.value = 0
  }, 300)
}

watch(visible, (newVal) => {
  if (!newVal) {
    progress.value = 0
  }
})

onUnmounted(() => {
  if (progressTimer) clearInterval(progressTimer)
  if (hideTimer) clearTimeout(hideTimer)
})

defineExpose({
  start,
  setProgress,
  finish,
})
</script>

<style scoped>
.progress-bar-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 9999;
  background: rgba(24, 160, 88, 0.1);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #18a058, #36ad6a, #18a058);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  transition: width 0.2s ease;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.progress-enter-active,
.progress-leave-active {
  transition: opacity 0.3s ease;
}

.progress-enter-from,
.progress-leave-to {
  opacity: 0;
}
</style>
