<template>
  <div class="file-selector">
    <!-- 触发按钮 -->
    <n-button size="small" @click="showModal = true" :disabled="disabled">
      <template #icon>
        <n-icon><FolderOpenOutline /></n-icon>
      </template>
      {{ buttonLabel || t('fileSelector.browse') }}
    </n-button>

    <!-- 文件选择模态框 -->
    <n-modal
      v-model:show="showModal"
      preset="card"
      :title="title || t('fileSelector.title')"
      style="width: 600px; max-width: 90vw;"
      :mask-closable="true"
      :close-on-esc="true"
    >
      <!-- 当前路径导航 -->
      <div class="file-selector-nav">
        <n-breadcrumb>
          <n-breadcrumb-item @click="navigateTo('')">
            <n-icon><HomeOutline /></n-icon>
          </n-breadcrumb-item>
          <n-breadcrumb-item
            v-for="(seg, idx) in pathSegments"
            :key="idx"
            @click="navigateTo(pathSegments.slice(0, idx + 1).join('/'))"
          >
            {{ seg }}
          </n-breadcrumb-item>
        </n-breadcrumb>
      </div>

      <!-- 搜索过滤 -->
      <n-input
        v-model:value="filterText"
        :placeholder="t('fileSelector.filterPlaceholder')"
        clearable
        size="small"
        style="margin-bottom: 8px;"
      >
        <template #prefix>
          <n-icon><SearchOutline /></n-icon>
        </template>
      </n-input>

      <!-- 文件列表 -->
      <n-spin :show="loading">
        <div class="file-list-container">
          <!-- 返回上级目录 -->
          <div
            v-if="currentPath"
            class="file-list-item file-list-item-dir"
            @click="goUp"
          >
            <n-icon size="18" color="#e8a735"><ArrowUpOutline /></n-icon>
            <span class="file-item-name">..</span>
          </div>

          <!-- 目录列表 -->
          <div
            v-for="dir in filteredDirs"
            :key="dir.path"
            class="file-list-item file-list-item-dir"
            @click="navigateTo(dir.path)"
          >
            <n-icon size="18" color="#e8a735"><FolderOutline /></n-icon>
            <span class="file-item-name">{{ dir.name }}</span>
          </div>

          <!-- 文件列表（已过滤后缀名） -->
          <div
            v-for="file in filteredFiles"
            :key="file.path"
            class="file-list-item file-list-item-file"
            :class="{ selected: selectedFilePath === file.path }"
            @click="selectFile(file)"
          >
            <n-icon size="18" color="#18a058"><DocumentTextOutline /></n-icon>
            <span class="file-item-name">{{ file.name }}</span>
            <span class="file-item-size">{{ formatFileSize(file.size) }}</span>
          </div>

          <!-- 空状态 -->
          <div v-if="!loading && filteredDirs.length === 0 && filteredFiles.length === 0" class="file-list-empty">
            <n-empty :description="t('fileSelector.noFiles')" size="small" />
          </div>
        </div>
      </n-spin>

      <!-- 已选文件 -->
      <div v-if="selectedFilePath" class="file-selector-selected">
        <n-tag type="success" closable @close="clearSelection" size="small">
          {{ selectedFileName }}
        </n-tag>
      </div>

      <template #action>
        <n-space justify="end">
          <n-button @click="showModal = false">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" @click="confirmSelection" :disabled="!selectedFilePath">
            {{ t('common.confirm') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  FolderOpenOutline,
  FolderOutline,
  HomeOutline,
  SearchOutline,
  ArrowUpOutline,
  DocumentTextOutline,
} from '@vicons/ionicons5'
import { fileService } from '@/api/services/file'
import type { FileInfo } from '@/types'

const props = defineProps<{
  /** 允许的文件后缀名列表，如 ['.ass', '.ssa'] */
  extensions?: string[]
  /** 按钮文本 */
  buttonLabel?: string
  /** 模态框标题 */
  title?: string
  /** 初始路径 */
  initialPath?: string
  /** 是否禁用 */
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [file: { name: string; path: string; size: number }]
}>()

const { t } = useI18n()

const showModal = ref(false)
const loading = ref(false)
const currentPath = ref('')
const allFiles = ref<FileInfo[]>([])
const allDirs = ref<FileInfo[]>([])
const selectedFilePath = ref('')
const selectedFileName = ref('')
const filterText = ref('')

const pathSegments = computed(() => {
  if (!currentPath.value) return []
  return currentPath.value.split('/').filter(Boolean)
})

const filteredDirs = computed(() => {
  if (!filterText.value) return allDirs.value
  const keyword = filterText.value.toLowerCase()
  return allDirs.value.filter(d => d.name.toLowerCase().includes(keyword))
})

const filteredFiles = computed(() => {
  let files = allFiles.value

  // 按后缀名过滤
  if (props.extensions && props.extensions.length > 0) {
    const exts = props.extensions.map(e => e.toLowerCase())
    files = files.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return exts.includes(ext)
    })
  }

  // 按搜索文本过滤
  if (filterText.value) {
    const keyword = filterText.value.toLowerCase()
    files = files.filter(f => f.name.toLowerCase().includes(keyword))
  }

  return files
})

// 打开弹窗时加载初始路径
watch(showModal, (val) => {
  if (val) {
    currentPath.value = props.initialPath || ''
    selectedFilePath.value = ''
    selectedFileName.value = ''
    filterText.value = ''
    loadDirectory(currentPath.value)
  }
})

async function loadDirectory(path: string) {
  loading.value = true
  try {
    const result = await fileService.getFileList(path, 1, 1000, 'name', 'asc')
    const items = result.list || result.records || result.content || []
    allDirs.value = items.filter(f => f.type === 'directory')
    allFiles.value = items.filter(f => f.type !== 'directory')
  } catch (error) {
    console.error('Failed to load directory:', error)
    allDirs.value = []
    allFiles.value = []
  } finally {
    loading.value = false
  }
}

function navigateTo(path: string) {
  currentPath.value = path
  filterText.value = ''
  loadDirectory(path)
}

function goUp() {
  const parts = currentPath.value.split('/').filter(Boolean)
  parts.pop()
  navigateTo(parts.join('/'))
}

function selectFile(file: FileInfo) {
  selectedFilePath.value = file.path
  selectedFileName.value = file.name
}

function clearSelection() {
  selectedFilePath.value = ''
  selectedFileName.value = ''
}

function confirmSelection() {
  if (selectedFilePath.value) {
    const file = allFiles.value.find(f => f.path === selectedFilePath.value)
    emit('select', {
      name: selectedFileName.value,
      path: selectedFilePath.value,
      size: file?.size || 0,
    })
    showModal.value = false
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<style scoped>
.file-selector {
  display: inline-flex;
}

.file-selector-nav {
  margin-bottom: 8px;
  padding: 4px 0;
}

.file-selector-nav :deep(.n-breadcrumb-item) {
  cursor: pointer;
}

.file-list-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
}

.file-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
  border-bottom: 1px solid var(--n-border-color);
}

.file-list-item:last-child {
  border-bottom: none;
}

.file-list-item:hover {
  background-color: var(--n-color-hover, rgba(24, 160, 88, 0.08));
}

.file-list-item.selected {
  background-color: rgba(24, 160, 88, 0.15);
}

.file-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.file-item-size {
  color: var(--n-text-color-3);
  font-size: 12px;
  flex-shrink: 0;
}

.file-list-empty {
  padding: 24px;
}

.file-selector-selected {
  margin-top: 8px;
}
</style>
