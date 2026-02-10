<template>
  <div class="pdf-preview">
    <div class="pdf-toolbar">
      <n-button-group>
        <n-button quaternary size="small" :disabled="currentPage <= 1" @click="prevPage">
          <template #icon><n-icon><ChevronBackOutline /></n-icon></template>
        </n-button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <n-button quaternary size="small" :disabled="currentPage >= totalPages" @click="nextPage">
          <template #icon><n-icon><ChevronForwardOutline /></n-icon></template>
        </n-button>
      </n-button-group>

      <n-divider vertical />

      <n-button-group>
        <n-tooltip>
          <template #trigger>
            <n-button quaternary size="small" @click="zoomOut">
              <template #icon><n-icon><RemoveOutline /></n-icon></template>
            </n-button>
          </template>
          {{ t('preview.zoomOut') }}
        </n-tooltip>
        <span class="zoom-label">{{ Math.round(pdfScale * 100) }}%</span>
        <n-tooltip>
          <template #trigger>
            <n-button quaternary size="small" @click="zoomIn">
              <template #icon><n-icon><AddOutline /></n-icon></template>
            </n-button>
          </template>
          {{ t('preview.zoomIn') }}
        </n-tooltip>
      </n-button-group>

      <n-divider vertical />

      <n-tooltip>
        <template #trigger>
          <n-button quaternary size="small" @click="fitWidth">
            <template #icon><n-icon><ExpandOutline /></n-icon></template>
          </n-button>
        </template>
        {{ t('preview.fitScreen') }}
      </n-tooltip>
    </div>

    <div class="pdf-container" ref="pdfContainerRef">
      <n-spin :show="loading" size="large">
        <canvas ref="canvasRef" class="pdf-canvas"></canvas>
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as pdfjsLib from 'pdfjs-dist'
import {
  ChevronBackOutline, ChevronForwardOutline,
  AddOutline, RemoveOutline, ExpandOutline
} from '@vicons/ionicons5'

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

const { t } = useI18n()

const props = defineProps<{
  src: string
  fileName: string
}>()

const canvasRef = ref<HTMLCanvasElement>()
const pdfContainerRef = ref<HTMLElement>()
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(0)
const pdfScale = ref(1)

let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null

async function loadPdf() {
  loading.value = true
  try {
    const loadingTask = pdfjsLib.getDocument({
      url: props.src,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4/cmaps/',
      cMapPacked: true,
    })
    pdfDoc = await loadingTask.promise
    totalPages.value = pdfDoc.numPages
    currentPage.value = 1
    fitWidth()
    await renderPage()
  } catch (error) {
    console.error('Failed to load PDF:', error)
  } finally {
    loading.value = false
  }
}

async function renderPage() {
  if (!pdfDoc || !canvasRef.value) return

  loading.value = true
  try {
    const page = await pdfDoc.getPage(currentPage.value)
    const viewport = page.getViewport({ scale: pdfScale.value })

    const canvas = canvasRef.value
    const context = canvas.getContext('2d')
    if (!context) return

    // HiDPI / Retina support
    const dpr = window.devicePixelRatio || 1
    canvas.width = viewport.width * dpr
    canvas.height = viewport.height * dpr
    canvas.style.width = viewport.width + 'px'
    canvas.style.height = viewport.height + 'px'
    context.scale(dpr, dpr)

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise
  } catch (error) {
    console.error('Failed to render PDF page:', error)
  } finally {
    loading.value = false
  }
}

function prevPage() {
  if (currentPage.value <= 1) return
  currentPage.value--
  renderPage()
}

function nextPage() {
  if (currentPage.value >= totalPages.value) return
  currentPage.value++
  renderPage()
}

function zoomIn() {
  pdfScale.value = Math.min(pdfScale.value * 1.25, 5)
  renderPage()
}

function zoomOut() {
  pdfScale.value = Math.max(pdfScale.value / 1.25, 0.25)
  renderPage()
}

async function fitWidth() {
  if (!pdfDoc || !pdfContainerRef.value) return

  try {
    const page = await pdfDoc.getPage(currentPage.value)
    const viewport = page.getViewport({ scale: 1 })
    const containerWidth = pdfContainerRef.value.clientWidth - 40 // padding
    pdfScale.value = containerWidth / viewport.width
    await renderPage()
  } catch {
    // ignore
  }
}

onMounted(() => {
  loadPdf()
})

onUnmounted(() => {
  if (pdfDoc) {
    pdfDoc.destroy()
    pdfDoc = null
  }
})
</script>

<style scoped>
.pdf-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.pdf-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--n-color);
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.pdf-toolbar :deep(.n-button) {
  background-color: transparent !important;
}

.page-info {
  font-size: 13px;
  color: var(--n-text-color-2);
  min-width: 60px;
  text-align: center;
}

.zoom-label {
  font-size: 12px;
  color: var(--n-text-color-3);
  min-width: 50px;
  text-align: center;
}

.pdf-container {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 20px;
  background: var(--bg-color-secondary);
}

.pdf-canvas {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  background: white;
}
</style>
