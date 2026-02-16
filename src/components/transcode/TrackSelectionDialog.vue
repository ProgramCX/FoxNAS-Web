<template>
  <n-modal
    v-model:show="visible"
    preset="dialog"
    :title="t('preview.selectTracks')"
    :positive-text="t('preview.startTranscode')"
    :negative-text="t('common.cancel')"
    :loading="submitting"
    @positive-click="handleSubmit"
    @negative-click="handleCancel"
    style="max-width: 500px;"
  >
    <n-spin :show="loading">
      <div class="track-selection" v-if="metadata">
        <div class="file-info">
          <n-text strong>{{ fileName }}</n-text>
          <n-text depth="3" style="margin-left: 8px;" v-if="metadata.durationSeconds">
            {{ formatDuration(metadata.durationSeconds) }}
          </n-text>
        </div>

        <!-- 音频轨道 -->
        <div class="track-group" v-if="audioTracks.length > 0">
          <n-text strong style="margin-bottom: 8px; display: block;">{{ t('preview.audioTrack') }}</n-text>
          <n-radio-group v-model:value="selectedAudioIndex">
            <n-space vertical :size="8">
              <n-radio
                v-for="track in audioTracks"
                :key="track.index"
                :value="track.index"
              >
                <span class="track-label">
                  #{{ track.index }} — {{ track.codec }}
                  <n-tag v-if="track.language" size="tiny" :bordered="false" type="info">{{ track.language }}</n-tag>
                  <n-tag v-if="track.title" size="tiny" :bordered="false">{{ track.title }}</n-tag>
                </span>
              </n-radio>
            </n-space>
          </n-radio-group>
        </div>

        <!-- 字幕轨道 -->
        <div class="track-group" v-if="subtitleTracks.length > 0">
          <n-text strong style="margin-bottom: 8px; display: block;">{{ t('preview.subtitleTrack') }}</n-text>
          <n-radio-group v-model:value="selectedSubtitleIndex">
            <n-space vertical :size="8">
              <n-radio :value="-1">
                {{ t('preview.noSubtitle') }}
              </n-radio>
              <n-radio
                v-for="track in subtitleTracks"
                :key="track.index"
                :value="track.index"
              >
                <span class="track-label">
                  #{{ track.index }} — {{ track.codec }}
                  <n-tag v-if="track.language" size="tiny" :bordered="false" type="info">{{ track.language }}</n-tag>
                  <n-tag v-if="track.title" size="tiny" :bordered="false">{{ track.title }}</n-tag>
                </span>
              </n-radio>
            </n-space>
          </n-radio-group>
        </div>

        <!-- 无音轨提示 -->
        <n-alert v-if="audioTracks.length === 0" type="warning" :bordered="false">
          {{ t('preview.noSubtitleTrack') }}
        </n-alert>
      </div>
    </n-spin>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import { mediaService } from '@/api/services/media'
import type { MediaMetadata, MediaTrackInfo } from '@/types'

const { t } = useI18n()
const message = useMessage()

const visible = defineModel<boolean>('show', { default: false })

const props = defineProps<{
  filePath: string
  fileName: string
}>()

const emit = defineEmits<{
  submit: [audioTrackIndex: number, subtitleTrackIndex: number, fingerprint?: string]
}>()

const loading = ref(false)
const submitting = ref(false)
const metadata = ref<MediaMetadata | null>(null)
const selectedAudioIndex = ref<number>(0)
const selectedSubtitleIndex = ref<number>(-1)
const fingerprint = ref<string | undefined>()

const audioTracks = computed(() =>
  metadata.value?.tracks.filter(t => t.type === 'audio') ?? []
)

const subtitleTracks = computed(() =>
  metadata.value?.tracks.filter(t => t.type === 'subtitle') ?? []
)

watch(() => visible.value, async (show) => {
  if (show && props.filePath) {
    await loadMetadata()
  }
})

async function loadMetadata() {
  loading.value = true
  try {
    const res = await mediaService.getMetadata(props.filePath)
    metadata.value = res
    // 默认选中第一个音频轨道
    if (audioTracks.value.length > 0) {
      selectedAudioIndex.value = audioTracks.value[0].index
    }
    selectedSubtitleIndex.value = -1
  } catch (err) {
    console.error('Failed to load metadata:', err)
    message.error(t('preview.loadFailed'))
  } finally {
    loading.value = false
  }
}

function handleSubmit() {
  emit('submit', selectedAudioIndex.value, selectedSubtitleIndex.value, fingerprint.value)
  return false // 阻止自动关闭，由父组件控制
}

function handleCancel() {
  visible.value = false
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

// 供外部调用设置 fingerprint
function setFingerprint(fp: string) {
  fingerprint.value = fp
}

defineExpose({ setFingerprint })
</script>

<style scoped>
.track-selection {
  padding: 8px 0;
}

.file-info {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--n-border-color);
}

.track-group {
  margin-bottom: 16px;
}

.track-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
