<template>
  <div class="ddns-view">
    <n-tabs type="card" animated>
      <!-- DDNS任务管理 -->
      <n-tab-pane name="tasks" :tab="t('ddns.tasks')">
        <n-card>

            <n-space>
              <n-button type="primary" @click="showAddTaskDialog = true">
                <template #icon><n-icon><AddOutline /></n-icon></template>
                {{ t('ddns.addTask') }}
              </n-button>
              <n-button type="error" @click="batchDeleteTasks" :disabled="selectedTaskRows.length === 0">
                <template #icon><n-icon><TrashOutline /></n-icon></template>
                {{ t('common.batchDelete') }} ({{ selectedTaskRows.length }})
              </n-button>
            </n-space>
            <div style="height: 16px;"></div>
          <n-data-table
            :columns="taskColumns"
            :data="ddnsTasks"
            :pagination="taskPagination"
            :bordered="true"
            :loading="loading"
            :row-key="(row) => row.id || 'new'"
            :remote="true"
            :single-line="false"
            @update:checked-row-keys="handleTaskRowCheck"
          />
          
          <div class="pagination-bar">
            <n-pagination
              v-model:page="taskPage"
              :page-count="taskTotalPages"
              :on-update:page="fetchTasks"
              :page-slot="5"
            >
              <template #prefix>{{ t('common.total', { count: taskTotalCount }) }}</template>
            </n-pagination>
          </div>
        </n-card>
      </n-tab-pane>

      <!-- 访问密钥管理 -->
      <n-tab-pane name="secrets" :tab="t('ddns.accessKey')">
        <n-card>
          
            <n-space>
              <n-button type="primary" @click="showAddSecretDialog = true">
                <template #icon><n-icon><AddOutline /></n-icon></template>
                {{ t('ddns.addSecret') }}
              </n-button>
              <n-button type="error" @click="batchDeleteSecrets" :disabled="selectedSecretRows.length === 0">
                <template #icon><n-icon><TrashOutline /></n-icon></template>
                {{ t('common.batchDelete') }} ({{ selectedSecretRows.length }})
              </n-button>
            </n-space>
          
          <div style="height: 16px;"></div>
          
          <n-data-table
            :columns="secretColumns"
            :data="accessKeys"
            :pagination="secretPagination"
            :bordered="true"
            :loading="secretLoading"
            :row-key="(row) => row.id"
            :single-line="false"
            @update:checked-row-keys="handleSecretRowCheck"
          />
          
          <div class="pagination-bar">
            <n-pagination
              v-model:page="secretPage"
              :page-count="secretTotalPages"
              :on-update:page="fetchSecrets"
              :page-slot="5"
            >
              <template #prefix>{{ t('common.total', { count: secretTotalCount }) }}</template>
            </n-pagination>
          </div>
        </n-card>
      </n-tab-pane>
    </n-tabs>

    <!-- 新增DDNS任务对话框 -->
    <n-modal v-model:show="showAddTaskDialog" preset="dialog" :title="t('ddns.addTask')" style="width: 700px">
      <n-form :model="newTaskForm" label-placement="left" label-width="140px">
        <n-form-item :label="t('ddns.taskName')">
          <n-input v-model:value="newTaskForm.taskName" :placeholder="t('ddns.placeholder.taskName')" />
        </n-form-item>
        <n-form-item :label="t('ddns.taskDescription')">
          <n-input v-model:value="newTaskForm.taskDescription" :placeholder="t('ddns.placeholder.taskDescription')" />
        </n-form-item>
        <n-form-item :label="t('ddns.ipAddress')">
          <n-input v-model:value="newTaskForm.taskIp" :placeholder="t('ddns.placeholder.ipAddress')" />
        </n-form-item>
        <n-form-item :label="t('ddns.domainRr')">
          <n-input v-model:value="newTaskForm.domainRr" :placeholder="t('ddns.placeholder.domainRr')" />
        </n-form-item>
        <n-form-item :label="t('ddns.mainDomain')" required>
          <n-input v-model:value="newTaskForm.mainDomain" :placeholder="t('ddns.placeholder.mainDomain')" />
        </n-form-item>
        <n-form-item :label="t('ddns.relatedAccessKey')" required>
          <n-select 
            v-model:value="newTaskForm.dnsSecretId" 
            :options="keyOptions" 
            :placeholder="t('ddns.placeholder.selectAccessKey')"
            filterable
          />
        </n-form-item>
        <n-form-item :label="t('ddns.syncInterval')">
          <n-input-number v-model:value="newTaskForm.syncInterval" :min="60" :max="86400" style="width: 200px" />
        </n-form-item>
        <n-form-item :label="t('ddns.isEnabled')">
          <n-switch v-model:value="newTaskForm.statusEnabled" />
        </n-form-item>
        <n-form-item :label="t('ddns.publicIp')">
          <n-switch v-model:value="newTaskForm.isPublicIp" />
        </n-form-item>
        <n-form-item :label="t('ddns.ipType')">
          <n-radio-group v-model:value="newTaskForm.ipType">
            <n-radio value="ipv4">IPv4</n-radio>
            <n-radio value="ipv6">IPv6</n-radio>
          </n-radio-group>
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showAddTaskDialog = false">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" @click="submitAddTask" :loading="saving">{{ t('common.confirm') }}</n-button>
      </template>
    </n-modal>

    <!-- 新增DDNS密钥对话框 -->
    <n-modal v-model:show="showAddSecretDialog" preset="dialog" :title="t('ddns.addSecret')" style="width: 600px">
      <n-form :model="newSecretForm" label-placement="left" label-width="120px">
        <n-form-item label="Access Key" required>
          <n-input v-model:value="newSecretForm.accessKey" :placeholder="t('ddns.placeholder.accessKey')" />
        </n-form-item>
        <n-form-item label="Secret Key" required>
          <n-input v-model:value="newSecretForm.accessSecret" type="password" :placeholder="t('ddns.placeholder.secretKey')" show-password-on="click" />
        </n-form-item>
        <n-form-item :label="t('ddns.secretName')" required>
          <n-input v-model:value="newSecretForm.accessName" :placeholder="t('ddns.placeholder.name')" />
        </n-form-item>
        <n-form-item :label="t('ddns.secretDescription')">
          <n-input v-model:value="newSecretForm.accessDescription" :placeholder="t('ddns.placeholder.description')" />
        </n-form-item>
        <n-form-item :label="t('ddns.dnsProvider')" required>
          <n-select 
            v-model:value="newSecretForm.dnsCode" 
            :options="dnsProviderOptions" 
            :placeholder="t('ddns.placeholder.selectDnsProvider')"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showAddSecretDialog = false">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" @click="submitAddSecret" :loading="secretSaving">{{ t('common.confirm') }}</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NButton, NIcon, NCheckbox, type DataTableColumns, NInputNumber, NSelect, NModal, NForm, NFormItem, NInput, NSwitch, NRadioGroup, NRadio } from 'naive-ui'
