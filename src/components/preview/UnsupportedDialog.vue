<template>
  <n-modal v-model:show="visible" preset="dialog" :title="t('preview.cannotPreview')" :style="{ width: '420px' }">
    <div class="unsupported-content">
      <div class="file-info-section">
        <n-icon size="40" color="var(--n-text-color-3)"><HelpCircleOutline /></n-icon>
        <div>
          <p class="unsupported-filename">{{ fileName }}</p>
          <p class="unsupported-mime">{{ mime || t('common.unknown') }}</p>
        </div>
      </div>

      <p class="unsupported-hint">{{ t('preview.chooseAction') }}</p>

      <n-space vertical :size="8">
        <n-button block @click="emit('choose', 'video')" :style="{ justifyContent: 'flex-start' }">
          <template #icon><n-icon><VideocamOutline /></n-icon></template>
          {{ t('preview.openAsVideo') }}
        </n-button>
        <n-button block @click="emit('choose', 'audio')" :style="{ justifyContent: 'flex-start' }">
          <template #icon><n-icon><MusicalNotesOutline /></n-icon></template>
          {{ t('preview.openAsAudio') }}
        </n-button>
        <n-button block @click="emit('choose', 'text')" :style="{ justifyContent: 'flex-start' }">
          <template #icon><n-icon><DocumentTextOutline /></n-icon></template>
          {{ t('preview.openAsText') }}
        </n-button>
        <n-button block @click="emit('choose', 'pdf')" :style="{ justifyContent: 'flex-start' }">
          <template #icon><n-icon><DocumentOutline /></n-icon></template>
          {{ t('preview.openAsPdf') }}
        </n-button>
        <n-divider style="margin: 4px 0" />
        <n-button block type="primary" @click="emit('choose', 'download')" :style="{ justifyContent: 'flex-start' }">
          <template #icon><n-icon><DownloadOutline /></n-icon></template>
          {{ t('preview.directDownload') }}
        </n-button>
      </n-space>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  HelpCircleOutline, VideocamOutline, MusicalNotesOutline,
  DocumentTextOutline, DocumentOutline, DownloadOutline
} from '@vicons/ionicons5'

const { t } = useI18n()

const visible = defineModel<boolean>('show', { default: false })

defineProps<{
  fileName: string
  mime?: string
}>()

const emit = defineEmits<{
  choose: [type: 'video' | 'audio' | 'text' | 'pdf' | 'download']
}>()
</script>

<style scoped>
.unsupported-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-info-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.unsupported-filename {
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  word-break: break-all;
  color: var(--n-text-color);
}

.unsupported-mime {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin: 2px 0 0;
}

.unsupported-hint {
  font-size: 14px;
  color: var(--n-text-color-2);
  margin: 0;
}
</style>
