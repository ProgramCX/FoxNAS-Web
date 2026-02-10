<template>
  <n-modal v-model:show="visible" preset="dialog" :title="t('preview.playbackIssue')" :style="{ width: '420px' }">
    <div class="playback-dialog-content">
      <div class="file-info-section">
        <n-icon size="36" color="#f0a020"><WarningOutline /></n-icon>
        <div>
          <p class="dialog-filename">{{ fileName }}</p>
          <p class="dialog-hint">{{ mediaType === 'video' ? t('preview.videoNotNativeSupport') : t('preview.audioNotNativeSupport') }}</p>
        </div>
      </div>

      <n-space vertical :size="8">
        <n-button block type="primary" @click="emit('action', 'tryPlay')" :style="{ justifyContent: 'flex-start' }">
          <template #icon>
            <n-icon><PlayOutline /></n-icon>
          </template>
          {{ t('preview.tryPlay') }}
        </n-button>
        <n-button block @click="emit('action', 'download')" :style="{ justifyContent: 'flex-start' }">
          <template #icon>
            <n-icon><DownloadOutline /></n-icon>
          </template>
          {{ t('preview.directDownload') }}
        </n-button>
        <n-button block @click="emit('action', 'transcode')" :style="{ justifyContent: 'flex-start' }">
          <template #icon>
            <n-icon><SwapHorizontalOutline /></n-icon>
          </template>
          {{ t('preview.serverTranscode') }}
        </n-button>
      </n-space>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { WarningOutline, PlayOutline, DownloadOutline, SwapHorizontalOutline } from '@vicons/ionicons5'

const { t } = useI18n()

const visible = defineModel<boolean>('show', { default: false })

defineProps<{
  fileName: string
  mediaType: 'video' | 'audio'
}>()

const emit = defineEmits<{
  action: [type: 'tryPlay' | 'download' | 'transcode']
}>()
</script>

<style scoped>
.playback-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-info-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(240, 160, 32, 0.06);
  border-radius: 8px;
  border: 1px solid rgba(240, 160, 32, 0.15);
}

.dialog-filename {
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  word-break: break-all;
  color: var(--n-text-color);
}

.dialog-hint {
  font-size: 13px;
  color: var(--n-text-color-3);
  margin: 4px 0 0;
}
</style>
