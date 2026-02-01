<template>
  <div class="log-management-container">
    <div class="page-header">
      <h1 class="page-title">{{ t('logManagement.title') }}</h1>
      <p class="page-subtitle">{{ t('logManagement.subtitle') }}</p>
    </div>

    <div class="filter-card">
      <n-form ref="filterFormRef" :model="filterForm" inline>
        <n-form-item :label="t('logManagement.moduleName')" path="moduleName">
          <n-input
            v-model:value="filterForm.moduleName"
            :placeholder="t('logManagement.moduleNamePlaceholder')"
            clearable
          />
        </n-form-item>

        <n-form-item :label="t('logManagement.userName')" path="userName">
          <n-input
            v-model:value="filterForm.userName"
            :placeholder="t('logManagement.userNamePlaceholder')"
            clearable
          />
        </n-form-item>

        <n-form-item :label="t('logManagement.exceptionType')" path="exceptionType">
          <n-input
            v-model:value="filterForm.exceptionType"
            :placeholder="t('logManagement.exceptionTypePlaceholder')"
            clearable
          />
        </n-form-item>

        <n-form-item :label="t('logManagement.timeRange')" path="timeRange">
          <n-date-picker
            v-model:value="filterForm.timeRange"
            type="datetimerange"
            clearable
            style="width: 320px"
          />
        </n-form-item>

        <n-form-item>
          <n-button type="primary" @click="handleSearch">
            <template #icon><n-icon><SearchOutline /></n-icon></template>
            {{ t('common.search') }}
          </n-button>
          <n-button style="margin-left: 12px" @click="handleReset">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            {{ t('common.refresh') }}
          </n-button>
        </n-form-item>
      </n-form>
    </div>

    <div class="data-card">
      <div class="table-header">
        <span class="total-count">{{ t('common.total', { n: totalCount }) }}</span>
        <n-button type="error" @click="showClearDialog = true">
          <template #icon><n-icon><TrashOutline /></n-icon></template>
          {{ t('logManagement.clearLogs') }}
        </n-button>
      </div>

      <div class="table-wrapper">
        <n-data-table
          :columns="columns"
          :data="logList"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: ErrorLog) => row.id"
          :scroll-x="1400"
          :single-line="false"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>

      <n-modal v-model:show="showDetailModal" preset="card" :title="t('logManagement.detailTitle')" :style="{ width: '90vw', maxWidth: '1000px', height: '90vh' }" content-style="display: flex; flex-direction: column; overflow: hidden;">
        <div style="flex: 1; overflow-y: auto; padding-right: 8px;">
          <n-descriptions :column="1" label-placement="left" bordered size="small">
            <n-descriptions-item :label="t('logManagement.id')">
              <n-code :code="selectedLog?.id || ''" language="text" word-wrap />
            </n-descriptions-item>
            <n-descriptions-item :label="t('logManagement.userName')">
              {{ selectedLog?.userName || '-' }}
            </n-descriptions-item>
            <n-descriptions-item :label="t('logManagement.moduleName')">
              {{ selectedLog?.moduleName || '-' }}
            </n-descriptions-item>
            <n-descriptions-item :label="t('logManagement.exceptionType')">
              <n-tag type="error">{{ selectedLog?.exceptionType || '-' }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item :label="t('logManagement.errorMessage')">
              <n-alert type="error" :show-icon="false" style="max-height: 150px; overflow-y: auto; word-break: break-word;">
                {{ selectedLog?.errorMessage || '-' }}
              </n-alert>
            </n-descriptions-item>
            <n-descriptions-item :label="t('logManagement.uri')">
              {{ selectedLog?.method }} {{ selectedLog?.uri || '-' }}
            </n-descriptions-item>
            <n-descriptions-item :label="t('logManagement.ipAddress')">
              {{ selectedLog?.ipAddress || '-' }}
            </n-descriptions-item>
            <n-descriptions-item :label="t('logManagement.createdTime')">
              {{ formatDate(selectedLog?.createdTime) }}
            </n-descriptions-item>
            <n-descriptions-item :label="t('logManagement.params')">
              <n-code :code="selectedLog?.params || '{}'" language="json" style="max-height: 180px; overflow: auto;" word-wrap />
            </n-descriptions-item>
            <n-descriptions-item :label="t('logManagement.stackTrace')">
              <n-code :code="selectedLog?.stackTrace || ''" language="text" style="max-height: 300px; overflow: auto;" word-wrap />
            </n-descriptions-item>
          </n-descriptions>
        </div>
      </n-modal>

      <n-modal v-model:show="showClearDialog" preset="dialog" type="warning" :title="t('logManagement.clearLogs')">
        <template #default>
          {{ t('logManagement.clearLogsConfirm') }}
          <n-date-picker
            v-model:value="clearTime"
            type="datetime"
            :is-date-disabled="(ts) => ts > Date.now()"
            style="margin-top: 16px; width: 100%"
          />
        </template>
        <template #action>
          <n-button @click="showClearDialog = false">{{ t('common.cancel') }}</n-button>
          <n-button type="error" :loading="clearing" @click="handleClearLogs">
            {{ t('common.confirm') }}
          </n-button>
        </template>
      </n-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import type { DataTableColumns, DataTableInst } from 'naive-ui'
import { NButton, NIcon } from 'naive-ui'
import { SearchOutline, RefreshOutline, TrashOutline, EyeOutline } from '@vicons/ionicons5'
import { logService } from '@/api/services/log'
import type { ErrorLog, LogQueryParams } from '@/types'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const clearing = ref(false)
const showDetailModal = ref(false)
const showClearDialog = ref(false)
const logList = ref<ErrorLog[]>([])
const selectedLog = ref<ErrorLog | null>(null)
const totalCount = ref(0)
const clearTime = ref<number | null>(null)
const tableRef = ref<DataTableInst | null>(null)

const filterForm = reactive({
  moduleName: '',
  userName: '',
  exceptionType: '',
  timeRange: null as [number, number] | null,
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
})

const fetchLogs = async () => {
  loading.value = true
  try {
    const params: LogQueryParams = {
      page: pagination.page - 1,
      size: pagination.pageSize,
      moduleName: filterForm.moduleName || undefined,
      userName: filterForm.userName || undefined,
      exceptionType: filterForm.exceptionType || undefined,
      startTime: filterForm.timeRange ? new Date(filterForm.timeRange[0]).toISOString() : undefined,
      endTime: filterForm.timeRange ? new Date(filterForm.timeRange[1]).toISOString() : undefined,
    }

    const response = await logService.getErrorLogs(params)
    logList.value = response.content || response.list || response.records || []
    totalCount.value = response.totalElements ?? response.total ?? 0
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('logManagement.fetchFailed'))
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchLogs()
}

const handleReset = () => {
  filterForm.moduleName = ''
  filterForm.userName = ''
  filterForm.exceptionType = ''
  filterForm.timeRange = null
  pagination.page = 1
  fetchLogs()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchLogs()
}

const handlePageSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchLogs()
}

