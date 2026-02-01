<template>
  <div class="files-view">
    <!-- 标签页栏 -->
    <div class="tabs-bar">
      <n-tabs 
        type="card" 
        v-model:value="activeTabId" 
        @close="closeTab" 
        @update:value="switchTab"
        :closable="tabs.length > 1"
      >
        <n-tab-pane 
          v-for="tab in tabs" 
          :key="tab.id" 
          :name="tab.id" 
          :tab="tab.name || t('common.loading')"
          display-directive="show"
        >
        </n-tab-pane>
      </n-tabs>
      <n-button text type="primary" @click="addNewTab()" style="margin-left: 8px;" :disabled="!selectedRootPath">
        <template #icon><n-icon><AddOutline /></n-icon></template>
        {{ t('files.newTab') }}
      </n-button>
    </div>

    <!-- 移动端路径显示 -->
    <div class="mobile-path-bar" v-if="isMobile && currentTab">
      <n-select
        v-model:value="selectedRootPath"
        :options="authedDirOptions"
        :placeholder="t('files.selectDirectory')"
        size="small"
        style="flex: 1; max-width: 150px;"
        @update:value="handleRootPathChange"
      />
      <div class="mobile-path-text">
        <n-icon size="14"><FolderOutline /></n-icon>
        <span>{{ getShortPath(currentTab.path) }}</span>
      </div>
    </div>

    <!-- 工具栏 -->
    <n-card class="toolbar-card">
      <!-- 桌面端工具栏 -->
      <div class="toolbar-desktop hide-on-mobile">
        <n-space :size="8" wrap :wrap-item="false">
          <!-- 导航按钮 -->
          <n-button-group>
            <n-tooltip>
              <template #trigger>
                <n-button :disabled="!canGoBack" @click="goBack" quaternary size="small">
                  <template #icon><n-icon><ChevronBackOutline /></n-icon></template>
                </n-button>
              </template>
              {{ t('files.goBack') }}
            </n-tooltip>
            <n-tooltip>
              <template #trigger>
                <n-button :disabled="!canGoForward" @click="goForward" quaternary size="small">
                  <template #icon><n-icon><ChevronForwardOutline /></n-icon></template>
                </n-button>
              </template>
              {{ t('files.goForward') }}
            </n-tooltip>
            <n-tooltip>
              <template #trigger>
                <n-button :disabled="currentPath === selectedRootPath" @click="goUp" quaternary size="small">
                  <template #icon><n-icon><ArrowUpOutline /></n-icon></template>
                </n-button>
              </template>
              {{ t('files.goUp') }}
            </n-tooltip>
            <n-tooltip>
              <template #trigger>
                <n-button @click="refreshCurrentTab" :loading="currentTab?.loading" size="small">
                  <template #icon><n-icon><RefreshOutline /></n-icon></template>
                </n-button>
              </template>
              {{ t('common.refresh') }}
            </n-tooltip>
          </n-button-group>

          <n-divider vertical />

          <!-- 路径导航 -->
          <div class="path-nav">
            <n-select
              v-model:value="selectedRootPath"
              :options="authedDirOptions"
              :placeholder="t('files.rootDirectory')"
              style="width: 160px"
              size="small"
              @update:value="handleRootPathChange"
            />
            <span class="path-separator">/</span>
            <n-breadcrumb v-if="currentTab">
              <n-breadcrumb-item
                v-for="(part, index) in getPathParts(currentTab.path)"
                :key="index"
                @click="navigateToPathByIndex(index)"
              >
                {{ part || t('files.rootDirectory') }}
              </n-breadcrumb-item>
            </n-breadcrumb>
          </div>

          <n-divider vertical />

          <!-- 搜索框 -->
          <n-input
            v-model:value="searchKeyword"
            :placeholder="t('files.searchFiles')"
            size="small"
            style="width: 200px"
            clearable
            @keyup.enter="searchFiles"
            @clear="clearSearch"
          >
            <template #prefix>
              <n-icon><SearchOutline /></n-icon>
            </template>
          </n-input>

          <n-divider vertical />

          <!-- 操作按钮 -->
          <n-button-group>
            <n-tooltip>
              <template #trigger>
                <n-button @click="copyFiles" :disabled="selectedRows.length === 0 || !canWrite" size="small">
                  <template #icon><n-icon><CopyOutline /></n-icon></template>
                </n-button>
              </template>
              {{ t('files.copy') }}
            </n-tooltip>
            <n-tooltip>
              <template #trigger>
                <n-button @click="cutFiles" :disabled="selectedRows.length === 0 || !canWrite" size="small">
                  <template #icon><n-icon><CutOutline /></n-icon></template>
                </n-button>
              </template>
              {{ t('files.cut') }}
            </n-tooltip>
            <n-tooltip>
              <template #trigger>
                <n-button @click="pasteFiles" :disabled="!canPaste" size="small">
                  <template #icon><n-icon><ClipboardOutline /></n-icon></template>
                </n-button>
              </template>
              {{ t('files.paste') }}
            </n-tooltip>
          </n-button-group>

          <n-divider vertical />

          <n-button-group>
            <n-tooltip>
              <template #trigger>
                <n-button @click="downloadSelectedFiles" :disabled="selectedRows.length === 0 || !canDownload" size="small">
                  <template #icon><n-icon><DownloadOutline /></n-icon></template>
                </n-button>
              </template>
              {{ t('files.download') }}
            </n-tooltip>
            <n-tooltip>
              <template #trigger>
                <n-button @click="deleteSelectedFiles" :disabled="selectedRows.length === 0 || !canDelete" size="small">
                  <template #icon><n-icon><TrashOutline /></n-icon></template>
                </n-button>
              </template>
              {{ t('files.delete') }}
            </n-tooltip>
          </n-button-group>

          <n-divider vertical />

          <n-button-group>
            <n-tooltip>
              <template #trigger>
                <n-button @click="showUploadDialog = true" :disabled="!canUpload" size="small" type="primary">
                  <template #icon><n-icon><CloudUploadOutline /></n-icon></template>
                  {{ t('files.upload') }}
                </n-button>
              </template>
              {{ t('files.upload') }}
            </n-tooltip>
            <n-tooltip>
              <template #trigger>
                <n-button @click="showCreateDirDialog = true" :disabled="!canWrite" size="small">
                  <template #icon><n-icon><AddOutline /></n-icon></template>
                </n-button>
              </template>
              {{ t('files.newFolder') }}
            </n-tooltip>
          </n-button-group>
        </n-space>

        <!-- 剪贴板状态 -->
        <div class="clipboard-status" v-if="clipboardData.files.length > 0">
          <n-tag size="small" :type="clipboardData.isCut ? 'warning' : 'info'">
            <template #icon>
              <n-icon><CopyOutline /></n-icon>
            </template>
            {{ clipboardData.isCut ? t('files.clipboard.cut') : t('files.clipboard.copied') }} {{ clipboardData.files.length }} {{ t('files.clipboard.filesCount', { n: clipboardData.files.length }) }}
          </n-tag>
          <n-button text size="small" @click="clearClipboard">{{ t('files.clipboard.clear') }}</n-button>
        </div>
      </div>

      <!-- 移动端工具栏 -->
      <div class="toolbar-mobile hide-on-desktop">
        <div class="mobile-toolbar-row">
          <!-- 导航按钮 -->
          <n-button-group class="nav-buttons">
            <n-button :disabled="!canGoBack" @click="goBack" quaternary size="small" circle>
              <template #icon><n-icon><ChevronBackOutline /></n-icon></template>
            </n-button>
            <n-button :disabled="!canGoForward" @click="goForward" quaternary size="small" circle>
              <template #icon><n-icon><ChevronForwardOutline /></n-icon></template>
            </n-button>
            <n-button :disabled="currentPath === selectedRootPath" @click="goUp" quaternary size="small" circle>
              <template #icon><n-icon><ArrowUpOutline /></n-icon></template>
            </n-button>
            <n-button @click="refreshCurrentTab" :loading="currentTab?.loading" quaternary size="small" circle>
              <template #icon><n-icon><RefreshOutline /></n-icon></template>
            </n-button>
          </n-button-group>

          <!-- 操作按钮 -->
          <n-button-group class="action-buttons">
            <n-button @click="showUploadDialog = true" :disabled="!canUpload" type="primary" size="small" circle>
              <template #icon><n-icon><CloudUploadOutline /></n-icon></template>
            </n-button>
            <n-button @click="showCreateDirDialog = true" :disabled="!canWrite" quaternary size="small" circle>
              <template #icon><n-icon><AddOutline /></n-icon></template>
            </n-button>
            <n-button @click="showMoreActions = true" quaternary size="small" circle>
              <template #icon><n-icon><EllipsisVerticalOutline /></n-icon></template>
            </n-button>
          </n-button-group>
        </div>

        <!-- 搜索框 -->
        <n-input
          v-model:value="searchKeyword"
          :placeholder="t('files.searchPlaceholder')"
          size="small"
          clearable
          @keyup.enter="searchFiles"
          @clear="clearSearch"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>

        <!-- 剪贴板状态 -->
        <div class="clipboard-status-mobile" v-if="clipboardData.files.length > 0">
          <n-tag size="small" :type="clipboardData.isCut ? 'warning' : 'info'">
            {{ clipboardData.isCut ? t('files.cut') : t('files.copy') }}{{ clipboardData.files.length }}{{ t('files.file') }}
          </n-tag>
          <n-button text size="small" @click="clearClipboard">{{ t('files.clipboard.clear') }}</n-button>
        </div>
      </div>
    </n-card>

    <!-- 移动端更多操作抽屉 -->
    <n-drawer v-model:show="showMoreActions" :width="280" placement="bottom">
      <n-drawer-content :title="t('files.moreActions')" closable>
        <n-space vertical :size="12">
          <n-button 
            block 
            @click="copyFiles" 
            :disabled="selectedRows.length === 0 || !canWrite"
            :style="{ justifyContent: 'flex-start' }"
          >
            <template #icon><n-icon><CopyOutline /></n-icon></template>
            {{ t('files.copy') }} ({{ selectedRows.length }})
          </n-button>
          <n-button 
            block 
            @click="cutFiles" 
            :disabled="selectedRows.length === 0 || !canWrite"
            :style="{ justifyContent: 'flex-start' }"
          >
            <template #icon><n-icon><CutOutline /></n-icon></template>
            {{ t('files.cut') }} ({{ selectedRows.length }})
          </n-button>
          <n-button 
            block 
            @click="pasteFiles" 
            :disabled="!canPaste"
            :style="{ justifyContent: 'flex-start' }"
          >
            <template #icon><n-icon><ClipboardOutline /></n-icon></template>
            {{ t('files.paste') }}
          </n-button>
          <n-button 
            block 
            @click="downloadSelectedFiles" 
            :disabled="selectedRows.length === 0 || !canDownload"
            :style="{ justifyContent: 'flex-start' }"
          >
            <template #icon><n-icon><DownloadOutline /></n-icon></template>
            {{ t('files.download') }} ({{ selectedRows.length }})
          </n-button>
          <n-button 
            block 
            @click="deleteSelectedFiles" 
            :disabled="selectedRows.length === 0 || !canDelete"
            :style="{ justifyContent: 'flex-start' }"
          >
            <template #icon><n-icon><TrashOutline /></n-icon></template>
            {{ t('files.delete') }} ({{ selectedRows.length }})
          </n-button>
        </n-space>
      </n-drawer-content>
    </n-drawer>

    <!-- 文件列表区域 -->
    <n-card class="file-content-card" v-if="currentTab" ref="fileContentRef">
      <!-- 权限信息 -->
      <div v-if="currentAuthedDir" class="permission-info">
        <n-tag type="info" size="small">
          <template #icon><n-icon><LockClosedOutline /></n-icon></template>
          {{ currentTab.path }}
        </n-tag>
        <n-space class="permission-tags">
          <n-tag v-if="currentAuthedDir.readable !== false" type="success" size="small">{{ t('files.permissions.read') }}</n-tag>
          <n-tag v-if="currentAuthedDir.writable !== false" type="warning" size="small">{{ t('files.permissions.write') }}</n-tag>
          <n-tag v-if="currentAuthedDir.downloadable !== false" type="info" size="small">{{ t('files.permissions.download') }}</n-tag>
          <n-tag v-if="currentAuthedDir.deletable !== false" type="error" size="small">{{ t('files.permissions.delete') }}</n-tag>
        </n-space>
      </div>

      <!-- 文件列表 -->
      <n-spin :show="currentTab?.loading || false">
        <n-scrollbar style="max-height: calc(100vh - 320px);" @scroll="handleScroll">
          <n-data-table
            :columns="tableColumns"
            :data="currentTab?.filteredFileList || currentTab?.fileList || []"
            :bordered="false"
            :row-key="(row: FileInfo) => row.path"
            :pagination="false"
            :row-props="rowProps"
            v-model:checked-row-keys="selectedRows"
            @update:checked-row-keys="handleSelectionChange"
          />
          <div v-if="currentTab?.hasMore" class="load-more-hint">
            <n-spin v-if="currentTab?.loadingMore" size="small" />
            <span v-else>{{ t('common.scrollLoadMore') }}</span>
          </div>
          <div v-else-if="currentTab?.fileList?.length > 0" class="load-more-hint">
            {{ t('common.loadedAll', { n: currentTab?.totalCount }) }}
          </div>
        </n-scrollbar>
      </n-spin>

      <n-empty
        v-if="!currentTab?.loading && (currentTab?.fileList?.length === 0)"
        :description="t('files.emptyFolder')"
      />
    </n-card>

    <!-- 右键菜单 -->
    <n-dropdown
      v-model:show="contextMenuVisible"
      :x="contextMenuX"
      :y="contextMenuY"
      :options="contextMenuOptions"
      @select="handleContextMenuSelect"
    />

    <n-modal 
      v-model:show="showUploadDialog" 
      preset="dialog" 
      :title="t('files.uploadFile')" 
      class="upload-modal"
      :style="{ width: isMobile ? '95vw' : '600px', maxWidth: '600px' }"
    >
      <!-- 上传模式选择 -->
      <div class="upload-mode-selector">
        <n-radio-group v-model:value="uploadMode" size="medium">
          <n-space>
            <n-radio value="file">
              <div class="upload-mode-option">
                <n-icon size="18"><DocumentOutline /></n-icon>
                <span>{{ t('files.uploadFile') }}</span>
              </div>
            </n-radio>
            <n-radio value="directory">
              <div class="upload-mode-option">
                <n-icon size="18"><FolderOutline /></n-icon>
                <span>{{ t('files.uploadFolder') }}</span>
              </div>
            </n-radio>
          </n-space>
        </n-radio-group>
      </div>
      
      <n-upload
        v-if="uploadMode === 'file'"
        multiple
        :custom-request="handleFileUpload"
        :show-file-list="false"
        @change="handleFileUploadChange"
      >
        <n-upload-dragger class="upload-dragger">
          <div class="upload-icon">
            <n-icon size="56" color="var(--primary-color)"><CloudUploadOutline /></n-icon>
          </div>
          <div class="upload-text">{{ t('files.clickOrDragToUpload') }}</div>
          <div class="upload-hint">{{ t('files.uploadHint') }}</div>
        </n-upload-dragger>
      </n-upload>

      <n-upload
        v-else
        directory
        webkitdirectory
        :custom-request="handleDirectoryUpload"
        :show-file-list="false"
        @change="handleDirectoryUploadChange"
      >
        <n-upload-dragger class="upload-dragger">
          <div class="upload-icon">
            <n-icon size="56" color="var(--primary-color)"><FolderOutline /></n-icon>
          </div>
          <div class="upload-text">{{ t('files.clickToSelectFolder') }}</div>
          <div class="upload-hint">{{ t('files.uploadFolderHint') }}</div>
        </n-upload-dragger>
      </n-upload>

      <div v-if="uploadProgress.length" class="upload-progress-section">
        <div class="upload-progress-header">
          <span class="progress-title">{{ t('files.uploadProgress') }}</span>
          <n-tag :type="uploadFailedCount > 0 ? 'warning' : (uploadSuccessCount === uploadTotal ? 'success' : 'info')" size="small">
            {{ uploadSuccessCount }}/{{ uploadTotal }} {{ t('files.completed') }}
            <template v-if="uploadFailedCount > 0">, {{ uploadFailedCount }} {{ t('files.failed') }}</template>
          </n-tag>
        </div>
        <n-scrollbar style="max-height: 200px">
          <div class="upload-progress-list">
            <div v-for="(item, index) in uploadProgress" :key="index" class="progress-item">
              <div class="progress-file-info">
                <n-icon size="16" class="file-icon">
                  <DocumentOutline />
                </n-icon>
                <span class="file-name" :title="item.fullPath || item.name">{{ item.name }}</span>
              </div>
              <n-progress 
                type="line" 
                :percentage="item.percentage" 
                :status="item.status === 'error' ? 'error' : (item.percentage >= 100 ? 'success' : 'default')"
                :show-indicator="false"
                :height="6"
                :border-radius="3"
              />
            </div>
          </div>
        </n-scrollbar>
      </div>
    </n-modal>

    <n-modal 
      v-model:show="showCreateDirDialog" 
      preset="dialog" 
      :title="t('files.newFolder')"
      :style="{ width: isMobile ? '90vw' : '400px', maxWidth: '400px' }"
    >
      <n-form-item :label="t('files.folderName')">
        <n-input
          v-model:value="newFolderName"
          :placeholder="t('files.enterFolderName')"
          @keyup.enter="createDirectory"
          size="large"
        />
      </n-form-item>
      <template #action>
        <n-button @click="showCreateDirDialog = false">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" @click="createDirectory" :loading="creating">{{ t('files.create') }}</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h, watch, nextTick } from 'vue'
