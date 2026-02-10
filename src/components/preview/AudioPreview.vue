<template>
  <div class="audio-preview">
    <!-- 封面区域 -->
    <div class="audio-cover-area">
      <div class="audio-disc" :class="{ spinning: isPlaying }">
        <div class="disc-inner">
          <n-icon size="48" color="var(--n-text-color-3)"><MusicalNotesOutline /></n-icon>
        </div>
      </div>
      <div class="audio-info">
        <h3 class="audio-title">{{ fileName }}</h3>
        <p class="audio-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</p>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="audio-progress-area">
      <div class="progress-bar-container" ref="progressBarRef" @click="seekTo">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
          <div class="progress-bar-handle" :style="{ left: progressPercent + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="audio-controls">
      <n-button quaternary circle @click="togglePlay" size="large">
        <template #icon>
          <n-icon size="32">
            <PlayOutline v-if="!isPlaying" />
            <PauseOutline v-else />
          </n-icon>
        </template>
      </n-button>
      <div class="volume-control">
        <n-button quaternary circle size="small" @click="toggleMute">
          <template #icon>
            <n-icon>
              <VolumeHighOutline v-if="volume > 0.5" />
              <VolumeLowOutline v-else-if="volume > 0" />
              <VolumeMuteOutline v-else />
            </n-icon>
          </template>
        </n-button>
        <n-slider
          :value="volume * 100"
          :min="0"
          :max="100"
          :step="1"
          style="width: 100px"
          @update:value="(v: number) => setVolume(v / 100)"
        />
      </div>
      <n-button size="small" quaternary @click="pickLrcFile">
        <template #icon><n-icon><DocumentTextOutline /></n-icon></template>
        {{ lrcName || t('preview.selectLyrics') }}
      </n-button>
      <n-button v-if="lrcName" size="small" quaternary @click="clearLrc">
        {{ t('preview.clearLyrics') }}
      </n-button>
    </div>

    <!-- 歌词显示 -->
    <div
      class="lyrics-area"
      ref="lyricsContainerRef"
      v-if="parsedLyrics.length > 0"
      @scroll="onUserScroll"
      @wheel="onUserWheel"
      @touchstart="onUserTouch"
    >
      <div class="lyrics-scroll">
        <div class="lyrics-spacer"></div>
        <p
          v-for="(line, index) in parsedLyrics"
          :key="index"
          class="lyric-line"
          :class="{ active: index === currentLyricIndex }"
          :data-lyric-index="index"
        >
          {{ line.text }}
        </p>
        <div class="lyrics-spacer"></div>
      </div>
    </div>
    <div class="lyrics-area lyrics-empty" v-else>
      <p class="no-lyrics">{{ t('preview.noLyrics') }}</p>
    </div>

    <!-- 隐藏文件输入 -->
    <input
      ref="lrcInputRef"
      type="file"
      accept=".lrc,.txt"
      style="display: none"
      @change="handleLrcSelect"
    />

    <!-- 隐藏 audio 元素 -->
    <audio
      ref="audioRef"
      :src="src"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
      @play="isPlaying = true"
      @pause="isPlaying = false"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  MusicalNotesOutline, PlayOutline, PauseOutline,
  VolumeHighOutline, VolumeLowOutline, VolumeMuteOutline,
  DocumentTextOutline
} from '@vicons/ionicons5'
import { apiConfig, apiEndpoints } from '@/api/config'

const { t } = useI18n()

const props = defineProps<{
  src: string
  fileName: string
  filePath?: string
}>()

const audioRef = ref<HTMLAudioElement>()
const progressBarRef = ref<HTMLElement>()
const lrcInputRef = ref<HTMLInputElement>()
const lyricsContainerRef = ref<HTMLElement>()

const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.7)
const lrcName = ref('')

// 手动滚动控制：用户滚动后暂停自动滚动，一段时间后恢复
const userScrolling = ref(false)
let userScrollTimer: ReturnType<typeof setTimeout> | null = null
const USER_SCROLL_RESUME_DELAY = 3000 // 用户手动滚动后 3 秒恢复自动滚动

interface LyricLine {
  time: number
  text: string
}

const parsedLyrics = ref<LyricLine[]>([])
const currentLyricIndex = ref(-1)

const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

function togglePlay() {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
}

function toggleMute() {
  if (volume.value > 0) {
    setVolume(0)
  } else {
    setVolume(0.7)
  }
}

function setVolume(v: number) {
  volume.value = v
  if (audioRef.value) {
    audioRef.value.volume = v
  }
}

function seekTo(e: MouseEvent) {
  if (!progressBarRef.value || !audioRef.value) return
  const rect = progressBarRef.value.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  audioRef.value.currentTime = ratio * duration.value
}

function onTimeUpdate() {
  if (!audioRef.value) return
  currentTime.value = audioRef.value.currentTime
  updateCurrentLyric()
}

function onLoadedMetadata() {
  if (!audioRef.value) return
  duration.value = audioRef.value.duration
}

function onEnded() {
  isPlaying.value = false
}

// --- 歌词滚动逻辑 ---

/** 标记用户正在手动滚动，暂停自动滚动 */
function markUserScrolling() {
  userScrolling.value = true
  if (userScrollTimer) clearTimeout(userScrollTimer)
  userScrollTimer = setTimeout(() => {
    userScrolling.value = false
  }, USER_SCROLL_RESUME_DELAY)
}

function onUserWheel() {
  markUserScrolling()
}

function onUserTouch() {
  markUserScrolling()
}

// 区分程序滚动和用户滚动
let programmaticScroll = false
function onUserScroll() {
  if (programmaticScroll) return
  // 不在此处标记，wheel/touch 已处理
}