const viewDetail = async (log: ErrorLog) => {
  try {
    selectedLog.value = await logService.getErrorLogDetail(log.id)
    showDetailModal.value = true
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('logManagement.fetchDetailFailed'))
  }
}

const handleClearLogs = async () => {
  if (!clearTime.value) {
    message.warning(t('logManagement.selectTime'))
    return
  }

  clearing.value = true
  try {
    const beforeTime = new Date(clearTime.value).toISOString()
    await logService.deleteLogsBefore(beforeTime)
    message.success(t('logManagement.clearSuccess'))
    showClearDialog.value = false
    fetchLogs()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('logManagement.clearFailed'))
  } finally {
    clearing.value = false
  }
}

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

const columns = computed<DataTableColumns<ErrorLog>>(() => [
  {
    title: t('logManagement.id'),
    key: 'id',
    width: 180,
    ellipsis: { tooltip: true },
    fixed: 'left',
  },
  {
    title: t('logManagement.moduleName'),
    key: 'moduleName',
    width: 100,
  },
  {
    title: t('logManagement.userName'),
    key: 'userName',
    width: 100,
  },
  {
    title: t('logManagement.exceptionType'),
    key: 'exceptionType',
    width: 150,
    ellipsis: { tooltip: true },
  },
  {
    title: t('logManagement.errorMessage'),
    key: 'errorMessage',
    width: 250,
    ellipsis: { tooltip: true },
  },
  {
    title: t('logManagement.createdTime'),
    key: 'createdTime',
    width: 170,
    render: (row) => formatDate(row.createdTime),
  },
  {
    title: t('common.action'),
    key: 'actions',
    width: 80,
    fixed: 'right',
    align: 'center',
    render: (row) => h(
      NButton,
      {
        size: 'small',
        type: 'primary',
        onClick: () => viewDetail(row),
      },
      {
        icon: () => h(NIcon, null, { default: () => h(EyeOutline) }),
      }
    ),
  },
])

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped lang="css">
.log-management-container {
  padding: 20px;
  min-height: 100vh;
  background: var(--bg-color);
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color-base);
  margin: 0 0 8px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-color-tertiary);
  margin: 0;
}

.filter-card {
  background: var(--bg-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.data-card {
  background: var(--bg-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.total-count {
  font-size: 14px;
  color: var(--text-color-secondary);
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: 8px;
  background: var(--bg-color);
}

.table-wrapper :deep(.n-data-table) {
  min-width: 1200px;
  font-size: 13px;
}

.table-wrapper :deep(.n-data-table-thead th) {
  background: var(--bg-color);
  font-weight: 600;
  white-space: nowrap;
}

.table-wrapper :deep(.n-data-table-td) {
  padding: 12px 16px;
}

.table-wrapper :deep(.n-data-table-tr) {
  transition: background-color 0.2s ease;
}

.table-wrapper :deep(.n-data-table-tr:hover) {
  background-color: rgba(0, 0, 0, 0.02);
}

@media screen and (max-width: 768px) {
  .log-management-container {
    padding: 12px;
  }
}
</style>