import { useMessage, useDialog, NButton, NIcon, NTag, NInput, NTooltip, NSpace, type DataTableColumns, type SelectOption, type DropdownOption, NDropdown, NBreadcrumb, NBreadcrumbItem, NDivider, NInputGroup } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { fileService } from '@/api/services/file'
import type { FileInfo, AuthedDir } from '@/types'
import {
  CloudUploadOutline, AddOutline, RefreshOutline, HomeOutline, FolderOutline,
  DocumentOutline, TrashOutline, CreateOutline, DownloadOutline, LockClosedOutline,
  EyeOutline, InformationCircleOutline, CopyOutline, CutOutline, ClipboardOutline,
  ChevronBackOutline, ChevronForwardOutline, ArrowUpOutline, SearchOutline,
  OpenOutline, FolderOpenOutline,
  EllipsisVerticalOutline
} from '@vicons/ionicons5'
import { format } from 'date-fns'

const message = useMessage()
const dialog = useDialog()
const { t } = useI18n()

// ============ 类型定义 ============
interface FileTab {
  id: string
  name: string
  path: string
  fileList: FileInfo[]
  filteredFileList?: FileInfo[]
  loading: boolean
  loadingMore: boolean
  backHistory: string[]
  forwardHistory: string[]
  rootPath: string
  // 分页相关
  currentPage: number
  pageSize: number
  totalCount: number
  hasMore: boolean
}

