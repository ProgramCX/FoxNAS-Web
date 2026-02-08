<template>
  <teleport to="body">
    <transition name="fade">
      <div
        v-if="visible"
        class="floating-transfer-button"
        :style="buttonStyle"
        @mousedown="startDrag"
        @touchstart="startDrag"
        @click="handleClick"
      >
        <div class="button-content">
          <n-badge :value="taskCount" :max="99" :offset="[-4, 4]">
            <div class="icon-wrapper">
              <n-icon size="24" color="#fff">
                <CloudDownloadOutline v-if="downloadCount > 0 && uploadCount === 0" />
                <CloudUploadOutline v-else-if="uploadCount > 0 && downloadCount === 0" />
                <SwapHorizontalOutline v-else />
              </n-icon>
            </div>
          </n-badge>
        </div>
        <div v-if="totalSpeed > 0" class="speed-indicator">
          {{ formatSpeed(totalSpeed) }}
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { CloudDownloadOutline, CloudUploadOutline, SwapHorizontalOutline } from '@vicons/ionicons5'
import { useDownloadProgressStore, formatSpeed } from '@/stores/downloadProgress'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'click'): void
}>()

const downloadStore = useDownloadProgressStore()

const visible = computed(() => downloadStore.hasActiveTasks)
const taskCount = computed(() => downloadStore.pendingTaskCount)
const downloadCount = computed(() => downloadStore.downloadTasks.filter(t => t.status === 'pending' || t.status === 'running').length)
const uploadCount = computed(() => downloadStore.uploadTasks.filter(t => t.status === 'pending' || t.status === 'running').length)

const totalSpeed = computed(() => {
  return Object.values(downloadStore.tasks)
    .filter(t => t.status === 'running')
    .reduce((sum, t) => sum + t.speed, 0)
})

// 拖动相关
const position = ref({ x: window.innerWidth - 100, y: window.innerHeight - 150 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const buttonRef = ref<HTMLElement | null>(null)

const buttonStyle = computed(() => ({
  transform: `translate3d(${position.value.x}px, ${position.value.y}px, 0)`,
  cursor: isDragging.value ? 'grabbing' : 'grab',
}))

// 确保按钮在可视区域内
function ensureInViewport() {
  const buttonSize = 60
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
  
  // 标记已经拖动过
  const dragDuration = Date.now() - dragStartTime
  if (dragDuration > 100) {
    hasDragged = true
  }
  
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
  // 延迟重置 hasDragged，让点击事件有机会被处理
  setTimeout(() => {
    hasDragged = false
  }, 50)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

// 点击处理 - 区分点击和拖动
let dragStartTime = 0
let hasDragged = false

function handleClick(e: MouseEvent) {
  // 如果拖动过，不触发点击
  if (hasDragged) {
    hasDragged = false
    return
  }
  emit('click')
}

// 监听窗口大小变化
function onResize() {
  ensureInViewport()
}

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
.floating-transfer-button {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 9999;
  user-select: none;
  touch-action: none;
}

.button-content {
  position: relative;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-hover) 100%);
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

.speed-indicator {
  position: absolute;
  bottom: -20px;
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

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .icon-wrapper {
    width: 48px;
    height: 48px;
  }
  
  .speed-indicator {
    font-size: 10px;
    padding: 1px 6px;
    bottom: -18px;
  }
}
</style>
