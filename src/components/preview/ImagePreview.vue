<template>
  <div class="image-preview" ref="containerRef">
    <div class="image-toolbar">
      <n-button-group>
        <n-tooltip>
          <template #trigger>
            <n-button quaternary circle size="small" @click="zoomIn">
              <template #icon><n-icon><AddOutline /></n-icon></template>
            </n-button>
          </template>
          {{ t('preview.zoomIn') }}
        </n-tooltip>
        <n-tooltip>
          <template #trigger>
            <n-button quaternary circle size="small" @click="zoomOut">
              <template #icon><n-icon><RemoveOutline /></n-icon></template>
            </n-button>
          </template>
          {{ t('preview.zoomOut') }}
        </n-tooltip>
        <n-tooltip>
          <template #trigger>
            <n-button quaternary circle size="small" @click="resetTransform">
              <template #icon><n-icon><ContractOutline /></n-icon></template>
            </n-button>
          </template>
          {{ t('preview.resetView') }}
        </n-tooltip>
        <n-tooltip>
          <template #trigger>
            <n-button quaternary circle size="small" @click="rotateLeft">
              <template #icon><n-icon><ReturnUpBackOutline /></n-icon></template>
            </n-button>
          </template>
          {{ t('preview.rotateLeft') }}
        </n-tooltip>
        <n-tooltip>
          <template #trigger>
            <n-button quaternary circle size="small" @click="rotateRight">
              <template #icon><n-icon><ReturnUpForwardOutline /></n-icon></template>
            </n-button>
          </template>
          {{ t('preview.rotateRight') }}
        </n-tooltip>
        <n-tooltip>
          <template #trigger>
            <n-button quaternary circle size="small" @click="fitToScreen">
              <template #icon><n-icon><ExpandOutline /></n-icon></template>
            </n-button>
          </template>
          {{ t('preview.fitScreen') }}
        </n-tooltip>
      </n-button-group>
      <span class="zoom-label">{{ Math.round(scale * 100) }}%</span>
    </div>

    <div
      class="image-container"
      ref="imageContainerRef"
      @mousedown="startDrag"
      @wheel.prevent="handleWheel"
      @touchstart.passive="handleTouchStart"
      @touchmove.prevent="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <n-spin :show="loading" size="large">
        <img
          ref="imgRef"
          :src="src"
          :alt="fileName"
          class="preview-image"
          :style="imageStyle"
          @load="onImageLoad"
          @error="onImageError"
          draggable="false"
        />
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AddOutline, RemoveOutline, ContractOutline,
  ReturnUpBackOutline, ReturnUpForwardOutline, ExpandOutline
} from '@vicons/ionicons5'

const { t } = useI18n()

const props = defineProps<{
  src: string
  fileName: string
}>()

const containerRef = ref<HTMLElement>()
const imageContainerRef = ref<HTMLElement>()
const imgRef = ref<HTMLImageElement>()

const loading = ref(true)
const scale = ref(1)
const rotation = ref(0)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const lastTouchDistance = ref(0)

const imageStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value}) rotate(${rotation.value}deg)`,
  cursor: isDragging.value ? 'grabbing' : 'grab',
  transition: isDragging.value ? 'none' : 'transform 0.3s ease',
}))

function onImageLoad() {
  loading.value = false
  fitToScreen()
}

function onImageError() {
  loading.value = false
}

function zoomIn() {
  scale.value = Math.min(scale.value * 1.25, 10)
}

function zoomOut() {
  scale.value = Math.max(scale.value / 1.25, 0.1)
}

function resetTransform() {
  scale.value = 1
  rotation.value = 0
  translateX.value = 0
  translateY.value = 0
}

function rotateLeft() {
  rotation.value -= 90
}

function rotateRight() {
  rotation.value += 90
}

function fitToScreen() {
  if (!imgRef.value || !imageContainerRef.value) return
  const img = imgRef.value
  const container = imageContainerRef.value

  const cw = container.clientWidth
  const ch = container.clientHeight
  const iw = img.naturalWidth
  const ih = img.naturalHeight

  if (iw === 0 || ih === 0) return

  const scaleX = cw / iw
  const scaleY = ch / ih
  scale.value = Math.min(scaleX, scaleY, 1) * 0.95
  translateX.value = 0
  translateY.value = 0
  rotation.value = 0
}

function handleWheel(e: WheelEvent) {
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  scale.value = Math.min(Math.max(scale.value * delta, 0.1), 10)
}

function startDrag(e: MouseEvent) {
  isDragging.value = true
  dragStartX.value = e.clientX - translateX.value
  dragStartY.value = e.clientY - translateY.value
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return
  translateX.value = e.clientX - dragStartX.value
  translateY.value = e.clientY - dragStartY.value
}

function stopDrag() {
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

// Touch support for mobile
function handleTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    lastTouchDistance.value = getTouchDistance(e.touches)
  } else if (e.touches.length === 1) {
    isDragging.value = true
    dragStartX.value = e.touches[0].clientX - translateX.value
    dragStartY.value = e.touches[0].clientY - translateY.value
  }
}

function handleTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    const dist = getTouchDistance(e.touches)
    if (lastTouchDistance.value > 0) {
      const ratio = dist / lastTouchDistance.value
      scale.value = Math.min(Math.max(scale.value * ratio, 0.1), 10)
    }
    lastTouchDistance.value = dist
  } else if (e.touches.length === 1 && isDragging.value) {
    translateX.value = e.touches[0].clientX - dragStartX.value
    translateY.value = e.touches[0].clientY - dragStartY.value
  }
}

function handleTouchEnd() {
  isDragging.value = false
  lastTouchDistance.value = 0
}

function getTouchDistance(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.image-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.image-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--n-color);
  border-bottom: 1px solid var(--n-border-color);
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
}

.zoom-label {
  font-size: 12px;
  color: var(--n-text-color-3);
  min-width: 50px;
  text-align: center;
}

.image-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  border-radius: 0 0 8px 8px;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
}

.preview-image {
  max-width: none;
  max-height: none;
  transform-origin: center center;
  will-change: transform;
}
</style>