interface ClipboardData {
  files: Array<{ path: string; name: string; isDirectory: boolean }>
  isCut: boolean
  sourcePath: string
}

// ============ 状态 ============
const tabs = ref<FileTab[]>([])
const activeTabId = ref<string | null>(null)
const selectedRows = ref<string[]>([])
const searchKeyword = ref('')
const authedDirs = ref<AuthedDir[]>([])
const selectedRootPath = ref<string | null>(null)
const showUploadDialog = ref(false)
const showCreateDirDialog = ref(false)
const showMoreActions = ref(false)
const newFolderName = ref('')
const creating = ref(false)
const uploadProgress = ref<Array<{ name: string; percentage: number; status: string; fullPath: string }>>([])
const clipboardData = ref<ClipboardData>({
  files: [],
  isCut: false,
  sourcePath: ''
})

// 文件内容区域引用
const fileContentRef = ref<HTMLElement | null>(null)

// 移动端适配
const isMobile = ref(window.innerWidth <= 768)

function handleResize() {
  isMobile.value = window.innerWidth <= 768
}

// 滚动加载处理
function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  if (!target) return
  
  const { scrollTop, scrollHeight, clientHeight } = target
  // 距离底部 100px 时触发加载
  if (scrollHeight - scrollTop - clientHeight < 100) {
    loadMoreFiles()
  }
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuTarget = ref<FileInfo | null>(null)

