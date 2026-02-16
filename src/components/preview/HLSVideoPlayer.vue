<template>
  <div class="hls-video-player">
    <div ref="playerRef" class="artplayer-container">
      <!-- ASS 字幕渲染层（会在初始化后挂载到 Artplayer 内部播放器容器） -->
      <div ref="assContainerRef" class="ass-container"></div>
    </div>

    <!-- 字幕选择器 -->
    <SubtitleSelector
      v-if="videoPath"
      :video-path="videoPath"
      :video-name="fileName"
      @change="handleSubtitleChange"
      @default-found="handleDefaultSubtitleFound"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Artplayer from 'artplayer'
import Hls from 'hls.js'
import ASS from 'assjs'
import { mediaService } from '@/api/services/media'
import { subtitleService } from '@/api/services/subtitle'
import SubtitleSelector from '@/components/subtitle/SubtitleSelector.vue'

const props = defineProps<{
  jobId: string
  fileName: string
  subtitleUrl?: string
  /** 原始视频文件路径（用于字幕查找） */
  videoPath?: string
}>()

const playerRef = ref<HTMLDivElement>()
const assContainerRef = ref<HTMLElement>()
let art: Artplayer | null = null
let hls: Hls | null = null
let assInstance: ASS | null = null
let currentAssSubtitleText = ''

onMounted(() => {
  nextTick(() => {
    initPlayer()
  })
})

onUnmounted(() => {
  destroyPlayer()
})

watch(() => props.subtitleUrl, (url) => {
  if (art && url) {
    // 如果传入的是 VTT 字幕 URL（内嵌字幕提取），使用 Artplayer 内置字幕
    art.subtitle.switch(url, { name: 'subtitle' })
  }
})

/**
 * 处理 SubtitleSelector 的字幕变更
 */
async function handleSubtitleChange(subtitlePath: string) {
  if (!subtitlePath) {
    currentAssSubtitleText = ''
    destroyASS()
    return
  }
  await loadASSSubtitle(subtitlePath)
}

/**
 * 处理默认字幕被找到
 */
async function handleDefaultSubtitleFound(subtitlePath: string) {
  await loadASSSubtitle(subtitlePath)
}

/**
 * 加载 ASS 字幕
 */
async function loadASSSubtitle(subtitlePath: string) {
  if (!art) return

  try {
    // 获取字幕文件内容
    const content = await subtitleService.getSubtitleContent(subtitlePath)
    if (!content) return
    currentAssSubtitleText = content

    renderASSSubtitle(content)

    console.log('[HLSVideoPlayer] ASS subtitle loaded:', subtitlePath)
  } catch (error) {
    console.error('[HLSVideoPlayer] Failed to load ASS subtitle:', error)
  }
}

/**
 * 获取 ASS 覆盖层应挂载的容器（跟随 Artplayer 全屏容器）
 */
function getASSMountContainer(): HTMLElement | null {
  if (!art) return null
  const template = art.template as unknown as {
    $player?: HTMLElement
    $container?: HTMLElement
  }
  return template.$player || template.$container || playerRef.value || null
}

/**
 * 将 ASS 覆盖层挂载到当前播放器容器中
 */
function ensureASSContainerMounted() {
  const mountContainer = getASSMountContainer()
  const assContainer = assContainerRef.value
  if (!mountContainer || !assContainer) return

  if (assContainer.parentElement !== mountContainer) {
    mountContainer.appendChild(assContainer)
  }
}

/**
 * 使用已获取的字幕文本进行渲染
 */
function renderASSSubtitle(content: string) {
  if (!art) return

  // 先销毁旧实例
  destroyASS()

  ensureASSContainerMounted()

    const video = art.template.$video
    if (!video || !assContainerRef.value) return

    // 创建 ASS 实例
    assInstance = new ASS(content, video, {
      container: assContainerRef.value,
      resampling: 'video_width',
    })
}

/**
 * 在全屏状态变更后重新挂载并重绘 ASS 字幕
 */
function rerenderCurrentASSSubtitle() {
  if (!currentAssSubtitleText) return
  nextTick(() => {
    renderASSSubtitle(currentAssSubtitleText)
  })
}

/**
 * 销毁 ASS 字幕实例
 */
function destroyASS() {
  if (assInstance) {
    assInstance.destroy()
    assInstance = null
  }
}

function initPlayer() {
  if (!playerRef.value) return

  const hlsUrl = mediaService.getHlsPlaylistUrl(props.jobId)
  console.log('[HLSVideoPlayer] HLS URL:', hlsUrl)
  const lang = navigator.language?.startsWith('zh') ? 'zh-cn' : 'en'

  art = new Artplayer({
    container: playerRef.value,
    url: hlsUrl,
    type: 'm3u8',
    customType: {
      m3u8: (video: HTMLVideoElement, url: string) => {
        playM3U8(video, url)
      },
    },
    theme: '#18a058',
    lang,
    volume: 0.7,
    autoplay: false,
    pip: true,
    screenshot: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    subtitleOffset: true,
    setting: true,
    hotkey: true,
    airplay: true,
    ...(props.subtitleUrl
      ? {
          subtitle: {
            url: props.subtitleUrl,
            type: 'vtt',
            style: {
              color: '#fff',
              fontSize: '22px',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            },
          },
        }
      : {}),
  })

  art.on('error', (error) => {
    console.error('[HLSVideoPlayer] Artplayer error:', error)
  })

  // 确保 ASS 覆盖层在播放器容器内
  ensureASSContainerMounted()

  // 全屏变化时调整 ASS 字幕容器
  art.on('fullscreen', () => {
    rerenderCurrentASSSubtitle()
  })
  art.on('fullscreenWeb', () => {
    rerenderCurrentASSSubtitle()
  })
}

function playM3U8(video: HTMLVideoElement, url: string) {
  // 优先使用 hls.js（更好地控制解码，避免 H.265 等编码兼容问题）
  if (Hls.isSupported()) {
    destroyHls()

    hls = new Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      startLevel: -1, // 自动选择质量
      enableWorker: true,
      fragLoadingMaxRetry: 5,
      manifestLoadingMaxRetry: 3,
      levelLoadingMaxRetry: 3,
    })

    hls.loadSource(url)
    hls.attachMedia(video)

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error('[HLSVideoPlayer] Network error, trying to recover...')
            hls?.startLoad()
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error('[HLSVideoPlayer] Media error, trying to recover...')
            hls?.recoverMediaError()
            break
          default:
            console.error('[HLSVideoPlayer] Fatal error:', data)
            destroyHls()
            break
        }
      }
    })

    hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
      const level = data.levels[0]
      if (level?.videoCodec?.includes('hev1') || level?.videoCodec?.includes('hvc1')) {
        console.warn('[HLSVideoPlayer] H.265/HEVC detected, may not play on some browsers')
      }
    })
  } 
  // 回退
  else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    console.log('[HLSVideoPlayer] Fallback to native HLS')
    video.src = url
  } 
  else {
    console.error('[HLSVideoPlayer] HLS is not supported in this browser')
  }
}

function destroyHls() {
  if (hls) {
    hls.destroy()
    hls = null
  }
}

function destroyPlayer() {
  destroyASS()
  destroyHls()
  if (art) {
    art.destroy(false)
    art = null
  }
}
</script>

<style scoped>
.hls-video-player {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.artplayer-container {
  width: 100%;
  flex: 1;
  min-height: 0;
  position: relative;
}

.ass-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 30;
}
</style>