import { ddnsTaskService, ddnsConfigService } from '@/api/services/ddns'
import type { DDNSTask, DnsProvider, AccessSecret } from '@/types'
import { AddOutline, SaveOutline, TrashOutline, PlayOutline, PauseOutline, RefreshOutline } from '@vicons/ionicons5'

const { t } = useI18n()
const message = useMessage()

// ==================== 任务相关 ====================

// 状态
const loading = ref(false)
const saving = ref(false)
const ddnsTasks = ref<DDNSTask[]>([])
const selectedTaskRows = ref<(string | number)[]>([])
const showAddTaskDialog = ref(false)

// 分页状态 - 任务
const taskPage = ref(1)
const taskPageSize = ref(30)
const taskTotalPages = ref(1)
const taskTotalCount = ref(0)

// 新增任务表单
const newTaskForm = ref({
  taskName: '',
  taskDescription: '',
  taskIp: '',
  domainRr: '',
  mainDomain: '',
  dnsSecretId: null as number | null,
  syncInterval: 60,
  statusEnabled: true,
  isPublicIp: false,
  ipType: 'ipv4',
})

// IP类型选项
const ipTypeOptions = [
  { label: 'IPv4', value: 'ipv4' },
  { label: 'IPv6', value: 'ipv6' },
]