// ============ 计算属性 ============
const currentTab = computed(() => tabs.value.find(t => t.id === activeTabId.value))

const currentPath = computed(() => currentTab.value?.path || '/')

const currentAuthedDir = computed<AuthedDir | null>(() => {
  if (!selectedRootPath.value || !currentTab.value) return null
  return authedDirs.value.find(d => d.path === currentTab.value?.rootPath) || null
})

const authedDirOptions = computed<SelectOption[]>(() => {
  return authedDirs.value.map(dir => ({
    label: dir.path,
    value: dir.path
  }))
})

const canGoBack = computed(() => currentTab.value?.backHistory && currentTab.value.backHistory.length > 0)
const canGoForward = computed(() => currentTab.value?.forwardHistory && currentTab.value.forwardHistory.length > 0)

const canUpload = computed(() => currentAuthedDir.value?.uploadable !== false)
const canWrite = computed(() => currentAuthedDir.value?.writable !== false)
const canDownload = computed(() => currentAuthedDir.value?.downloadable !== false)
const canDelete = computed(() => currentAuthedDir.value?.deletable !== false)

const canPaste = computed(() => {
  return clipboardData.value.files.length > 0 && currentAuthedDir.value?.writable !== false
})

// 右键菜单选项
const contextMenuOptions = computed<DropdownOption[]>(() => {
  const target = contextMenuTarget.value
  const options: DropdownOption[] = []

  if (target) {
    if (target.type === 'directory') {
      options.push({ label: t('common.open'), key: 'open', icon: () => h(NIcon, null, { default: () => h(FolderOpenOutline) }) })
    } else {
      options.push({ label: t('common.open'), key: 'open', icon: () => h(NIcon, null, { default: () => h(OpenOutline) }) })
    }
    options.push({ label: t('files.download'), key: 'download', icon: () => h(NIcon, null, { default: () => h(DownloadOutline) }) })
    options.push({ type: 'divider', key: 'd1' })
    options.push({ label: t('files.copy'), key: 'copy', icon: () => h(NIcon, null, { default: () => h(CopyOutline) }) })
    options.push({ label: t('files.cut'), key: 'cut', icon: () => h(NIcon, null, { default: () => h(CutOutline) }) })
    options.push({ type: 'divider', key: 'd2' })
    options.push({ label: t('files.rename'), key: 'rename', icon: () => h(NIcon, null, { default: () => h(CreateOutline) }) })
    options.push({ label: t('files.delete'), key: 'delete', icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) })
  }

  return options
})

// ============ 表格列配置 ============
const tableColumns = computed<DataTableColumns<FileInfo>>(() => {
  // 文件图标渲染函数
  const renderFileIcon = (row: FileInfo, size: number) => {
    const isFolder = row.type === 'directory'
    return h('div', { 
      class: ['file-icon-wrapper', isFolder ? 'folder-icon' : 'file-icon']
    }, [
      h(NIcon, { 
        size, 
        color: isFolder ? '#f0a020' : '#909399'
      }, { 
        default: () => h(isFolder ? FolderOutline : DocumentOutline) 
      })
    ])
  }

  // 移动端简化列
  if (isMobile.value) {
    return [
      {
        type: 'selection',
        width: 40,
      },
      {
        title: t('files.fileName'),
        key: 'name',
        ellipsis: {
          tooltip: true
        },
        render: (row) => {
          return h('div', { class: 'file-name-cell' }, [
            renderFileIcon(row, 20),
            h('span', { class: 'file-name', title: row.name }, row.name)
          ])
        }
      },
      {
        title: t('files.modifiedDate'),
        key: 'lastModified',
        width: 100,
        render: (row) => format(new Date(row.lastModified), 'MM-dd HH:mm')
      }
    ]
  }
  
  // 桌面端完整列
  return [
    {
      type: 'selection',
      width: 50,
    },
    {
      title: t('files.fileName'),
      key: 'name',
      ellipsis: {
        tooltip: true
      },
      render: (row) => {
        return h('div', { class: 'file-name-cell' }, [
          renderFileIcon(row, 22),
          h('span', { class: 'file-name' }, row.name)
        ])
      }
    },
    {
      title: t('files.fileSize'),
      key: 'size',
      width: 100,
      render: (row) => row.type === 'directory' ? '-' : formatBytes(row.size)
    },
    {
      title: t('files.modifiedDate'),
      key: 'lastModified',
      width: 180,
      render: (row) => format(new Date(row.lastModified), 'yyyy-MM-dd HH:mm')
    },
    {
      title: t('files.fileType'),
      key: 'type',
      width: 80,
      render: (row) => h(NTag, { size: 'small', type: row.type === 'directory' ? 'info' : 'default' }, { default: () => row.type === 'directory' ? t('files.directory') : t('files.file') })
    }
  ]
})

// 行属性（用于双击和单击选中）
const rowProps = (row: FileInfo) => ({
  style: { cursor: 'pointer' },
  onClick: () => handleRowClick(row),
  onDblclick: () => handleRowDoubleClick(row),
  onContextmenu: (e: MouseEvent) => showContextMenu(e, row)
})

// 单击选中/取消选中行
function handleRowClick(row: FileInfo) {
  const path = row.path
  const index = selectedRows.value.indexOf(path)
  if (index > -1) {
    // 已选中，取消选中
    selectedRows.value.splice(index, 1)
  } else {
    // 未选中，添加到选中列表
    selectedRows.value.push(path)
  }
}

