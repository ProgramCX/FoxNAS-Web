<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    :style="modalStyle"
    :mask-closable="true"
    :close-on-esc="true"
    :closable="false"
    transform-origin="center"
    class="file-preview-modal"
  >
    <template #header>
      <div class="preview-header">
        <span class="preview-title" :title="fileName">{{ fileName }}</span>
        <n-space :size="4" align="center">
          <n-tag size="small" :bordered="false" v-if="categoryLabel">{{ categoryLabel }}</n-tag>
          <n-button quaternary circle size="small" @click="toggleFullscreen">
            <template #icon>
              <n-icon>
                <ContractOutline v-if="isFullscreen" />
                <ExpandOutline v-else />
              </n-icon>
            </template>
          </n-button>
          <n-button quaternary circle size="small" @click="handleDownload">
            <template #icon><n-icon><DownloadOutline /></n-icon></template>
          </n-button>
          <n-button quaternary circle size="small" @click="close">
            <template #icon><n-icon><CloseOutline /></n-icon></template>
          </n-button>
        </n-space>
      </div>
    </template>

    <div class="preview-body">
      <!-- Loading URL -->
      <div v-if="loadingUrl || (!fileUrl && forcePreviewType)" class="preview-loading">
        <n-spin size="large" />
      </div>

      <!-- Image Preview -->
      <ImagePreview
        v-else-if="previewType === 'image' && fileUrl"
        :src="fileUrl"
        :file-name="fileName"
      />

      <!-- Video Preview -->
      <VideoPreview
        v-else-if="previewType === 'video' && fileUrl"
        :src="fileUrl"
        :file-name="fileName"
        :mime="mime"
      />

      <!-- Audio Preview -->
      <AudioPreview
        v-else-if="previewType === 'audio' && fileUrl"
        :src="fileUrl"
        :file-name="fileName"
        :file-path="props.file?.path || ''"
      />

      <!-- PDF Preview -->
      <PdfPreview
        v-else-if="previewType === 'pdf' && fileUrl"
        :src="fileUrl"
        :file-name="fileName"
      />

      <!-- Text Preview -->
      <TextPreview
        v-else-if="previewType === 'text' && fileUrl"
        :src="fileUrl"
        :file-name="fileName"
        :mime="mime"
      />

      <!-- Loading -->
      <div v-else class="preview-loading">
        <n-spin size="large" />
      </div>
    </div>
  </n-modal>

  <!-- Playback issue dialog -->
  <PlaybackIssueDialog
    v-model:show="showPlaybackIssue"
    :file-name="fileName"
    :media-type="playbackIssueType"
    @action="handlePlaybackAction"
  />

  <!-- Unsupported dialog -->
  <UnsupportedDialog
    v-model:show="showUnsupported"
    :file-name="fileName"
    :mime="mime"
    @choose="handleUnsupportedChoice"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import { ExpandOutline, ContractOutline, DownloadOutline, CloseOutline } from '@vicons/ionicons5'
import { apiConfig, apiEndpoints } from '@/api/config'
import { fileService } from '@/api/services/file'
import type { FileInfo } from '@/types'

import ImagePreview from './ImagePreview.vue'
import VideoPreview from './VideoPreview.vue'
import AudioPreview from './AudioPreview.vue'
import PdfPreview from './PdfPreview.vue'
import TextPreview from './TextPreview.vue'
import PlaybackIssueDialog from './PlaybackIssueDialog.vue'
import UnsupportedDialog from './UnsupportedDialog.vue'

const { t } = useI18n()
const message = useMessage()

const visible = defineModel<boolean>('show', { default: false })

const props = defineProps<{
  file: FileInfo | null
}>()

const emit = defineEmits<{
  download: [file: FileInfo]
}>()