// 密钥选项
const keyOptions = computed(() =>
  accessKeys.value.map(k => ({ label: `${k.accessName} (ID: ${k.id})`, value: k.id ?? 0 }))
)

// 状态配置
const statusConfig = computed(() => ({
  running: { type: 'success', text: '• ' + t('ddns.running'), color: '#4caf50' },
  paused: { type: 'warning', text: '‖ ' + t('ddns.paused'), color: '#ffc107' },
  completed: { type: 'info', text: '✓ ' + t('ddns.completed'), color: '#2196f3' },
  blocked: { type: 'default', text: '… ' + t('ddns.blocked'), color: '#9e9e9e' },
  error: { type: 'error', text: '✕ ' + t('ddns.error'), color: '#f44336' },
}) as Record<string, { type: string; text: string; color: string }>)

// 任务表格列定义
const taskColumns = computed<DataTableColumns<DDNSTask>>(() => [
  {
    type: 'selection',
    width: 50,
  },
  { 
    title: t('ddns.taskId'), 
    key: 'id', 
    width: 80,
  },
  { 
    title: t('ddns.taskName'), 
    key: 'taskName', 
    width: 120,
  },
  { 
    title: t('ddns.taskDescription'), 
    key: 'taskDescription', 
    width: 150,
    ellipsis: { tooltip: true },
  },
  { 
    title: t('ddns.ipAddress'), 
    key: 'taskIp', 
    width: 120,
  },
  { 
    title: t('ddns.domainRr'), 
    key: 'domainRr', 
    width: 100,
  },
  { 
    title: t('ddns.mainDomain'), 
    key: 'mainDomain', 
    width: 150,
    ellipsis: { tooltip: true },
  },
  { 
    title: t('ddns.relatedAccessKey'), 
    key: 'dnsSecretId', 
    width: 120,
    render: (row) => {
      const key = accessKeys.value.find(k => k.id === row.dnsSecretId)
      return key ? key.accessName : String(row.dnsSecretId || '-')
    }
  },
  { 
    title: t('ddns.syncInterval'), 
    key: 'syncInterval', 
    width: 100,
  },
  { 
    title: t('ddns.isEnabled'), 
    key: 'status', 
    width: 90,
    render: (row) => h(NCheckbox, {
      checked: row.status === 1,
      disabled: true,
    })
  },
  { 
    title: t('ddns.publicIp'), 
    key: 'isPublicIp', 
    width: 70,
    render: (row) => h(NCheckbox, {
      checked: row.isPublicIp === 1,
      disabled: true,
    })
  },
  { 
    title: t('ddns.ipType'), 
    key: 'ipType', 
    width: 80,
    render: (row) => (row.ipType || 'ipv4').toUpperCase()
  },
  { 
    title: t('ddns.realStatus'), 
    key: 'realStatus', 
    width: 100,
    render: (row) => {
      const config = statusConfig.value[row.realStatus || ''] || { type: 'default', text: t('ddns.notFetched'), color: '#616161' }
      return h('span', { style: `color: ${config.color}; font-weight: bold;` }, config.text)
    }
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 200,
    render: (row) => h('div', { class: 'action-buttons' }, [
      // 暂停/恢复按钮
      h(NButton, {
        size: 'small',
        quaternary: true,
        onClick: () => row.status === 1 ? pauseTask(row.id!) : resumeTask(row.id!),
      }, { 
        icon: () => h(NIcon, null, { default: () => h(row.status === 1 ? PauseOutline : PlayOutline) }) 
      }),
      // 重启按钮
      h(NButton, {
        size: 'small',
        quaternary: true,
        onClick: () => restartTask(row.id!),
      }, { 
        icon: () => h(NIcon, null, { default: () => h(RefreshOutline) }) 
      }),
      // 保存按钮（用于更新已存在的任务）
      h(NButton, {
        size: 'small',
        type: 'primary',
        onClick: () => openEditTaskDialog(row),
      }, { 
        icon: () => h(NIcon, null, { default: () => h(SaveOutline) }),
        default: () => t('common.edit')
      }),
      // 删除按钮
      h(NButton, {
        size: 'small',
        quaternary: true,
        type: 'error',
        onClick: () => deleteTask(row.id!),
      }, { 
        icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) 
      }),
    ]),
  },
])