// ============ 标签页管理 ============
function generateTabId(): string {
  return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

function addNewTab(path?: string, name?: string) {
  const rootPath = selectedRootPath.value || '/'
  const tabPath = path || rootPath
  const tabName = name || tabPath.split(/[\/\\]/).filter(Boolean).pop() || t('files.rootDirectory')

  const newTab: FileTab = {
    id: generateTabId(),
    name: tabName,
    path: tabPath,
    fileList: [],
    loading: false,
    loadingMore: false,
    backHistory: [],
    forwardHistory: [],
    rootPath,
    // 分页
    currentPage: 1,
    pageSize: 50,
    totalCount: 0,
    hasMore: true
  }

  tabs.value.push(newTab)
  activeTabId.value = newTab.id
  
  // 使用 nextTick 确保 DOM 更新后再获取响应式的 tab 对象
  nextTick(() => {
    const tab = tabs.value.find(t => t.id === newTab.id)
    if (tab) {
      fetchTabFiles(tab)
    }
  })
}

function closeTab(id: string) {
  const index = tabs.value.findIndex(t => t.id === id)
  if (index > -1) {
    tabs.value.splice(index, 1)
    if (activeTabId.value === id) {
      if (tabs.value.length > 0) {
        activeTabId.value = tabs.value[Math.max(0, index - 1)].id
      } else {
        activeTabId.value = null
      }
    }
  }
}

function switchTab(id: string) {
  const tab = tabs.value.find(t => t.id === id)
  if (tab && tab.fileList.length === 0) {
    fetchTabFiles(tab)
  }
}

function refreshCurrentTab() {
  if (currentTab.value) {
    currentTab.value.fileList = []
    currentTab.value.filteredFileList = undefined
    searchKeyword.value = ''
    fetchTabFiles(currentTab.value)
  }
}

// ============ 导航功能 ============
function goBack() {
  if (!currentTab.value || currentTab.value.backHistory.length === 0) return

  const backPath = currentTab.value.backHistory.pop()!
  currentTab.value.forwardHistory.push(currentTab.value.path)
  // 直接更新路径，不修改历史记录
  loadTabPath(backPath)
}

function goForward() {
  if (!currentTab.value || currentTab.value.forwardHistory.length === 0) return

  const forwardPath = currentTab.value.forwardHistory.pop()!
  currentTab.value.backHistory.push(currentTab.value.path)
  // 直接更新路径，不修改历史记录
  loadTabPath(forwardPath)
}

function goUp() {
  if (!currentTab.value || currentTab.value.path === currentTab.value.rootPath) return

  const currentPath = currentTab.value.path
  // 检查是否是 Windows 盘符路径 (如 D:/path 或 D:\path)
  const isWindowsPath = /^[A-Za-z]:[\/\\]/.test(currentPath)
  
  const parts = currentPath.split(/[\/\\]/).filter(Boolean)
  parts.pop()
  
  let parentPath: string
  if (parts.length === 0) {
    parentPath = currentTab.value.rootPath
  } else if (isWindowsPath) {
    // Windows 路径：保持盘符格式 D:/path
    parentPath = parts[0] + '/' + parts.slice(1).join('/')
  } else {
    // Unix 路径：以 / 开头
    parentPath = '/' + parts.join('/')
  }
  navigateToTabPath(parentPath)
}

// 直接加载路径（不修改历史记录，用于后退/前进）
function loadTabPath(path: string) {
  if (!currentTab.value) return

  currentTab.value.path = path
  currentTab.value.fileList = []
  currentTab.value.filteredFileList = undefined
  currentTab.value.currentPage = 1
  currentTab.value.hasMore = true
  searchKeyword.value = ''
  fetchTabFiles(currentTab.value)
}

// 导航到路径（会记录历史，用于正常导航）
function navigateToTabPath(path: string) {
  if (!currentTab.value) return

  if (currentTab.value.path !== path) {
    currentTab.value.backHistory.push(currentTab.value.path)
    currentTab.value.forwardHistory = []
    loadTabPath(path)
  }
}

function navigateToPathByIndex(index: number) {
  if (!currentTab.value || !selectedRootPath.value) return

  const parts = getPathParts(currentTab.value.path)
  const pathParts = parts.slice(0, index + 1)
  
  // 检查根路径是否是 Windows 盘符路径
  const isWindowsPath = /^[A-Za-z]:[\/\\]/.test(selectedRootPath.value)
  
  let targetPath: string
  if (pathParts.length === 0) {
    targetPath = selectedRootPath.value
  } else if (isWindowsPath) {
    // Windows 路径：拼接到根路径后
    const rootClean = selectedRootPath.value.replace(/[\/\\]$/, '')
    targetPath = rootClean + '/' + pathParts.join('/')
  } else {
    // Unix 路径
    const rootClean = selectedRootPath.value.replace(/\/$/, '')
    targetPath = rootClean + '/' + pathParts.join('/')
  }
  navigateToTabPath(targetPath)
}

// ============ 文件操作 ============
async function fetchTabFiles(tab: FileTab, loadMore: boolean = false) {
  if (loadMore) {
    if (tab.loadingMore || !tab.hasMore) return
    tab.loadingMore = true
    tab.currentPage++
  } else {
    tab.loading = true
    tab.currentPage = 1
    tab.fileList = []
  }
  
  try {
    const response = await fileService.getFileList(tab.path, tab.currentPage, tab.pageSize)
    // 兼容 list 和 records 两种字段
    const newFiles = response.list || response.records || []
    
    if (loadMore) {
      tab.fileList = [...tab.fileList, ...newFiles]
    } else {
      tab.fileList = newFiles
    }
    
    tab.totalCount = response.total || 0
    tab.hasMore = tab.fileList.length < tab.totalCount
    tab.filteredFileList = undefined
    searchKeyword.value = ''

    // 更新标签页名称
    const pathParts = tab.path.split(/[\/\\]/).filter(Boolean)
    tab.name = pathParts.length > 0 ? pathParts[pathParts.length - 1] : tab.rootPath.split(/[\/\\]/).filter(Boolean).pop() || t('files.rootDirectory')
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('files.getFileListFailed'))
    if (!loadMore) {
      tab.fileList = []
    }
    // 加载失败时回退页码
    if (loadMore) {
      tab.currentPage--
    }
  } finally {
    tab.loading = false
    tab.loadingMore = false
  }
}

// 加载更多文件
function loadMoreFiles() {
  if (currentTab.value && currentTab.value.hasMore && !currentTab.value.loadingMore) {
    fetchTabFiles(currentTab.value, true)
  }
}

function handleRowDoubleClick(row: FileInfo) {
  if (row.type === 'directory') {
    navigateToTabPath(row.path)
  } else {
    downloadFile(row)
  }
}

