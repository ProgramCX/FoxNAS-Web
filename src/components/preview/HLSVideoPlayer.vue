<template>
  <div class="hls-video-player" ref="containerRef">
    <div ref="playerRef" class="artplayer-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Artplayer from 'artplayer'
import Hls from 'hls.js'
import { mediaService } from '@/api/services/media'

const props = defineProps<{
  jobId: string
  fileName: string
  subtitleUrl?: string
}>()

const playerRef = ref<HTMLElement>()
const containerRef = ref<HTMLElement>()
let art: Artplayer | null = null
let hls: Hls | null = null

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
    art.subtitle.switch(url, { name: 'subtitle' })
  }
})

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
    title: props.fileName,
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

    // 可选：检测 H.265 编码并提示
    hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
      const level = data.levels[0]
      if (level?.videoCodec?.includes('hev1') || level?.videoCodec?.includes('hvc1')) {
        console.warn('[HLSVideoPlayer] H.265/HEVC detected, may not play on some browsers')
      }
    })
  } 
  // 回退：hls.js 不支持时使用原生 HLS（旧版 Safari）
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
}

.artplayer-container {
  width: 100%;
  height: 100%;
}
</style>