// 分页配置
const taskPagination = computed(() => ({
  page: taskPage.value,
  pageSize: taskPageSize.value,
  pageCount: taskTotalPages.value,
  showSizePicker: true,
  pageSizes: [10, 30, 50, 100],
  itemCount: taskTotalCount.value,
}))

// 处理任务行选择
function handleTaskRowCheck(rowKeys: (string | number)[]) {
  selectedTaskRows.value = rowKeys
}

// 批量删除任务
async function batchDeleteTasks() {
  const idsToDelete = selectedTaskRows.value as number[]
  
  if (idsToDelete.length === 0) {
    message.warning(t('ddns.message.selectTaskToDelete'))
    return
  }
  
  try {
    await Promise.all(idsToDelete.map(id => ddnsTaskService.deleteTask(id)))
    message.success(t('ddns.message.batchDeleteTaskSuccess', { count: idsToDelete.length }))
    selectedTaskRows.value = []
    await fetchTasks(taskPage.value)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('ddns.message.batchDeleteFailed'))
  }
}

// 获取DDNS任务列表
async function fetchTasks(page: number = 1) {
  try {
    loading.value = true
    const response = await ddnsTaskService.getTaskList(page, taskPageSize.value)
    const records = (response.records ?? response.list ?? []) as DDNSTask[]
    
    ddnsTasks.value = records
    taskPage.value = response.page ?? page
    taskTotalPages.value = response.totalPage ?? 1
    taskTotalCount.value = response.total ?? 0
    selectedTaskRows.value = []
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('ddns.message.fetchTasksFailed'))
  } finally {
    loading.value = false
  }
}

// 打开编辑任务对话框
function openEditTaskDialog(task: DDNSTask) {
  newTaskForm.value = {
    taskName: task.taskName || '',
    taskDescription: task.taskDescription || '',
    taskIp: task.taskIp || '',
    domainRr: task.domainRr || '',
    mainDomain: task.mainDomain || '',
    dnsSecretId: task.dnsSecretId || null,
    syncInterval: task.syncInterval || 60,
    statusEnabled: task.status === 1,
    isPublicIp: task.isPublicIp === 1,
    ipType: task.ipType || 'ipv4',
  }
  editingTaskId.value = task.id!
  showAddTaskDialog.value = true
}

// 编辑任务ID
const editingTaskId = ref<number | null>(null)

// 提交新增/编辑任务
async function submitAddTask() {
  if (!newTaskForm.value.mainDomain) {
    message.error(t('ddns.message.enterMainDomain'))
    return
  }
  if (!newTaskForm.value.dnsSecretId) {
    message.error(t('ddns.message.selectAccessKey'))
    return
  }
  
  saving.value = true
  try {
    const taskData = {
      id: editingTaskId.value || 0,
      taskName: newTaskForm.value.taskName,
      taskDescription: newTaskForm.value.taskDescription,
      taskIp: newTaskForm.value.taskIp,
      domainRr: newTaskForm.value.domainRr,
      mainDomain: newTaskForm.value.mainDomain,
      dnsSecretId: newTaskForm.value.dnsSecretId,
      syncInterval: newTaskForm.value.syncInterval,
      status: newTaskForm.value.statusEnabled ? 1 : 0,
      isPublicIp: newTaskForm.value.isPublicIp ? 1 : 0,
      ipType: newTaskForm.value.ipType,
    }
    
    if (editingTaskId.value) {
      // 更新
      await ddnsTaskService.updateTask(taskData as DDNSTask)
      message.success(t('ddns.message.updateTaskSuccess'))
    } else {
      // 新增
      await ddnsTaskService.createTask(taskData as DDNSTask)
      message.success(t('ddns.message.addTaskSuccess'))
    }
    
    showAddTaskDialog.value = false
    editingTaskId.value = null
    resetTaskForm()
    await fetchTasks(taskPage.value)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('ddns.message.operationFailed'))
  } finally {
    saving.value = false
  }
}