const isFullscreen = ref(false)
const showPlaybackIssue = ref(false)
const showUnsupported = ref(false)
const playbackIssueType = ref<'video' | 'audio'>('video')
const forcePreviewType = ref<string | null>(null)
const fileUrl = ref('')
const loadingUrl = ref(false)

const fileName = computed(() => props.file?.name || '')
const mime = computed(() => props.file?.mime || '')
const category = computed(() => props.file?.category || 'other')
const canPlay = computed(() => props.file?.canPlay ?? false)

const categoryLabel = computed(() => {
  const labels: Record<string, string> = {
    video: t('files.video'),
    audio: t('files.audio'),
    image: t('files.image'),
    doc: t('files.document'),
    archive: t('files.archive'),
    code: t('preview.code'),
    other: t('files.other'),
  }
  return labels[category.value] || ''
})

/**
 * Build the authenticated file content URL.
 * - For video/audio: use media token + video-stream endpoint
 * - For image/pdf/text: fetch via Authorization header and create Blob URL
 */
async function resolveFileUrl(file: FileInfo) {
  loadingUrl.value = true
  try {
    const cat = file.category || 'other'

    if (cat === 'video' || cat === 'audio') {
      // Use media token-based streaming URL
      const token = await fileService.getMediaToken(file.path)
      fileUrl.value = fileService.getVideoStreamUrl(file.path, token)
    } else {
      // Fetch content with auth header and create Blob URL
      const authToken = localStorage.getItem(apiConfig.tokenKey) || ''
      const isInline = (file.mime || '').toLowerCase().includes('pdf')
      const url = `${apiConfig.baseURL}${apiEndpoints.file.operation.get}?path=${encodeURIComponent(file.path)}${isInline ? '&inline=true' : ''}`
      const response = await fetch(url, {
        headers: { Authorization: authToken ? `Bearer ${authToken}` : '' },
      })
      if (!response.ok) throw new Error('Failed to fetch file')
      const rawBlob = await response.blob()
      // 使用文件的实际 MIME 类型创建 blob，确保 SVG 等格式正确渲染
      const fileMime = (file.mime || '').toLowerCase()
      const blob = fileMime && rawBlob.type !== fileMime
        ? new Blob([rawBlob], { type: fileMime })
        : rawBlob
      // Revoke old blob URL if any
      if (fileUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl.value)
      }
      fileUrl.value = URL.createObjectURL(blob)
    }
  } catch (error) {
    console.error('Failed to resolve file URL:', error)
    fileUrl.value = ''
  } finally {
    loadingUrl.value = false
  }
}

/**
 * Determine preview type from category/mime/canPlay
 */
const previewType = computed<string>(() => {
  if (forcePreviewType.value) return forcePreviewType.value
  if (!props.file) return ''

  const cat = category.value
  const m = mime.value.toLowerCase()

  // Image
  if (cat === 'image' && canPlay.value) return 'image'
  if (cat === 'image') return 'image' // Try to show images always

  // Video
  if (cat === 'video') {
    // canPlay: browser supports it natively
    // needTranscode / !canPlay => show issue dialog first
    return '' // resolved via dialog
  }

  // Audio
  if (cat === 'audio') {
    return '' // resolved via dialog
  }

  // PDF
  if (m.includes('pdf')) return 'pdf'

  // Text / Code / Doc (non-PDF)
  if (cat === 'doc' || cat === 'code') {
    if (m.includes('pdf')) return 'pdf'
    return 'text'
  }

  // Unknown
  return ''
})

const modalStyle = computed(() => ({
  width: isFullscreen.value ? '100vw' : '90vw',
  maxWidth: isFullscreen.value ? '100vw' : '1200px',
  height: isFullscreen.value ? '100vh' : '85vh',
  maxHeight: isFullscreen.value ? '100vh' : '85vh',
  margin: isFullscreen.value ? '0' : undefined,
  borderRadius: isFullscreen.value ? '0' : '12px',
  overflow: 'hidden',
}))

/**
 * When file changes, determine preview type and possibly show dialogs
 */