function updateCurrentLyric() {
  if (parsedLyrics.value.length === 0) return
  const time = currentTime.value

  let idx = -1
  for (let i = parsedLyrics.value.length - 1; i >= 0; i--) {
    const lyric = parsedLyrics.value[i]
    if (lyric && lyric.time <= time) {
      idx = i
      break
    }
  }

  if (idx !== currentLyricIndex.value) {
    currentLyricIndex.value = idx
    nextTick(() => {
      scrollToActiveLyric()
    })
  }
}

function scrollToActiveLyric() {
  if (userScrolling.value) return
  const container = lyricsContainerRef.value
  if (!container) return

  const activeEl = container.querySelector('.lyric-line.active') as HTMLElement
  if (!activeEl) return

  // 计算元素相对于滚动容器的实际位置
  const containerRect = container.getBoundingClientRect()
  const activeRect = activeEl.getBoundingClientRect()
  const currentScrollTop = container.scrollTop
  // 目标：将当前歌词行滚动到容器垂直中心
  const scrollTarget = currentScrollTop + (activeRect.top - containerRect.top) - (container.clientHeight / 2) + (activeEl.clientHeight / 2)

  programmaticScroll = true
  container.scrollTo({
    top: Math.max(0, scrollTarget),
    behavior: 'smooth'
  })
  // 平滑滚动完成后重置标记
  setTimeout(() => {
    programmaticScroll = false
  }, 500)
}

// --- LRC 自动加载 ---

async function tryAutoLoadLrc() {
  if (!props.filePath) return

  try {
    // 将音频文件路径的扩展名替换为 .lrc
    const lrcPath = props.filePath.replace(/\.[^.]+$/, '.lrc')

    const authToken = localStorage.getItem(apiConfig.tokenKey) || ''
    const url = `${apiConfig.baseURL}${apiEndpoints.file.operation.get}?path=${encodeURIComponent(lrcPath)}&inline=true`
    const response = await fetch(url, {
      headers: { Authorization: authToken ? `Bearer ${authToken}` : '' },
    })

    if (!response.ok) return // 没找到 LRC 文件，静默忽略

    const content = await response.text()
    const lyrics = parseLrc(content)
    if (lyrics.length > 0) {
      parsedLyrics.value = lyrics
      currentLyricIndex.value = -1
      // 提取 lrc 文件名
      const parts = lrcPath.replace(/\\/g, '/').split('/')
      lrcName.value = parts[parts.length - 1] || 'lyrics.lrc'
    }
  } catch {
    // 静默失败，不影响播放体验
  }
}

function pickLrcFile() {
  lrcInputRef.value?.click()
}

function handleLrcSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  lrcName.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    const content = reader.result as string
    parsedLyrics.value = parseLrc(content)
    currentLyricIndex.value = -1
  }
  reader.readAsText(file)
  input.value = ''
}

function clearLrc() {
  lrcName.value = ''
  parsedLyrics.value = []
  currentLyricIndex.value = -1
}

function parseLrc(content: string): LyricLine[] {
  const lines = content.split('\n')
  const result: LyricLine[] = []
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)]
    if (matches.length === 0) continue

    const text = line.replace(timeRegex, '').trim()
    if (!text) continue

    for (const match of matches) {
      const minutes = parseInt(match[1] || '0')
      const seconds = parseInt(match[2] || '0')
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0')) : 0
      const time = minutes * 60 + seconds + ms / 1000
      result.push({ time, text })
    }
  }

  result.sort((a, b) => a.time - b.time)
  return result
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

onMounted(() => {
  tryAutoLoadLrc()
})

onUnmounted(() => {
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.src = ''
  }
  if (userScrollTimer) clearTimeout(userScrollTimer)
})
</script>

<style scoped>
.audio-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 24px;
  box-sizing: border-box;
  overflow: hidden;
}

.audio-cover-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  flex-shrink: 0;
}

.audio-disc {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2a2a2a, #404040);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.audio-disc.spinning {
  animation: spin 4s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.disc-inner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--n-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-info {
  text-align: center;
}

.audio-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--n-text-color);
  word-break: break-all;
}

.audio-time {
  font-size: 13px;
  color: var(--n-text-color-3);
  margin: 0;
}

.audio-progress-area {
  padding: 0 20px 16px;
  flex-shrink: 0;
}

.progress-bar-container {
  cursor: pointer;
  padding: 8px 0;
}

.progress-bar-bg {
  height: 4px;
  border-radius: 2px;
  background: var(--n-border-color);
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #18a058, #36ad6a);
  transition: width 0.1s linear;
}

.progress-bar-handle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #18a058;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  transition: left 0.1s linear;
}

.audio-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 0 20px 16px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.lyrics-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  border-top: 1px solid var(--n-border-color);
}

.lyrics-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-lyrics {
  color: var(--n-text-color-3);
  font-size: 14px;
}

.lyrics-scroll {
  text-align: center;
  box-sizing: border-box;
  padding: 0 16px;
}

/* 上下留白，使第一行和最后一行歌词能滚动到容器中部 */
.lyrics-spacer {
  height: 40vh;
}

.lyric-line {
  font-size: 15px;
  color: var(--n-text-color-3);
  line-height: 2.4;
  transition: color 0.3s ease, font-size 0.3s ease, font-weight 0.3s ease;
  padding: 0;
  margin: 0;
  word-break: break-word;
  overflow-wrap: break-word;
}

.lyric-line.active {
  font-size: 17px;
  font-weight: 600;
  color: #18a058;
}
</style>