// 重置任务表单
function resetTaskForm() {
  newTaskForm.value = {
    taskName: '',
    taskDescription: '',
    taskIp: '',
    domainRr: '',
    mainDomain: '',
    dnsSecretId: null,
    syncInterval: 60,
    statusEnabled: true,
    isPublicIp: false,
    ipType: 'ipv4',
  }
}

// 暂停任务
async function pauseTask(id: number) {
  try {
    await ddnsTaskService.pauseTask(id)
    message.success(t('ddns.message.pauseSuccess'))
    await fetchTasks(taskPage.value)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('ddns.message.pauseFailed'))
  }
}

// 恢复任务
async function resumeTask(id: number) {
  try {
    await ddnsTaskService.resumeTask(id)
    message.success(t('ddns.message.resumeSuccess'))
    await fetchTasks(taskPage.value)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('ddns.message.resumeFailed'))
  }
}

// 重启任务
async function restartTask(id: number) {
  try {
    await ddnsTaskService.restartTask(id)
    message.success(t('ddns.message.restartSuccess'))
    await fetchTasks(taskPage.value)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('ddns.message.restartFailed'))
  }
}

// 删除任务
async function deleteTask(id: number) {
  try {
    await ddnsTaskService.deleteTask(id)
    message.success(t('ddns.message.deleteSuccess'))
    await fetchTasks(taskPage.value)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('ddns.message.deleteTaskFailed'))
  }
}

// ==================== 密钥相关 ====================

// 密钥状态
const secretLoading = ref(false)
const secretSaving = ref(false)
const accessKeys = ref<AccessSecret[]>([])
const selectedSecretRows = ref<(string | number)[]>([])
const dnsProviders = ref<DnsProvider[]>([])
const showAddSecretDialog = ref(false)

// 分页状态 - 密钥
const secretPage = ref(1)
const secretPageSize = ref(30)
const secretTotalPages = ref(1)
const secretTotalCount = ref(0)

// 新增密钥表单
const newSecretForm = ref({
  accessKey: '',
  accessSecret: '',
  accessName: '',
  accessDescription: '',
  dnsCode: null as number | null,
})

// DNS服务商选项
const dnsProviderOptions = computed(() => 
  dnsProviders.value.map(p => ({ label: p.name, value: p.code }))
)

// 密钥表格列定义
const secretColumns = computed<DataTableColumns<AccessSecret>>(() => [
  {
    type: 'selection',
    width: 50,
  },
  { 
    title: t('ddns.secretId'), 
    key: 'id', 
    width: 80,
  },
  { 
    title: 'Access Key', 
    key: 'accessKey', 
    width: 200,
    ellipsis: { tooltip: true },
  },
  { 
    title: 'Secret Key', 
    key: 'accessSecret', 
    width: 200,
    ellipsis: { tooltip: true },
  },
  { 
    title: t('ddns.secretName'), 
    key: 'accessName', 
    width: 150,
  },
  { 
    title: t('ddns.secretDescription'), 
    key: 'accessDescription', 
    width: 200,
    ellipsis: { tooltip: true },
  },
  { 
    title: t('ddns.dnsProvider'), 
    key: 'dnsCode', 
    width: 120,
    render: (row) => {
      const provider = dnsProviders.value.find(p => p.code === row.dnsCode)
      return provider?.name || t('ddns.provider', { code: row.dnsCode }) || '-'
    }
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 150,
    render: (row) => h('div', { class: 'action-buttons' }, [
      // 编辑按钮
      h(NButton, {
        size: 'small',
        type: 'primary',
        onClick: () => openEditSecretDialog(row),
      }, { 
        icon: () => h(NIcon, null, { default: () => h(SaveOutline) }),
        default: () => t('common.edit')
      }),
      // 删除按钮
      h(NButton, {
        size: 'small',
        quaternary: true,
        type: 'error',
        onClick: () => deleteSecret(row.id!),
      }, { 
        icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) 
      }),
    ]),
  },
])

// 分页配置
const secretPagination = computed(() => ({
  page: secretPage.value,
  pageSize: secretPageSize.value,
  pageCount: secretTotalPages.value,
  showSizePicker: true,
  pageSizes: [10, 30, 50, 100],
  itemCount: secretTotalCount.value,
}))

