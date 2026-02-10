<template>
  <div class="video-preview">
    <div ref="playerRef" class="artplayer-container"></div>

    <!-- 字幕选择 -->
    <div class="video-controls-extra" v-if="showSubtitlePicker">
      <n-space align="center" :size="8">
        <n-icon size="16"><TextOutline /></n-icon>
        <span class="control-label">{{ t('preview.subtitle') }}:</span>
        <n-button size="small" @click="pickSubtitleFile">
          {{ subtitleName || t('preview.selectSubtitle') }}
        </n-button>
        <n-button v-if="subtitleName" size="small" quaternary @click="clearSubtitle">
          {{ t('preview.clearSubtitle') }}
        </n-button>
      </n-space>
    </div>

    <!-- 隐藏文件输入 -->
    <input
      ref="subtitleInputRef"
      type="file"
      accept=".srt,.vtt,.ass,.ssa,.sub,.lrc"
      style="display: none"
      @change="handleSubtitleSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Artplayer from 'artplayer'
import { TextOutline } from '@vicons/ionicons5'

const { t } = useI18n()

const props = defineProps<{
  src: string
  fileName: string
  mime?: string
  poster?: string
}>()

const playerRef = ref<HTMLElement>()
const subtitleInputRef = ref<HTMLInputElement>()
const showSubtitlePicker = ref(true)
const subtitleName = ref('')
let art: Artplayer | null = null

function initPlayer() {
  if (!playerRef.value) return

  art = new Artplayer({
    container: playerRef.value,
    url: props.src,
    type: props.mime || '',
    title: props.fileName,
    poster: props.poster || '',
    volume: 0.7,
    isLive: false,
    muted: false,
    autoplay: false,
    pip: true,
    autoSize: false,
    autoMini: true,
    screenshot: true,
    setting: true,
    loop: false,
    flip: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    subtitleOffset: true,
    miniProgressBar: true,
    mutex: true,
    backdrop: true,
    playsInline: true,
    autoPlayback: true,
    airplay: true,
    theme: '#18a058',
    lang: navigator.language.startsWith('zh') ? 'zh-cn' : 'en',
    moreVideoAttr: {
      crossOrigin: 'anonymous',
    },
  })
}

function pickSubtitleFile() {
  subtitleInputRef.value?.click()
}

function handleSubtitleSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !art) return

  subtitleName.value = file.name
  const url = URL.createObjectURL(file)

  // Determine subtitle type
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  let type = 'srt'
  if (ext === 'vtt') type = 'vtt'
  else if (ext === 'ass' || ext === 'ssa') type = 'ass'

  art.subtitle.switch(url, { type: type as 'srt' | 'vtt' | 'ass' })

  // Reset input
  input.value = ''
}

function clearSubtitle() {
  if (!art) return
  subtitleName.value = ''
  art.subtitle.show = false
}

onMounted(() => {
  initPlayer()
})

onUnmounted(() => {
  if (art) {
    art.destroy(false)
    art = null
  }
})
</script>

<style scoped>
.video-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.artplayer-container {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.video-controls-extra {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: var(--n-color);
  border-top: 1px solid var(--n-border-color);
  flex-shrink: 0;
}

.control-label {
  font-size: 13px;
  color: var(--n-text-color-2);
}
</style>