watch(() => props.file, (file) => {
  if (!file) return
  forcePreviewType.value = null
  fileUrl.value = ''

  const cat = file.category || 'other'
  const cp = file.canPlay ?? false

  if (cat === 'video') {
    if (cp) {
      forcePreviewType.value = 'video'
      resolveFileUrl(file)
    } else {
      // Show playback issue dialog
      playbackIssueType.value = 'video'
      showPlaybackIssue.value = true
    }
  } else if (cat === 'audio') {
    if (cp) {
      forcePreviewType.value = 'audio'
      resolveFileUrl(file)
    } else {
      playbackIssueType.value = 'audio'
      showPlaybackIssue.value = true
    }
  } else if (cat === 'image') {
    forcePreviewType.value = 'image'
    resolveFileUrl(file)
  } else if ((file.mime || '').toLowerCase().includes('pdf')) {
    forcePreviewType.value = 'pdf'
    resolveFileUrl(file)
  } else if (cat === 'doc' || cat === 'code') {
    forcePreviewType.value = 'text'
    resolveFileUrl(file)
  } else {
    // Unsupported - show choice dialog
    showUnsupported.value = true
  }
}, { immediate: true })

function handlePlaybackAction(action: 'tryPlay' | 'download' | 'transcode') {
  showPlaybackIssue.value = false

  if (action === 'tryPlay') {
    forcePreviewType.value = playbackIssueType.value
    if (props.file) resolveFileUrl(props.file)
  } else if (action === 'download') {
    if (props.file) emit('download', props.file)
    close()
  } else if (action === 'transcode') {
    requestServerTranscode()
  }
}

function handleUnsupportedChoice(type: 'video' | 'audio' | 'text' | 'pdf' | 'download') {
  showUnsupported.value = false

  if (type === 'download') {
    if (props.file) emit('download', props.file)
    close()
  } else {
    forcePreviewType.value = type
    if (props.file) resolveFileUrl(props.file)
  }
}

/**
 * TODO: Implement server-side transcoding request
 * This should call the backend transcoding API and return a streamable URL
 */
function requestServerTranscode() {
  // TODO: call backend transcoding API
  // For now, show a message and fallback to try play
  message.info(t('preview.transcodeNotAvailable'))
  forcePreviewType.value = playbackIssueType.value
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function handleDownload() {
  if (props.file) emit('download', props.file)
}

function close() {
  visible.value = false
  forcePreviewType.value = null
  isFullscreen.value = false
  // Revoke blob URL to free memory
  if (fileUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(fileUrl.value)
  }
  fileUrl.value = ''
}
</script>

<style scoped>
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.preview-header :deep(.n-button) {
  color: var(--n-text-color) !important;
  background-color: var(--n-color) !important;
  opacity: 1 !important;
}

.preview-header :deep(.n-button:hover) {
  background-color: var(--n-border-color) !important;
  opacity: 1 !important;
}

.preview-header :deep(.n-icon) {
  font-size: 16px !important;
}

.preview-title {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.preview-body {
  height: calc(100% - 52px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Override n-modal card body padding */
:deep(.n-card__content) {
  padding: 0 !important;
  height: 100%;
}

:deep(.n-modal) {
  display: flex;
  flex-direction: column;
}

:deep(.n-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>

<style>
/* Global styles for the preview modal */
.file-preview-modal .n-card__content {
  padding: 0 !important;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.file-preview-modal .n-card__header {
  padding: 12px 16px !important;
  background-color: var(--n-color) !important;
  border-bottom: 1px solid var(--n-border-color) !important;
}

.file-preview-modal .n-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.file-preview-modal .n-card__header .n-button {
  color: var(--n-text-color) !important;
  background-color: var(--n-color) !important;
}

.file-preview-modal .n-card__header .n-button:hover {
  background-color: var(--n-border-color) !important;
}
</style>