function showContextMenu(e: MouseEvent, row: FileInfo) {
  e.preventDefault()
  contextMenuTarget.value = row
  contextMenuX.value = e.clientX
  contextMenuY.value = e.clientY
  contextMenuVisible.value = true
}

function handleContextMenuSelect(key: string) {
  const target = contextMenuTarget.value
  if (!target) return

  contextMenuVisible.value = false

  switch (key) {
    case 'open':
      if (target.type === 'directory') {
        navigateToTabPath(target.path)
      } else {
        downloadFile(target)
      }
      break
    case 'download':
      downloadFile(target)
      break
    case 'copy':
      copyToClipboard([target], false)
      break
    case 'cut':
      copyToClipboard([target], true)
      break
    case 'rename':
      renameFile(target)
      break
    case 'delete':
      deleteFiles([target])
      break
  }
}

async function downloadFile(file: FileInfo) {
  try {
    if (file.type === 'directory') {
      message.info(t('files.downloadingFolder', { name: file.name }))
    }
    await fileService.downloadFile(file.path, file.type === 'directory' ? `${file.name}.zip` : file.name)
    message.success(t('files.downloadSuccess'))
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('files.downloadFailed'))
  }
}

function renameFile(file: FileInfo) {
  const newNameRef = ref(file.name)
  dialog.create({
    title: t('files.rename'),
    content: () => h('div', [
      h('p', { style: 'margin-bottom: 8px' }, `${t('files.rename')} "${file.name}":`),
      h(NInput, {
        value: newNameRef.value,
        placeholder: t('files.enterNewName'),
        onUpdateValue: (val) => { newNameRef.value = val }
      }),
    ]),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      if (!newNameRef.value.trim()) {
        message.error(t('validation.required'))
        return false
      }
      if (newNameRef.value === file.name) return

      try {
        await fileService.renameFile(file.path, newNameRef.value)
        message.success(t('files.renameSuccess'))
        refreshCurrentTab()
      } catch (error: unknown) {
        const err = error as Error
        message.error(err.message || t('files.renameFailed'))
      }
    },
  })
}

async function deleteFiles(files: FileInfo[]) {
  const paths = files.map(f => f.path)
  const isDir = files.some(f => f.type === 'directory')

  dialog.warning({
    title: t('files.deleteConfirm'),
    content: `${t('files.deleteConfirm')} "${files.map(f => f.name).join(', ')}"?`,
    positiveText: t('files.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await fileService.deleteFiles(paths)
        message.success(t('files.deleteSuccess'))
        refreshCurrentTab()
      } catch (error: unknown) {
        const err = error as Error
        message.error(err.message || t('files.deleteFailed'))
      }
    },
  })
}

// ============ 剪贴板操作 ============
function copyToClipboard(files: FileInfo[], isCut: boolean) {
  clipboardData.value = {
    files: files.map(f => ({ path: f.path, name: f.name, isDirectory: f.type === 'directory' })),
    isCut,
    sourcePath: files[0]?.path.split('/').slice(0, -1).join('/') || ''
  }
  message.success(isCut ? t('files.clipboard.cut') : t('files.clipboard.copied'))
}

async function pasteFiles() {
  if (clipboardData.value.files.length === 0 || !currentTab.value) return

  const targetPath = currentTab.value.path
  const operations: Array<{ oldPath: string; newPath: string }> = []

  for (const file of clipboardData.value.files) {
    const fileName = file.name
    const newPath = targetPath === '/' ? `/${fileName}` : `${targetPath}/${fileName}`
    operations.push({ oldPath: file.path, newPath })
  }

  try {
    if (clipboardData.value.isCut) {
      await fileService.moveFiles(operations)
      message.success(t('files.moveSuccess'))
    } else {
      await fileService.copyFiles(operations)
      message.success(t('files.copySuccess'))
    }
    clearClipboard()
    refreshCurrentTab()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('common.operationFailed'))
  }
}

function clearClipboard() {
  clipboardData.value = { files: [], isCut: false, sourcePath: '' }
}

// ============ 选择操作 ============
function copyFiles() {
  const selected = getSelectedFiles()
  if (selected.length > 0) {
    copyToClipboard(selected, false)
  }
}

function cutFiles() {
  const selected = getSelectedFiles()
  if (selected.length > 0) {
    copyToClipboard(selected, true)
  }
}

function downloadSelectedFiles() {
  const selected = getSelectedFiles()
  if (selected.length === 0) return
  
  const files = selected.filter(f => f.type !== 'directory')
  const folders = selected.filter(f => f.type === 'directory')
  
  // 逐个下载文件
  files.forEach(file => {
    downloadFile(file)
  })
  
  // 逐个下载文件夹
  folders.forEach(folder => {
    downloadFile(folder)
  })
}

function deleteSelectedFiles() {
  const selected = getSelectedFiles()
  if (selected.length > 0) {
    deleteFiles(selected)
  }
}

function getSelectedFiles(): FileInfo[] {
  if (!currentTab.value) return []
  return currentTab.value.fileList.filter(f => selectedRows.value.includes(f.path))
}

function handleSelectionChange(keys: string[]) {
  selectedRows.value = keys
}

// ============ 搜索功能 ============
function searchFiles() {
  if (!currentTab.value || !searchKeyword.value.trim()) {
    currentTab.value.filteredFileList = undefined
    return
  }

  const keyword = searchKeyword.value.toLowerCase()
  currentTab.value.filteredFileList = currentTab.value.fileList.filter(f =>
    f.name.toLowerCase().includes(keyword)
  )
}

function clearSearch() {
  searchKeyword.value = ''
  if (currentTab.value) {
    currentTab.value.filteredFileList = undefined
  }
}

// ============ 路径工具 ============
function getPathParts(path: string): string[] {
  if (!selectedRootPath.value) return path.split('/').filter(Boolean)
  const rootParts = selectedRootPath.value.split('/').filter(Boolean).length
  return path.split('/').filter(Boolean).slice(rootParts)
}

// 获取简短路径（移动端显示）
function getShortPath(path: string): string {
  const parts = path.split(/[\/\\]/).filter(Boolean)
  if (parts.length === 0) return '/'
  if (parts.length <= 2) return parts.join('/')
  return '.../' + parts.slice(-2).join('/')
}

// ============ 其他操作 ============
function handleRootPathChange(value: string) {
  selectedRootPath.value = value
  if (currentTab.value) {
    currentTab.value.rootPath = value
    currentTab.value.path = value
    currentTab.value.fileList = []
    fetchTabFiles(currentTab.value)
  }
}

