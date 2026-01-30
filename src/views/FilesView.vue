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
          :tab="tab.name || '加载中...'"
          display-directive="show"
        >
        </n-tab-pane>
      </n-tabs>
      <n-button text type="primary" @click="addNewTab()" style="margin-left: 8px;" :disabled="!selectedRootPath">
        <template #icon><n-icon><AddOutline /></n-icon></template>
        新建标签
      </n-button>
    </div>

    <!-- 工具栏 -->
    <n-card class="toolbar-card">
      <n-space :size="8" wrap>
        <!-- 导航按钮 -->
        <n-button-group>
          <n-tooltip>
            <template #trigger>
              <n-button :disabled="!canGoBack" @click="goBack" quaternary>
                <template #icon><n-icon><ChevronBackOutline /></n-icon></template>
              </n-button>
            </template>
            后退
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button :disabled="!canGoForward" @click="goForward" quaternary>
                <template #icon><n-icon><ChevronForwardOutline /></n-icon></template>
              </n-button>
            </template>
            前进
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button :disabled="currentPath === selectedRootPath" @click="goUp" quaternary>
                <template #icon><n-icon><ArrowUpOutline /></n-icon></template>
              </n-button>
            </template>
            上级目录
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button @click="refreshCurrentTab" :loading="currentTab?.loading">
                <template #icon><n-icon><RefreshOutline /></n-icon></template>
              </n-button>
            </template>
            刷新
          </n-tooltip>
        </n-button-group>

        <n-divider vertical />

        <!-- 路径导航 -->
        <div class="path-nav">
          <n-select
            v-model:value="selectedRootPath"
            :options="authedDirOptions"
            placeholder="根目录"
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
              {{ part || '根目录' }}
            </n-breadcrumb-item>
          </n-breadcrumb>
        </div>

        <n-divider vertical />

        <!-- 搜索框 -->
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索文件..."
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
              <n-button @click="copyFiles" :disabled="selectedRows.length === 0 || !canWrite">
                <template #icon><n-icon><CopyOutline /></n-icon></template>
              </n-button>
            </template>
            复制
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button @click="cutFiles" :disabled="selectedRows.length === 0 || !canWrite">
                <template #icon><n-icon><CutOutline /></n-icon></template>
              </n-button>
            </template>
            剪切
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button @click="pasteFiles" :disabled="!canPaste">
                <template #icon><n-icon><ClipboardOutline /></n-icon></template>
              </n-button>
            </template>
            粘贴
          </n-tooltip>
        </n-button-group>

        <n-divider vertical />

        <n-button-group>
          <n-tooltip>
            <template #trigger>
              <n-button @click="downloadSelectedFiles" :disabled="selectedRows.length === 0 || !canDownload">
                <template #icon><n-icon><DownloadOutline /></n-icon></template>
              </n-button>
            </template>
            下载
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button @click="deleteSelectedFiles" :disabled="selectedRows.length === 0 || !canDelete">
                <template #icon><n-icon><TrashOutline /></n-icon></template>
              </n-button>
            </template>
            删除
          </n-tooltip>
        </n-button-group>

        <n-divider vertical />

        <n-button-group>
          <n-tooltip>
            <template #trigger>
              <n-button @click="showUploadDialog = true" :disabled="!canUpload">
                <template #icon><n-icon><CloudUploadOutline /></n-icon></template>
              </n-button>
            </template>
            上传
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button @click="showCreateDirDialog = true" :disabled="!canWrite">
                <template #icon><n-icon><AddOutline /></n-icon></template>
              </n-button>
            </template>
            新建文件夹
          </n-tooltip>
        </n-button-group>
      </n-space>

      <!-- 剪贴板状态 -->
      <div class="clipboard-status" v-if="clipboardData.files.length > 0">
        <n-tag size="small" :type="clipboardData.isCut ? 'warning' : 'info'">
          <template #icon>
            <n-icon><CopyOutline /></n-icon>
          </template>
          {{ clipboardData.isCut ? '已剪切' : '已复制' }} {{ clipboardData.files.length }} 个文件
        </n-tag>
        <n-button text size="small" @click="clearClipboard">清空</n-button>
      </div>
    </n-card>

    <!-- 文件列表区域 -->
    <n-card class="file-content-card" v-if="currentTab">
      <!-- 权限信息 -->
      <div v-if="currentAuthedDir" class="permission-info">
        <n-tag type="info" size="small">
          <template #icon><n-icon><LockClosedOutline /></n-icon></template>
          {{ currentTab.path }}
        </n-tag>
        <n-space class="permission-tags">
          <n-tag v-if="currentAuthedDir.readable !== false" type="success" size="small">读取</n-tag>
          <n-tag v-if="currentAuthedDir.writable !== false" type="warning" size="small">写入</n-tag>
          <n-tag v-if="currentAuthedDir.downloadable !== false" type="info" size="small">下载</n-tag>
          <n-tag v-if="currentAuthedDir.deletable !== false" type="error" size="small">删除</n-tag>
        </n-space>
      </div>

      <!-- 表格 -->
      <n-spin :show="currentTab?.loading || false">
        <n-data-table
          :columns="tableColumns"
          :data="currentTab?.filteredFileList || currentTab?.fileList || []"
          :bordered="false"
          :row-key="(row: FileInfo) => row.path"
          :pagination="{ pageSize: 50, pageSizeOptions: [20, 50, 100, 200] }"
          :row-class-name="(_rowIndex: number, rowData: FileInfo) => rowData.type === 'directory' ? 'clickable-row' : ''"
          :row-props="rowProps"
          v-model:checked-row-keys="selectedRows"
          @update:checked-row-keys="handleSelectionChange"
        />
      </n-spin>

      <!-- 空状态 -->
      <n-empty
        v-if="!currentTab?.loading && (currentTab?.fileList?.length === 0)"
        description="该文件夹为空"
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

    <!-- 上传对话框 -->
    <n-modal v-model:show="showUploadDialog" preset="dialog" title="上传文件" style="width: 600px">
      <!-- 上传模式选择 -->
      <n-radio-group v-model:value="uploadMode" style="margin-bottom: 16px">
        <n-radio value="file">上传文件</n-radio>
        <n-radio value="directory">上传文件夹</n-radio>
      </n-radio-group>
      
      <n-upload
        v-if="uploadMode === 'file'"
        multiple
        :custom-request="handleFileUpload"
        :show-file-list="false"
        @change="handleFileUploadChange"
      >
        <n-upload-dragger>
          <div style="margin-bottom: 12px">
            <n-icon size="48" :depth="3"><DocumentOutline /></n-icon>
          </div>
          <n-text style="font-size: 16px">点击或拖拽文件到此区域上传</n-text>
          <n-p depth="3" style="margin: 8px 0 0 0">支持单个或批量上传</n-p>
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
        <n-upload-dragger>
          <div style="margin-bottom: 12px">
            <n-icon size="48" :depth="3"><FolderOutline /></n-icon>
          </div>
          <n-text style="font-size: 16px">点击或拖拽文件夹到此区域上传</n-text>
          <n-p depth="3" style="margin: 8px 0 0 0">将保持文件夹结构并自动创建目录</n-p>
        </n-upload-dragger>
      </n-upload>

      <!-- 上传进度 -->
      <div v-if="uploadProgress.length" class="upload-progress">
        <n-divider />
        <div class="upload-summary">
          <n-tag :type="uploadFailedCount > 0 ? 'warning' : 'success'">
            成功: {{ uploadSuccessCount }} / 失败: {{ uploadFailedCount }} / 总数: {{ uploadTotal }}
          </n-tag>
        </div>
        <div v-for="(item, index) in uploadProgress" :key="index" class="progress-item">
          <span :title="item.fullPath">{{ item.name }}</span>
          <n-progress type="line" :percentage="item.percentage" :status="item.status" />
        </div>
      </div>
    </n-modal>

    <!-- 新建文件夹对话框 -->
    <n-modal v-model:show="showCreateDirDialog" preset="dialog" title="新建文件夹">
      <n-form-item label="文件夹名称">
        <n-input
          v-model:value="newFolderName"
          placeholder="请输入文件夹名称"
          @keyup.enter="createDirectory"
        />
      </n-form-item>
      <template #action>
        <n-button @click="showCreateDirDialog = false">取消</n-button>
        <n-button type="primary" @click="createDirectory" :loading="creating">创建</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, watch, nextTick } from 'vue'
