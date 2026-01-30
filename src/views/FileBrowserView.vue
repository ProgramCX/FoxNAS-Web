<template>
  <div class="file-browser">
    <n-card class="browser-card">
      <template #header>
        <div class="browser-header">
          <n-breadcrumb>
            <n-breadcrumb-item @click="navigateTo('/files')">
              <n-icon><FolderOutline /></n-icon>
            </n-breadcrumb-item>
            <n-breadcrumb-item
              v-for="(item, index) in pathBreadcrumbs"
              :key="index"
              @click="navigateToPath(index)"
            >
              {{ item.name }}
            </n-breadcrumb-item>
          </n-breadcrumb>
        </div>
      </template>
      <template #header-extra>
        <n-space>
          <n-button @click="goUp" :disabled="currentPath === '/'">
            <template #icon><n-icon><ArrowUpOutline /></n-icon></template>
          </n-button>
          <n-button type="primary" @click="refreshFiles" :loading="loading">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
          </n-button>
        </n-space>
      </template>

      <n-spin :show="loading">
        <div class="file-grid">
          <div
            v-for="file in fileList"
            :key="file.path"
            class="file-item"
            :class="{ directory: file.type === 'directory' }"
            @click="handleFileClick(file)"
            @dblclick="handleFileDoubleClick(file)"
          >
            <div class="file-icon">
              <n-icon size="40" :color="getFileIconColor(file)">
                <component :is="getFileIcon(file)" />
              </n-icon>
            </div>
            <div class="file-info">
              <span class="file-name" :title="file.name">{{ file.name }}</span>
              <span class="file-size" v-if="file.type === 'file'">{{ formatBytes(file.size) }}</span>
            </div>
          </div>
        </div>
        <n-empty v-if="!loading && fileList.length === 0" description="该文件夹为空" />
      </n-spin>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { fileService } from '@/api/services/file'
import type { FileInfo } from '@/types'
import {
  FolderOutline,
  DocumentOutline,
  ImageOutline,
  VideocamOutline,
  MusicalNotesOutline,
  RefreshOutline,
  ArrowUpOutline,
} from '@vicons/ionicons5'

const route = useRoute()
const router = useRouter()
const message = useMessage()

// 状态
const loading = ref(false)
const fileList = ref<FileInfo[]>([])
const currentPath = computed(() => {
  const path = route.params.path as string
  return path ? '/' + path : '/'
})

// 面包屑
const pathBreadcrumbs = computed(() => {
  const path = currentPath.value
  if (!path || path === '/') return []
  const parts = path.split('/').filter(Boolean)
  let accPath = ''
  return parts.map((name) => {
    accPath += '/' + name
    return { name, path: accPath }
  })
})

// 获取文件列表
async function fetchFiles(path: string) {
  loading.value = true
  try {
    const response = await fileService.getFileList(path)
    fileList.value = response.list || []
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '获取文件列表失败')
  } finally {
    loading.value = false
  }
}

// 刷新
function refreshFiles() {
  fetchFiles(currentPath.value)
}

// 返回上级
function goUp() {
  const parts = currentPath.value.split('/').filter(Boolean)
  if (parts.length > 0) {
    parts.pop()
    const newPath = parts.length > 0 ? '/' + parts.join('/') : '/'
    navigateTo(newPath)
  }
}

// 导航
function navigateTo(path: string) {
  router.push('/files' + (path === '/' ? '' : path.replace(/^\//, '')))
}

function navigateToPath(index: number) {
  const parts = currentPath.value.split('/').filter(Boolean)
  const targetPath = '/' + parts.slice(0, index + 1).join('/')
  navigateTo(targetPath)
}

// 点击文件
function handleFileClick(file: FileInfo) {
  // 选中逻辑
}

// 双击文件
function handleFileDoubleClick(file: FileInfo) {
  if (file.type === 'directory') {
    navigateTo(file.path)
  } else {
    // 打开文件
    window.open(fileService.getDownloadUrl(file.path), '_blank')
  }
}

// 获取文件图标
function getFileIcon(file: FileInfo) {
  if (file.type === 'directory') return FolderOutline
  
  const name = file.name.toLowerCase()
  if (name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) return ImageOutline
  if (name.match(/\.(mp4|avi|mkv|mov|wmv)$/)) return VideocamOutline
  if (name.match(/\.(mp3|wav|flac|aac)$/)) return MusicalNotesOutline
  return DocumentOutline
}

// 获取图标颜色
function getFileIconColor(file: FileInfo) {
  if (file.type === 'directory') return '#18a058'
  
  const name = file.name.toLowerCase()
  if (name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) return '#2080f0'
  if (name.match(/\.(mp4|avi|mkv|mov|wmv)$/)) return '#f0a020'
  if (name.match(/\.(mp3|wav|flac|aac)$/)) return '#d03050'
  return '#606266'
}

// 格式化字节
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 监听路由变化
watch(
  () => route.params.path,
  () => {
    fetchFiles(currentPath.value)
  },
  { immediate: true }
)
</script>

<style scoped lang="css">
.file-browser {
  height: 100%;
}

.browser-card {
  height: 100%;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.browser-card :deep(.n-card__content) {
  flex: 1;
  overflow: auto;
}

.browser-header {
  display: flex;
  align-items: center;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  padding: 16px;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-item:hover {
  background-color: var(--bg-color-secondary);
}

.file-item.directory:hover {
  background-color: rgba(24, 160, 88, 0.1);
}

.file-icon {
  margin-bottom: 8px;
}

.file-info {
  text-align: center;
  width: 100%;
}

.file-name {
  display: block;
  font-size: 14px;
  color: var(--text-color-base);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  display: block;
  font-size: 12px;
  color: var(--text-color-tertiary);
  margin-top: 4px;
}
</style>