function createDirectory() {
  if (!newFolderName.value.trim()) {
    message.error(t('files.enterFolderName'))
    return
  }
  creating.value = true

  const dirPath = currentPath.value === '/' ? `/${newFolderName.value}` : `${currentPath.value}/${newFolderName.value}`

  fileService.createDir(dirPath)
    .then(() => {
      message.success(t('files.createFolderSuccess'))
      showCreateDirDialog.value = false
      newFolderName.value = ''
      refreshCurrentTab()
    })
    .catch((error: unknown) => {
      const err = error as Error
      message.error(err.message || t('files.createFolderFailed'))
    })
    .finally(() => {
      creating.value = false
    })
}

// 上传相关状态
const uploadMode = ref<'file' | 'directory'>('file')
const uploadQueue = ref<Array<{ id: string; name: string; fullPath: string; file: File; status: 'pending' | 'uploading' | 'success' | 'failed'; progress: number }>>([])
const uploadingCount = ref(0)
const uploadTotal = ref(0)
const uploadSuccessCount = ref(0)
const uploadFailedCount = ref(0)

// 重置上传状态
function resetUploadState() {
  uploadTotal.value = 0
  uploadSuccessCount.value = 0
  uploadFailedCount.value = 0
  uploadProgress.value = []
  uploadQueue.value = []
}

// 获取目标目录路径
function getTargetDir(): string {
  return currentTab.value?.path || selectedRootPath.value || '/'
}

// 上传单个文件
async function uploadSingleFile(
  fileObj: File,
  targetPath: string,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  try {
    await fileService.uploadFile(targetPath, fileObj, onProgress)
    return true
  } catch {
    return false
  }
}

/**
 * 处理普通文件上传
 */
async function handleFileUpload(options: { file: { file: File; id?: string; name?: string }; onProgress: (e: number) => void; onFinish: () => void; onError: () => void }) {
  const { file, onProgress, onFinish, onError } = options
  const fileObj = file.file
  const fileName = file.name || fileObj?.name || t('media.unknownFile')
  const fileId = file.id
  
  const targetDir = getTargetDir()
  if (!targetDir || targetDir === '/') {
    message.error(t('files.selectValidDirectory'))
    onError()
    return
  }

  const targetPath = targetDir === '/' ? `/${fileName}` : `${targetDir}/${fileName}`

  // 更新进度的回调
  const updateProgress = (progress: number) => {
    // 更新 uploadProgress 数组中对应文件的进度
    const progressItem = uploadProgress.value.find(p => p.name === fileName)
    if (progressItem) {
      progressItem.percentage = progress
      progressItem.status = progress >= 100 ? 'success' : 'default'
    }
    // 同时调用原始的 onProgress 回调
    onProgress(progress)
  }

  try {
    await uploadSingleFile(fileObj, targetPath, updateProgress)
    // 上传成功，更新状态
    const progressItem = uploadProgress.value.find(p => p.name === fileName)
    if (progressItem) {
      progressItem.percentage = 100
      progressItem.status = 'success'
    }
    uploadSuccessCount.value++
    onFinish()
    checkUploadComplete()
  } catch (error: unknown) {
    // 上传失败，更新状态
    const progressItem = uploadProgress.value.find(p => p.name === fileName)
    if (progressItem) {
      progressItem.status = 'error'
    }
    uploadFailedCount.value++
    const err = error as Error
    message.error(`${fileName}: ${err.message || t('files.uploadFailed')}`)
    onError()
    checkUploadComplete()
  }
}

function handleFileUploadChange(options: { fileList: Array<{ id: string; name: string }> }) {
  uploadTotal.value = options.fileList.length
  uploadProgress.value = options.fileList.map(f => ({
    name: f.name,
    percentage: 0,
    status: 'default',
    fullPath: ''
  }))
}

/**
 * 处理文件夹上传
 * 保持目录结构，上传时自动创建必要目录
 */
async function handleDirectoryUpload(options: { file: { file: File; id?: string; name?: string; fullPath?: string; batchId?: string }; onProgress: (e: number) => void; onFinish: () => void; onError: () => void }) {
  const { file, onProgress, onFinish, onError } = options
  const fileObj = file.file
  const fileName = file.name || fileObj?.name || t('media.unknownFile')
  
  // 获取文件夹内的相对路径
  // Naive UI 使用 fullPath，原生 File API 使用 webkitRelativePath
  const relativePath = file.fullPath || (fileObj as File & { webkitRelativePath?: string })?.webkitRelativePath || ''
  if (!relativePath) {
    // 如果还是获取不到路径，使用文件名
    console.warn('无法获取文件相对路径，使用文件名:', fileName)
  }
  
  const targetDir = getTargetDir()
  if (!targetDir || targetDir === '/') {
    message.error(t('files.selectValidDirectory'))
    onError()
    return
  }

  // 构建目标路径：保持文件夹结构
  // relativePath 格式: "folder/subfolder/file.txt"
  const finalPath = relativePath || fileName
  const targetPath = targetDir === '/' ? `/${finalPath}` : `${targetDir}/${finalPath}`

  // 更新进度的回调
  const updateProgress = (progress: number) => {
    // 更新 uploadProgress 数组中对应文件的进度
    const progressItem = uploadProgress.value.find(p => p.name === fileName || p.fullPath === relativePath)
    if (progressItem) {
      progressItem.percentage = progress
      progressItem.status = progress >= 100 ? 'success' : 'default'
    }
    // 同时调用原始的 onProgress 回调
    onProgress(progress)
  }

  try {
    await uploadSingleFile(fileObj, targetPath, updateProgress)
    // 上传成功，更新状态
    const progressItem = uploadProgress.value.find(p => p.name === fileName || p.fullPath === relativePath)
    if (progressItem) {
      progressItem.percentage = 100
      progressItem.status = 'success'
    }
    uploadSuccessCount.value++
    onFinish()
    checkUploadComplete()
  } catch (error: unknown) {
    // 上传失败，更新状态
    const progressItem = uploadProgress.value.find(p => p.name === fileName || p.fullPath === relativePath)
    if (progressItem) {
      progressItem.status = 'error'
    }
    uploadFailedCount.value++
    const err = error as Error
    message.error(`${fileName}: ${err.message || t('files.uploadFailed')}`)
    onError()
    checkUploadComplete()
  }
}

function handleDirectoryUploadChange(options: { fileList: Array<{ id: string; name: string; fullPath?: string; file?: File & { webkitRelativePath?: string } }> }) {
  uploadTotal.value = options.fileList.length
  uploadProgress.value = options.fileList.map(f => ({
    name: f.name,
    percentage: 0,
    status: 'default',
    fullPath: f.fullPath || f.file?.webkitRelativePath || ''
  }))
}