import { useMessage, useDialog, NButton, NIcon, NTag, NInput, NTooltip, type DataTableColumns, type SelectOption, type DropdownOption, NDropdown, NBreadcrumb, NBreadcrumbItem, NDivider, NInputGroup } from 'naive-ui'
import { fileService } from '@/api/services/file'
import type { FileInfo, AuthedDir } from '@/types'
import {
  CloudUploadOutline, AddOutline, RefreshOutline, HomeOutline, FolderOutline,
  DocumentOutline, TrashOutline, CreateOutline, DownloadOutline, LockClosedOutline,
  EyeOutline, InformationCircleOutline, CopyOutline, CutOutline, ClipboardOutline,
  ChevronBackOutline, ChevronForwardOutline, ArrowUpOutline, SearchOutline,
  OpenOutline, FolderOpenOutline
} from '@vicons/ionicons5'
import { format } from 'date-fns'

const message = useMessage()
const dialog = useDialog()

// ============ 类型定义 ============
interface FileTab {
  id: string
  name: string
  path: string
  fileList: FileInfo[]
  filteredFileList?: FileInfo[]
  loading: boolean
  backHistory: string[]
  forwardHistory: string[]
  rootPath: string
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
const newFolderName = ref('')
const creating = ref(false)
const uploadProgress = ref<Array<{ name: string; percentage: number; status: string; fullPath: string }>>([])
const clipboardData = ref<ClipboardData>({
  files: [],
  isCut: false,
  sourcePath: ''
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
      options.push({ label: '打开', key: 'open', icon: () => h(NIcon, null, { default: () => h(FolderOpenOutline) }) })
    } else {
      options.push({ label: '打开', key: 'open', icon: () => h(NIcon, null, { default: () => h(OpenOutline) }) })
      options.push({ label: '下载', key: 'download', icon: () => h(NIcon, null, { default: () => h(DownloadOutline) }) })
    }
    options.push({ type: 'divider', key: 'd1' })
    options.push({ label: '复制', key: 'copy', icon: () => h(NIcon, null, { default: () => h(CopyOutline) }) })
    options.push({ label: '剪切', key: 'cut', icon: () => h(NIcon, null, { default: () => h(CutOutline) }) })
    options.push({ type: 'divider', key: 'd2' })
    options.push({ label: '重命名', key: 'rename', icon: () => h(NIcon, null, { default: () => h(CreateOutline) }) })
    options.push({ label: '删除', key: 'delete', icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) })
  }

  return options
})