// 处理密钥行选择
function handleSecretRowCheck(rowKeys: (string | number)[]) {
  selectedSecretRows.value = rowKeys
}

// 批量删除密钥
async function batchDeleteSecrets() {
  const idsToDelete = selectedSecretRows.value as number[]
  
  if (idsToDelete.length === 0) {
    message.warning(t('ddns.message.selectSecretToDelete'))
    return
  }
  
  try {
    await Promise.all(idsToDelete.map(id => ddnsConfigService.deleteAccessKey(String(id))))
    message.success(t('ddns.message.batchDeleteSecretSuccess', { count: idsToDelete.length }))
    selectedSecretRows.value = []
    await fetchSecrets(secretPage.value)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('ddns.message.batchDeleteFailed'))
  }
}

// 获取访问密钥列表
async function fetchSecrets(page: number = 1) {
  try {
    secretLoading.value = true
    const response = await ddnsConfigService.getAccessKeys(page, secretPageSize.value)
    const records = (response.records ?? response.list ?? []) as AccessSecret[]
    
    accessKeys.value = records
    secretPage.value = response.page ?? page
    secretTotalPages.value = response.totalPage ?? 1
    secretTotalCount.value = response.total ?? 0
    selectedSecretRows.value = []
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('ddns.message.fetchSecretsFailed'))
  } finally {
    secretLoading.value = false
  }
}

// 获取DNS服务商列表
async function fetchDnsProviders() {
  try {
    dnsProviders.value = await ddnsConfigService.getDnsProviders()
  } catch (error) {
    console.error('获取DNS服务商失败', error)
  }
}

// 编辑密钥ID
const editingSecretId = ref<number | null>(null)

// 打开编辑密钥对话框
function openEditSecretDialog(secret: AccessSecret) {
  newSecretForm.value = {
    accessKey: secret.accessKey,
    accessSecret: secret.accessSecret || '',
    accessName: secret.accessName,
    accessDescription: secret.accessDescription || '',
    dnsCode: secret.dnsCode || null,
  }
  editingSecretId.value = secret.id!
  showAddSecretDialog.value = true
}

// 提交新增/编辑密钥
async function submitAddSecret() {
  if (!newSecretForm.value.accessKey) {
    message.error(t('ddns.message.enterAccessKey'))
    return
  }
  if (!newSecretForm.value.accessSecret) {
    message.error(t('ddns.message.enterSecretKey'))
    return
  }
  if (!newSecretForm.value.accessName) {
    message.error(t('ddns.message.enterName'))
    return
  }
  if (!newSecretForm.value.dnsCode) {
    message.error(t('ddns.message.selectDnsProvider'))
    return
  }
  
  secretSaving.value = true
  try {
    if (editingSecretId.value) {
      // 更新
      await ddnsConfigService.updateAccessKey({
        id: editingSecretId.value,
        ...newSecretForm.value,
      } as AccessSecret)
      message.success(t('ddns.message.updateSecretSuccess'))
    } else {
      // 新增
      await ddnsConfigService.addAccessKey({
        ...newSecretForm.value,
      } as AccessSecret)
      message.success(t('ddns.message.addSecretSuccess'))
    }
    
    showAddSecretDialog.value = false
    editingSecretId.value = null
    resetSecretForm()
    await fetchSecrets(secretPage.value)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('ddns.message.operationFailed'))
  } finally {
    secretSaving.value = false
  }
}

// 重置密钥表单
function resetSecretForm() {
  newSecretForm.value = {
    accessKey: '',
    accessSecret: '',
    accessName: '',
    accessDescription: '',
    dnsCode: null,
  }
}

// 删除密钥
async function deleteSecret(id: number) {
  try {
    await ddnsConfigService.deleteAccessKey(String(id))
    message.success(t('ddns.message.deleteSuccess'))
    await fetchSecrets(secretPage.value)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('ddns.message.deleteSecretFailed'))
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  await Promise.all([
    fetchDnsProviders(),
    fetchTasks(1),
    fetchSecrets(1),
  ])
})
</script>

<style scoped lang="css">
.ddns-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
}

.pagination-bar {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--n-border-color);
}
</style>