// 检查上传是否全部完成
function checkUploadComplete() {
  if (uploadSuccessCount.value + uploadFailedCount.value >= uploadTotal.value) {
    setTimeout(() => {
      refreshCurrentTab()
      // 延迟重置状态，让用户看到结果
      setTimeout(() => {
        resetUploadState()
      }, 1000)
    }, 500)
  }
}

// 保留原有函数以兼容
async function handleUpload(options: { file: { file: File; id?: string; name?: string; path?: string }; onProgress: (e: number) => void; onFinish: () => void; onError: () => void }) {
  const { file, onProgress, onFinish, onError } = options
  const fileObj = file.file
  const fileName = file.name || fileObj?.name || t('media.unknownFile')
  
  const relativePath = file.path || ''
  const targetDir = getTargetDir()
  
  if (!targetDir || targetDir === '/') {
    message.error(t('files.selectValidDirectory'))
    onError()
    return
  }

  if (!fileObj) {
    message.error(t('files.fileObjectEmpty'))
    onError()
    return
  }

  let targetPath: string
  if (relativePath) {
    targetPath = targetDir === '/' ? `/${relativePath}` : `${targetDir}/${relativePath}`
  } else {
    targetPath = targetDir === '/' ? `/${fileName}` : `${targetDir}/${fileName}`
  }

  try {
    await uploadSingleFile(fileObj, targetPath, onProgress)
    uploadSuccessCount.value++
    onFinish()
    checkUploadComplete()
  } catch (error: unknown) {
    uploadFailedCount.value++
    const err = error as Error
    message.error(`${fileName}: ${err.message || t('files.uploadFailed')}`)
    onError()
    checkUploadComplete()
  }
}

function handleUploadChange(options: { fileList: Array<{ id: string; name: string }> }) {
  uploadTotal.value = options.fileList.length
  uploadProgress.value = options.fileList.map(f => ({
    name: f.name,
    percentage: 0,
    status: 'default',
    fullPath: ''
  }))
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ============ 初始化 ============
async function fetchAuthedDirs() {
  try {
    const dirs = await fileService.getAuthedDirs()
    authedDirs.value = dirs

    if (dirs.length > 0) {
      const readableDir = dirs.find((d) => d.readable !== false)
      if (readableDir) {
        selectedRootPath.value = readableDir.path
        addNewTab(readableDir.path, readableDir.path.split('/').filter(Boolean).pop() || t('files.rootDirectory'))
      }
    }
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('files.getAuthedDirsFailed'))
  }
}

onMounted(() => {
  fetchAuthedDirs()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped lang="css">
.files-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.tabs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-color);
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tab-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tab-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-card {
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.toolbar-card :deep(.n-card__content) {
  padding: 0;
}

.path-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.path-separator {
  color: var(--n-text-color-disabled);
  margin: 0 4px;
}

/* 移动端路径栏 */
.mobile-path-bar {
  display: none;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-color);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.mobile-path-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.clipboard-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--n-border-color);
}

.file-content-card {
  flex: 1;
  overflow: auto;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.permission-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(24, 160, 88, 0.08) 0%, rgba(54, 173, 106, 0.04) 100%);
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid rgba(24, 160, 88, 0.1);
}

.permission-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  max-width: 100%;
}

.file-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.file-icon-wrapper.folder-icon :deep(.n-icon) {
  color: #f0a020;
}

.file-icon-wrapper.file-icon :deep(.n-icon) {
  color: #909399;
}

.file-name {
  cursor: pointer;
  transition: color 0.2s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.file-name:hover {
  color: var(--n-primary-color);
}

/* 上传对话框样式 */
.upload-mode-selector {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.upload-mode-option {
  display: flex;
  align-items: center;
  gap: 6px;
}

.upload-mode-selector :deep(.n-space) {
  gap: 24px !important;
}

.upload-dragger {
  padding: 40px 20px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 2px dashed var(--n-border-color);
  background: linear-gradient(135deg, rgba(24, 160, 88, 0.02) 0%, rgba(54, 173, 106, 0.01) 100%);
}

.upload-dragger:hover {
  border-color: var(--primary-color);
  background: linear-gradient(135deg, rgba(24, 160, 88, 0.05) 0%, rgba(54, 173, 106, 0.02) 100%);
}

.upload-icon {
  margin-bottom: 16px;
  animation: bounce 2s ease infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
  60% { transform: translateY(-4px); }
}

.upload-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color-base);
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 13px;
  color: var(--text-color-tertiary);
}

/* 上传进度样式 */
.upload-progress-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color-light);
}

.upload-progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.progress-title {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-color-base);
}

.upload-progress-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: var(--primary-color);
  flex-shrink: 0;
}

.file-name {
  font-size: 13px;
  color: var(--text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 表格行样式 */
:deep(.n-data-table-tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

:deep(.n-data-table-tr:hover) {
  background-color: var(--n-td-color-hover) !important;
}

:deep(.n-data-table-tr--selected) {
  background-color: var(--n-td-color-hover) !important;
}

/* 加载更多提示 */
.load-more-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: var(--text-color-tertiary);
  font-size: 13px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .files-view {
    gap: 8px;
  }

  .tabs-bar {
    padding: 6px 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tabs-bar::-webkit-scrollbar {
    display: none;
  }

  .toolbar-card {
    padding: 8px;
  }

  .toolbar-card :deep(.n-space) {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .toolbar-card :deep(.n-divider--vertical) {
    display: none;
  }

  .path-nav {
    display: none;
  }

  .mobile-path-bar {
    display: flex;
  }

  .permission-info {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .upload-dragger {
    padding: 30px 16px;
  }

  .upload-icon :deep(.n-icon) {
    font-size: 48px !important;
  }

  .upload-text {
    font-size: 14px;
  }

  .upload-hint {
    font-size: 12px;
  }

  /* 移动端文件列表表格样式 */
  .file-content-card :deep(.n-data-table) {
    font-size: 13px;
  }

  .file-content-card :deep(.n-data-table-wrapper) {
    overflow-x: hidden;
  }

  .file-content-card :deep(.n-data-table th),
  .file-content-card :deep(.n-data-table td) {
    padding: 10px 8px;
  }

  /* 文件名单元格样式 */
  .file-name-cell {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
  }

  .file-name-cell .file-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .hide-on-mobile {
    display: none !important;
  }
}

/* 小屏幕手机 */
@media screen and (max-width: 480px) {
  .upload-mode-selector :deep(.n-radio-group) {
    flex-direction: column;
    width: 100%;
  }

  .upload-mode-selector :deep(.n-radio-button) {
    justify-content: center;
  }
}
</style>
