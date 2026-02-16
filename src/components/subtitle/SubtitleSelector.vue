<template>
  <div class="subtitle-selector">
    <n-space align="center" :size="8" :wrap="false">
      <n-icon size="16"><TextOutline /></n-icon>
      <span class="subtitle-label">{{ t('subtitle.label') }}:</span>

      <!-- 字幕下拉列表 -->
      <n-select
        v-model:value="selectedSubtitlePath"
        :options="subtitleOptions"
        :placeholder="t('subtitle.selectPlaceholder')"
        size="small"
        clearable
        filterable
        style="min-width: 200px; max-width: 350px;"
        :loading="loadingSubtitles"
        @update:value="handleSubtitleChange"
      />

      <!-- 自定义选择按钮（从服务器文件系统选择） -->
      <FileSelector
        :extensions="['.ass', '.ssa']"
        :button-label="t('subtitle.browseServer')"
        :title="t('subtitle.browseServerTitle')"
        :initial-path="directoryPath"
        @select="handleFileSelectorSelect"
      />

      <!-- 清除字幕按钮 -->
      <n-button
        v-if="selectedSubtitlePath"
        size="small"
        quaternary
        @click="clearSubtitle"
      >
        {{ t('subtitle.clear') }}
      </n-button>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { TextOutline } from '@vicons/ionicons5'
import { subtitleService } from '@/api/services/subtitle'
import FileSelector from '@/components/FileSelector.vue'
import type { SubtitleFileInfo } from '@/types'

const props = defineProps<{
  /** 视频文件路径（用于查找同名字幕和确定目录） */
  videoPath: string
  /** 当前视频文件名 */
  videoName: string
}>()

const emit = defineEmits<{
  /** 字幕变更事件，path 为空表示清除字幕 */
  change: [subtitlePath: string]
  /** 检测到默认同名字幕 */
  defaultFound: [subtitlePath: string]
}>()

const { t } = useI18n()

const loadingSubtitles = ref(false)
const subtitleFiles = ref<SubtitleFileInfo[]>([])
const selectedSubtitlePath = ref<string | null>(null)
const defaultSubtitlePath = ref<string | null>(null)

/** 从视频路径中提取目录路径 */
const directoryPath = computed(() => {
  if (!props.videoPath) return ''
  const normalized = props.videoPath.replace(/\\/g, '/')
  const lastSlash = normalized.lastIndexOf('/')
  return lastSlash > 0 ? normalized.substring(0, lastSlash) : ''
})

/** 字幕选项列表 */
const subtitleOptions = computed(() => {
  return subtitleFiles.value.map(sub => ({
    label: sub.name + (sub.path === defaultSubtitlePath.value ? ` (${t('subtitle.default')})` : ''),
    value: sub.path,
  }))
})

/**
 * 递归搜索目录下的字幕文件
 */
async function loadSubtitles() {
  if (!directoryPath.value) return

  loadingSubtitles.value = true
  try {
    const result = await subtitleService.searchSubtitles(directoryPath.value, props.videoName)
    subtitleFiles.value = result.subtitles || []
    defaultSubtitlePath.value = result.defaultSubtitlePath || null

    // 如果找到了默认同名字幕且尚未手动选择过，自动选择
    if (defaultSubtitlePath.value && !selectedSubtitlePath.value) {
      selectedSubtitlePath.value = defaultSubtitlePath.value
      emit('defaultFound', defaultSubtitlePath.value)
      emit('change', defaultSubtitlePath.value)
    }
  } catch (error) {
    console.error('[SubtitleSelector] Failed to search subtitles:', error)
    subtitleFiles.value = []
    // 搜索失败时尝试同名字幕检测
    tryCheckSameName()
  } finally {
    loadingSubtitles.value = false
  }
}

/**
 * 回退方案：单独检查同名字幕文件
 */
async function tryCheckSameName() {
  if (!props.videoPath) return
  try {
    const result = await subtitleService.checkSameNameSubtitle(props.videoPath)
    if (result && result.path) {
      defaultSubtitlePath.value = result.path
      if (!selectedSubtitlePath.value) {
        selectedSubtitlePath.value = result.path
        // 确保它在选项列表中
        if (!subtitleFiles.value.find(s => s.path === result.path)) {
          subtitleFiles.value.push(result)
        }
        emit('defaultFound', result.path)
        emit('change', result.path)
      }
    }
  } catch {
    // 静默失败
  }
}

/** 处理下拉选择变化 */
function handleSubtitleChange(path: string | null) {
  emit('change', path || '')
}

/** 处理文件选择器选中 */
function handleFileSelectorSelect(file: { name: string; path: string; size: number }) {
  // 如果不在列表中则添加
  if (!subtitleFiles.value.find(s => s.path === file.path)) {
    subtitleFiles.value.push({
      name: file.name,
      path: file.path,
      size: file.size,
      lastModified: Date.now(),
      type: file.name.split('.').pop()?.toLowerCase() || 'ass',
    })
  }
  selectedSubtitlePath.value = file.path
  emit('change', file.path)
}

/** 清除字幕 */
function clearSubtitle() {
  selectedSubtitlePath.value = null
  emit('change', '')
}

// 视频路径变化时重新加载字幕
watch(() => props.videoPath, () => {
  selectedSubtitlePath.value = null
  subtitleFiles.value = []
  defaultSubtitlePath.value = null
  loadSubtitles()
})

onMounted(() => {
  loadSubtitles()
})
</script>

<style scoped>
.subtitle-selector {
  padding: 8px 12px;
  background: var(--n-color);
  border-top: 1px solid var(--n-border-color);
}

.subtitle-label {
  font-size: 13px;
  color: var(--n-text-color-2);
  white-space: nowrap;
}
</style>