// ============ 表格列配置 ============
const tableColumns = computed<DataTableColumns<FileInfo>>(() => [
  {
    type: 'selection',
    width: 50,
  },
  {
    title: '名称',
    key: 'name',
    render: (row) => {
      return h('div', { class: 'file-name-cell' }, [
        h(NIcon, { size: 20 }, { default: () => h(row.type === 'directory' ? FolderOutline : DocumentOutline) }),
        h('span', { class: 'file-name' }, row.name)
      ])
    }
  },
  {
    title: '大小',
    key: 'size',
    width: 100,
    render: (row) => row.type === 'directory' ? '-' : formatBytes(row.size)
  },
  {
    title: '修改日期',
    key: 'lastModified',
    width: 180,
    render: (row) => format(new Date(row.lastModified), 'yyyy-MM-dd HH:mm')
  },
  {
    title: '类型',
    key: 'type',
    width: 80,
    render: (row) => h(NTag, { size: 'small', type: row.type === 'directory' ? 'info' : 'default' }, { default: () => row.type === 'directory' ? '文件夹' : '文件' })
  }
])

// 行属性（用于双击）
const rowProps = (row: FileInfo) => ({
  onDblclick: () => handleRowDoubleClick(row),
  onContextmenu: (e: MouseEvent) => showContextMenu(e, row)
})

// ============ 标签页管理 ============
function generateTabId(): string {
  return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

function addNewTab(path?: string, name?: string) {
  const rootPath = selectedRootPath.value || '/'
  const tabPath = path || rootPath
  const tabName = name || tabPath.split(/[\/\\]/).filter(Boolean).pop() || '根目录'

  const newTab: FileTab = {
    id: generateTabId(),
    name: tabName,
    path: tabPath,
    fileList: [],
    loading: false,
    backHistory: [],
    forwardHistory: [],
    rootPath
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
async function fetchTabFiles(tab: FileTab) {
  tab.loading = true
  try {
    const response = await fileService.getFileList(tab.path)
    // 兼容 list 和 records 两种字段
    tab.fileList = response.list || response.records || []
    tab.filteredFileList = undefined
    searchKeyword.value = ''

    // 更新标签页名称
    const pathParts = tab.path.split(/[\/\\]/).filter(Boolean)
    tab.name = pathParts.length > 0 ? pathParts[pathParts.length - 1] : tab.rootPath.split(/[\/\\]/).filter(Boolean).pop() || '根目录'
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '获取文件列表失败')
    tab.fileList = []
  } finally {
    tab.loading = false
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
    await fileService.downloadFile(file.path, file.name)
    message.success('下载开始')
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '下载失败')
  }
}

function renameFile(file: FileInfo) {
  const newNameRef = ref(file.name)
  dialog.create({
    title: '重命名',
    content: () => h('div', [
      h('p', { style: 'margin-bottom: 8px' }, `将 "${file.name}" 重命名为:`),
      h(NInput, {
        value: newNameRef.value,
        placeholder: '请输入新名称',
        onUpdateValue: (val) => { newNameRef.value = val }
      }),
    ]),
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      if (!newNameRef.value.trim()) {
        message.error('名称不能为空')
        return false
      }
      if (newNameRef.value === file.name) return

      try {
        await fileService.renameFile(file.path, newNameRef.value)
        message.success('重命名成功')
        refreshCurrentTab()
      } catch (error: unknown) {
        const err = error as Error
        message.error(err.message || '重命名失败')
      }
    },
  })
}

