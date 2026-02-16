<template>
  <teleport to="body">
    <transition name="fade">
      <div
        v-if="visible"
        class="floating-transcode-button"
        :style="buttonStyle"
        @mousedown="startDrag"
        @touchstart="startDrag"
        @click="handleClick"
      >
        <div class="button-content">
          <n-badge :value="taskCount" :max="99" :offset="[-4, 4]">
            <div class="icon-wrapper">
              <n-icon size="22" color="#fff">
                <VideocamOutline />
              </n-icon>
            </div>
          </n-badge>
        </div>
        <div v-if="progressText" class="progress-indicator">
          {{ progressText }}
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { VideocamOutline } from '@vicons/ionicons5'
import { useTranscodeProgressStore } from '@/stores/transcodeProgress'

const emit = defineEmits<{
  click: []
}>()

const transcodeStore = useTranscodeProgressStore()

const visible = computed(() => transcodeStore.hasActiveTasks)
const taskCount = computed(() => transcodeStore.activeTaskCount)

const progressText = computed(() => {
  const activeTasks = Object.values(transcodeStore.tasks).filter(
    t => t.state === 'processing'
  )
  if (activeTasks.length === 0) return ''
  // 显示第一个进行中任务的进度
  const task = activeTasks[0]
  return `${task.progress}%`
})

// 拖动逻辑（与 FloatingTransferButton 相同）
const position = ref({ x: window.innerWidth - 100, y: window.innerHeight - 220 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
let dragStartTime = 0
let hasDragged = false

const buttonStyle = computed(() => ({
  transform: `translate3d(${position.value.x}px, ${position.value.y}px, 0)`,
  cursor: isDragging.value ? 'grabbing' : 'grab',
}))

function ensureInViewport() {
  const buttonSize = 52
  const margin = 10
  const maxX = window.innerWidth - buttonSize - margin
  const maxY = window.innerHeight - buttonSize - margin
  position.value.x = Math.max(margin, Math.min(position.value.x, maxX))
  position.value.y = Math.max(margin, Math.min(position.value.y, maxY))
}

function startDrag(e: MouseEvent | TouchEvent) {
  isDragging.value = true
  dragStartTime = Date.now()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  dragOffset.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
}

function onDrag(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  if (Date.now() - dragStartTime > 100) hasDragged = true
  e.preventDefault()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  position.value = {
    x: clientX - dragOffset.value.x,
    y: clientY - dragOffset.value.y
  }
  ensureInViewport()
}

function stopDrag() {
  isDragging.value = false
  setTimeout(() => { hasDragged = false }, 50)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

function handleClick() {
  if (hasDragged) { hasDragged = false; return }
  emit('click')
}

function onResize() { ensureInViewport() }

onMounted(() => {
  window.addEventListener('resize', onResize)
  ensureInViewport()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  stopDrag()
})
</script>

<style scoped>
.floating-transcode-button {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 9998;
  user-select: none;
  touch-action: none;
}

.button-content {
  position: relative;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f0a020 0%, #e88d00 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.icon-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15);
}

.icon-wrapper:active {
  transform: scale(0.95);
}

.progress-indicator {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

@media (max-width: 768px) {
  .icon-wrapper {
    width: 42px;
    height: 42px;
  }
  .progress-indicator {
    font-size: 10px;
    padding: 1px 6px;
    bottom: -16px;
  }
}
</style>
