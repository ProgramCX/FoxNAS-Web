<template>
  <div class="media-player">
    <n-card class="player-card">
      <template #header>
        <div class="player-header">
          <span class="file-name">{{ fileName }}</span>
        </div>
      </template>
      <template #header-extra>
        <n-button @click="router.back()">
          <template #icon><n-icon><ArrowBackOutline /></n-icon></template>
          返回
        </n-button>
      </template>

      <div class="player-container">
        <video
          v-if="mediaType === 'video'"
          ref="videoRef"
          class="video-player"
          controls
          :src="videoUrl"
          @loadedmetadata="onLoadedMetadata"
          @error="onError"
        >
          您的浏览器不支持视频播放
        </video>
        
        <div v-else-if="mediaType === 'audio'" class="audio-player">
          <div class="audio-icon">
            <n-icon size="120" color="#18a058">
              <MusicalNotesOutline />
            </n-icon>
          </div>
          <audio ref="audioRef" controls :src="audioUrl" @loadedmetadata="onLoadedMetadata" @error="onError">
            您的浏览器不支持音频播放
          </audio>
        </div>

        <div v-else class="unsupported">
          <n-empty description="不支持该类型的媒体文件">
            <template #extra>
              <n-button type="primary" @click="downloadFile">
                <template #icon><n-icon><DownloadOutline /></n-icon></template>
                下载文件
              </n-button>
            </template>
          </n-empty>
        </div>
      </div>

      <template #footer>
        <div class="player-info">
          <n-descriptions :column="1" label-placement="left">
            <n-descriptions-item label="文件大小">
              {{ formatBytes(fileSize) }}
            </n-descriptions-item>
            <n-descriptions-item label="时长" v-if="duration">
              {{ formatDuration(duration) }}
            </n-descriptions-item>
          </n-descriptions>
        </div>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { fileService } from '@/api/services/file'
import {
  ArrowBackOutline,
  MusicalNotesOutline,
  DownloadOutline,
} from '@vicons/ionicons5'

const route = useRoute()
const router = useRouter()
const message = useMessage()

// 状态
const videoRef = ref<HTMLVideoElement | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)
const mediaType = ref<'video' | 'audio' | 'image' | 'other'>('other')
const duration = ref(0)
const loading = ref(false)

// 从路由获取文件路径
const filePath = computed(() => {
  const path = route.params.path as string
  return path ? '/' + path : ''
})

const fileName = computed(() => {
  const parts = filePath.value.split('/')
  return parts[parts.length - 1] || '未知文件'
})

const fileSize = ref(0)

// 视频/音频URL
const videoUrl = computed(() => filePath.value ? fileService.getDownloadUrl(filePath.value) : '')
const audioUrl = computed(() => filePath.value ? fileService.getDownloadUrl(filePath.value) : '')

// 获取媒体类型
async function checkMediaType() {
  if (!filePath.value) return
  
  loading.value = true
  try {
    const type = await fileService.getMediaType(filePath.value)
    const lowerType = type.toLowerCase()
    
    if (lowerType.startsWith('video')) {
      mediaType.value = 'video'
    } else if (lowerType.startsWith('audio')) {
      mediaType.value = 'audio'
    } else if (lowerType.startsWith('image')) {
      mediaType.value = 'image'
    } else {
      mediaType.value = 'other'
    }
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '获取媒体类型失败')
    mediaType.value = 'other'
  } finally {
    loading.value = false
  }
}

// 元数据加载完成
function onLoadedMetadata() {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
  } else if (audioRef.value) {
    duration.value = audioRef.value?.duration || 0
  }
}

// 播放错误
function onError() {
  message.error('媒体加载失败，请尝试下载文件')
}

// 下载文件
function downloadFile() {
  if (filePath.value) {
    fileService.downloadFile(filePath.value, fileName.value)
  }
}

// 格式化字节
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化时长
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 生命周期
onMounted(() => {
  checkMediaType()
})
</script>

<style scoped lang="css">
.media-player {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.player-card {
  max-width: 900px;
  width: 100%;
  border-radius: 12px;
}

.player-header {
  display: flex;
  align-items: center;
}

.file-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color-base);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  max-height: 500px;
}

.audio-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 48px;
}

.audio-player audio {
  width: 100%;
  max-width: 400px;
}

.unsupported {
  padding: 48px;
}

.player-info {
  padding-top: 16px;
  border-top: 1px solid var(--border-color-light);
}
</style>