async function deleteFiles(files: FileInfo[]) {
  const paths = files.map(f => f.path)
  const isDir = files.some(f => f.type === 'directory')

  dialog.warning({
    title: '确认删除',
    content: `确定要删除 "${files.map(f => f.name).join(', ')}" 吗？${isDir ? '\n注意：删除文件夹将递归删除其中所有文件！' : ''}`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await fileService.deleteFiles(paths)
        message.success('删除成功')
        refreshCurrentTab()
      } catch (error: unknown) {
        const err = error as Error
        message.error(err.message || '删除失败')
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
  message.success(isCut ? '已剪切文件' : '已复制文件')
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
      message.success('移动完成')
    } else {
      await fileService.copyFiles(operations)
      message.success('复制完成')
    }
    clearClipboard()
    refreshCurrentTab()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '操作失败')
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
  
  // 过滤出文件（不支持下载文件夹）
  const files = selected.filter(f => f.type !== 'directory')
  if (files.length === 0) {
    message.warning('请选择文件进行下载，文件夹不支持直接下载')
    return
  }
  
  // 逐个下载文件
  files.forEach(file => {
    downloadFile(file)
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
    message.error('请输入文件夹名称')
    return
  }
  creating.value = true

  const dirPath = currentPath.value === '/' ? `/${newFolderName.value}` : `${currentPath.value}/${newFolderName.value}`

  fileService.createDir(dirPath)
    .then(() => {
      message.success('创建成功')
      showCreateDirDialog.value = false
      newFolderName.value = ''
      refreshCurrentTab()
    })
    .catch((error: unknown) => {
      const err = error as Error
      message.error(err.message || '创建失败')
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
  const fileName = file.name || fileObj?.name || '未知文件'
  const fileId = file.id
  
  const targetDir = getTargetDir()
  if (!targetDir || targetDir === '/') {
    message.error('请先选择一个有效的目录')
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
    message.error(`${fileName}: ${err.message || '上传失败'}`)
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
  const fileName = file.name || fileObj?.name || '未知文件'
  
  // 获取文件夹内的相对路径
  // Naive UI 使用 fullPath，原生 File API 使用 webkitRelativePath
  const relativePath = file.fullPath || (fileObj as File & { webkitRelativePath?: string })?.webkitRelativePath || ''
  if (!relativePath) {
    // 如果还是获取不到路径，使用文件名
    console.warn('无法获取文件相对路径，使用文件名:', fileName)
  }
  
  const targetDir = getTargetDir()
  if (!targetDir || targetDir === '/') {
    message.error('请先选择一个有效的目录')
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
    message.error(`${fileName}: ${err.message || '上传失败'}`)
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
  const fileName = file.name || fileObj?.name || '未知文件'
  
  const relativePath = file.path || ''
  const targetDir = getTargetDir()
  
  if (!targetDir || targetDir === '/') {
    message.error('请先选择一个有效的目录')
    onError()
    return
  }

  if (!fileObj) {
    message.error('文件对象为空')
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
    message.error(`${fileName}: ${err.message || '上传失败'}`)
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
        addNewTab(readableDir.path, readableDir.path.split('/').filter(Boolean).pop() || '根目录')
      }
    }
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '获取权限目录失败')
  }
}

onMounted(() => {
  fetchAuthedDirs()
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
  gap: 8px;
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
  padding: 8px 12px;
}

.path-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.path-separator {
  color: var(--n-text-color-disabled);
  margin: 0 4px;
}

.clipboard-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--n-border-color);
}

.file-content-card {
  flex: 1;
  overflow: auto;
}

.permission-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--n-border-color);
  border-radius: 6px;
  margin-bottom: 12px;
}

.permission-tags {
  display: flex;
  gap: 8px;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  cursor: pointer;
}

.file-name:hover {
  color: var(--n-primary-color);
}

.upload-progress {
  margin-top: 16px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.progress-item span {
  min-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.clickable-row) {
  cursor: pointer;
}

:deep(.clickable-row:hover) {
  background-color: var(--n-rowHoverColor);
}
</style>
