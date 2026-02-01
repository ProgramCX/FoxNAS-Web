<template>
  <div class="directory-tree">
    <n-spin :show="loading">
      <n-input-group>
        <n-input :value="modelValue || t('users.selectDirectory')" readonly :placeholder="t('users.selectDirectory')" />
        <n-button @click="showTreeDialog = true" :disabled="loading">
          <template #icon><n-icon>
              <FolderOpenOutline />
            </n-icon></template>
        </n-button>
      </n-input-group>
    </n-spin>

    <n-modal v-model:show="showTreeDialog" preset="dialog" :title="t('users.selectDirectory')"
      style="width: 500px; max-width: 90vw;" :mask-closable="true">
      <n-spin :show="loading">
        <div class="tree-container">
          <n-input v-if="selectedPath" :value="selectedPath" readonly style="margin-bottom: 12px; font-weight: bold;" />
          <n-tree v-if="!searchKeyword && treeData.length > 0" :data="treeData" :show-irrelevant-nodes="false"
            :node-props="nodeProps" :on-load="handleLoad" accordion virtual-scroll
            style="height: 350px; overflow: auto;" @click="handleTreeClick" />
          <n-input v-else :value="searchResult" readonly type="textarea" :rows="8" style="margin-bottom: 8px" />
        </div>
      </n-spin>

      <template #action>
        <n-button @click="resetSelection">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" @click="confirmSelection" :disabled="!selectedPath">
          {{ t('common.confirm') }}
        </n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { NInput, NButton, NIcon, NSpin, NModal, NTree, NInputGroup } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { userService } from '@/api/services/user'
import { FolderOpenOutline } from '@vicons/ionicons5'

interface DirInfo {
  name: string
  path: string
  childCount: number
}

interface TreeNode {
  key: string
  label: string
  path: string
  isLeaf?: boolean
  children?: TreeNode[]
  loading?: boolean
}

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { t } = useI18n()

const loading = ref(false)
const showTreeDialog = ref(false)
const selectedPath = ref(props.modelValue || '')
const searchKeyword = ref('')
const searchResult = ref('')
const directoryCache = new Map<string, TreeNode[]>()
const treeData = ref<TreeNode[]>([])

const nodeProps = () => ({
  onClick: (_: MouseEvent, node: TreeNode) => {
    selectedPath.value = node.path
  },
})

function getTreeOptions() {
  fetchDirectories("").then((nodes) => {
    treeData.value = nodes
  }).catch((error) => {
    console.error('Error fetching root directories:', error)
  })
  return []
}

onMounted(() => {
  loading.value = true
  getTreeOptions()
  loading.value = false
})

async function fetchDirectories(path: string): Promise<TreeNode[]> {
  if (directoryCache.has(path)) {
    return directoryCache.get(path)!
  }

  try {
    const response = await userService.getDirs(path)
    const dirs: DirInfo[] = ((response as Record<string, unknown>).data as DirInfo[]) || []
    const nodes: TreeNode[] = dirs.map((dir: DirInfo) => ({
      key: `dir-${dir.path.replace(/[:\/\\]/g, '-')}`,
      label: dir.name,
      path: dir.path,
      isLeaf: dir.childCount === 0,
      children: dir.childCount > 0 ? undefined : [],
    }))

    directoryCache.set(path, nodes)
    return nodes
  } catch (error) {
    console.error('Failed to fetch directories:', error)
    return []
  }
}

async function handleLoad(node: TreeNode): Promise<void> {
  const children = await fetchDirectories(node.path)
  node.children = children
  node.isLeaf = children.length === 0
}

function handleTreeClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const contentEl = target.closest('.n-tree-node-content')
  if (contentEl) {
    const contentText = contentEl.querySelector('.n-tree-node-content__text')
    if (contentText) {
      const label = contentText.textContent
      const node = findNodeByLabel(treeData.value, label)
      if (node) {
        selectedPath.value = node.path
      }
    }
  }
}

function findNodeByLabel(nodes: TreeNode[], label: string): TreeNode | null {
  for (const node of nodes) {
    if (node.label === label) return node
    if (node.children) {
      const found = findNodeByLabel(node.children, label)
      if (found) return found
    }
  }
  return null
}

function resetSelection() {
  showTreeDialog.value = false
  searchKeyword.value = ''
  searchResult.value = ''
}

function confirmSelection() {
  emit('update:modelValue', selectedPath.value)
  showTreeDialog.value = false
  searchKeyword.value = ''
  searchResult.value = ''
}

watch(
  () => props.modelValue,
  (newValue) => {
    selectedPath.value = newValue || ''
  }
)

watch(showTreeDialog, (newValue) => {
  if (!newValue) {
    searchKeyword.value = ''
    searchResult.value = ''
  }
})
</script>

<style scoped lang="css">
.directory-tree {
  width: 100%;
}

.tree-container {
  max-height: 350px;
  overflow: auto;
}
</style>
