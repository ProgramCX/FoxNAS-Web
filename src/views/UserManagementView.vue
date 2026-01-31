<template>
  <div class="user-management">
    <n-card :title="t('users.title')">
      <template #header-extra>
        <n-space>
          <n-input v-model:value="searchKeyword" :placeholder="t('users.searchUser')" clearable style="width: 200px">
            <template #prefix>
              <n-icon><SearchOutline /></n-icon>
            </template>
          </n-input>
          <n-button type="primary" @click="showAddUserDialog = true">
            <template #icon><n-icon><AddOutline /></n-icon></template>
            {{ t('users.addUser') }}
          </n-button>
        </n-space>
      </template>

      <n-data-table
        :columns="columns"
        :data="filteredUsers"
        :pagination="pagination"
        :bordered="false"
        :loading="loading"
        :remote="true"
      />
    </n-card>

    <!-- 添加/编辑用户对话框 -->
    <n-modal v-model:show="showAddUserDialog" preset="dialog" :title="isEdit ? t('users.editUser') : t('users.addUser')" style="width: 500px">
      <n-form :model="userForm" label-placement="left" label-width="100px" :rules="userRules">
        <n-form-item :label="t('users.username')" path="userName">
          <n-input v-model:value="userForm.userName" :placeholder="t('users.usernamePlaceholder')" :disabled="isEdit" />
        </n-form-item>
        <n-form-item v-if="!isEdit" :label="t('users.password')" path="password">
          <n-input v-model:value="userForm.password" type="password" :placeholder="t('users.passwordPlaceholder')" show-password-on="click" />
        </n-form-item>
        <n-form-item :label="t('users.status')">
          <n-switch v-model:value="userForm.enabled">
            <template #checked>{{ t('users.active') }}</template>
            <template #unchecked>{{ t('users.blocked') }}</template>
          </n-switch>
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showAddUserDialog = false">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" @click="saveUser" :loading="saving">{{ t('common.save') }}</n-button>
      </template>
    </n-modal>

    <!-- 修改密码对话框 -->
    <n-modal v-model:show="showPasswordDialog" preset="dialog" :title="t('users.changePassword')" style="width: 400px">
      <n-form :model="passwordData" label-placement="left" label-width="80px">
        <n-form-item :label="t('users.newPassword')" required>
          <n-input v-model:value="passwordData.newPassword" type="password" :placeholder="t('users.enterNewPassword')" show-password-on="click" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showPasswordDialog = false">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" @click="changePassword" :loading="changingPassword">{{ t('common.confirm') }}</n-button>
      </template>
    </n-modal>

    <!-- 用户系统权限对话框 -->
    <n-modal v-model:show="showPermissionDialog" preset="dialog" :title="t('users.systemPermissions')" style="width: 600px">
      <div v-if="currentUserUuid">
        <n-spin :show="loadingPermissions">
          <n-empty v-if="allPermissions.length === 0" :description="t('users.noPermissions')" />
          <n-grid v-else :cols="1" :x-gap="12">
            <n-gi>
              <n-list hoverable>
                <template #header>
                  <n-space justify="space-between" align="center">
                    <span>{{ t('users.allPermissions') }}</span>
                    <n-button size="small" quaternary circle @click="loadPermissions">
                      <template #icon><n-icon><RefreshOutline /></n-icon></template>
                    </n-button>
                  </n-space>
                </template>
                <n-list-item v-for="permission in allPermissions" :key="permission.name">
                  <n-thing>
                    <template #header>{{ permission.description }}</template>
                    <template #header-extra>
                      <n-button v-if="isPermissionGranted(permission.name)" type="success" size="small" @click="revokePermission(permission.name)">
                        {{ t('users.revokePermission') }}
                      </n-button>
                      <n-button v-else type="info" size="small" @click="grantPermission(permission.name)">
                        {{ t('users.grantPermission') }}
                      </n-button>
                    </template>
                  </n-thing>
                </n-list-item>
              </n-list>
            </n-gi>
          </n-grid>
        </n-spin>
      </div>
      <template #action>
        <n-button @click="showPermissionDialog = false">{{ t('common.close') }}</n-button>
      </template>
    </n-modal>

    <!-- 用户目录权限对话框 -->
    <n-modal v-model:show="showDirPermissionDialog" preset="dialog" :title="t('users.dirPermissions')" style="width: 800px">
      <div v-if="currentUserUuid">
        <n-space justify="space-between" style="margin-bottom: 16px">
          <n-button type="primary" @click="showAddDirDialog = true">
            <template #icon><n-icon><AddOutline /></n-icon></template>
            {{ t('users.addDir') }}
          </n-button>
          <n-button @click="loadUserResources">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            {{ t('users.refreshPermissions') }}
          </n-button>
        </n-space>

        <n-spin :show="loadingResources">
          <n-empty v-if="userResources.length === 0" :description="t('users.noDirsAvailable')" />
          <n-data-table
            v-else
            :columns="dirPermissionColumns"
            :data="userResources"
            :bordered="false"
            size="small"
          />
        </n-spin>
      </div>
      <template #action>
        <n-button @click="showDirPermissionDialog = false">{{ t('common.close') }}</n-button>
      </template>
    </n-modal>

    <!-- 添加/编辑目录权限对话框 -->
    <n-modal v-model:show="showAddDirDialog" preset="dialog" :title="editingDir ? t('users.editDir') : t('users.addDir')" style="width: 500px">
      <n-form :model="dirForm" label-placement="left" label-width="100px">
        <n-form-item :label="t('users.dirPath')" required>
          <n-input v-model:value="dirForm.folderName" :placeholder="t('users.enterDirPath')" />
        </n-form-item>
        <n-form-item :label="t('users.dirReadPermission')">
          <n-checkbox v-model:checked="dirForm.canRead">{{ t('users.read') }}</n-checkbox>
        </n-form-item>
        <n-form-item :label="t('users.dirWritePermission')">
          <n-checkbox v-model:checked="dirForm.canWrite">{{ t('users.write') }}</n-checkbox>
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showAddDirDialog = false">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" @click="saveDirPermission" :loading="savingDir">{{ t('common.save') }}</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useMessage, NButton, NIcon, NTag, NSwitch, NCheckbox, NPopconfirm, DataTableColumns, NSpin, NEmpty, NList, NListItem, NThing, NGrid, NGi, NSpace } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { userService } from '@/api/services/user'
import type { User, UserPermission, UserResource } from '@/types'
import { AddOutline, TrashOutline, CreateOutline, LockClosedOutline, SearchOutline, KeyOutline, FolderOutline, RefreshOutline, ShieldOutline } from '@vicons/ionicons5'

const message = useMessage()
const { t } = useI18n()

// 状态
const loading = ref(false)
const saving = ref(false)
const changingPassword = ref(false)
const savingDir = ref(false)
const loadingPermissions = ref(false)
const loadingResources = ref(false)
const users = ref<User[]>([])
const allPermissions = ref<Array<{name: string, description: string}>>([])
const grantedPermissions = ref<string[]>([])
const userResources = ref<UserResource[]>([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(30)
const totalPages = ref(0)
const totalRecords = ref(0)

// 对话框状态
const showAddUserDialog = ref(false)
const showPasswordDialog = ref(false)
const showPermissionDialog = ref(false)
const showDirPermissionDialog = ref(false)
const showAddDirDialog = ref(false)
const isEdit = ref(false)
const editingDir = ref<UserResource | null>(null)
const currentUserUuid = ref<string>('')
const currentRowIndex = ref<number>(-1)

const userForm = ref({
  userName: '',
  password: '',
  enabled: true,
  state: 'enabled' as 'enabled' | 'disabled',
})

const passwordData = ref({
  newPassword: '',
})

const dirForm = ref({
  folderName: '',
  canRead: true,
  canWrite: false,
})

const userRules = {
  userName: [
    { required: true, message: t('users.usernameRequired') },
    { min: 3, message: t('users.usernameMinLength') },
    { max: 32, message: t('users.usernameMaxLength') },
  ],
  password: [
    { required: true, message: t('users.passwordRequired') },
    { min: 6, message: t('users.passwordMinLength') },
  ],
}

const pagination = computed(() => ({
  pageSize: pageSize.value,
  page: currentPage.value,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 50],
  onChange: (page: number) => {
    currentPage.value = page
    fetchUsers()
  },
  onUpdatePageSize: (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    fetchUsers()
  },
  prefix: (info: { itemCount: number }) => t('users.totalUsers', { n: info.itemCount }),
}))

// 过滤后的用户列表
const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value
  return users.value.filter(u => 
    u.userName?.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 表格列配置
const columns = computed<DataTableColumns<User>>(() => [
  { 
    title: t('users.userName'), 
    key: 'userName',
    width: 150,
  },
  {
    title: t('users.status'),
    key: 'state',
    width: 100,
    render: (row) => h(NTag, {
      type: row.state === 'enabled' ? 'success' : 'error',
      size: 'small',
    }, { default: () => row.state === 'enabled' ? t('users.active') : t('users.blocked') }),
  },
  {
    title: t('users.uuid'),
    key: 'id',
    width: 250,
    ellipsis: { tooltip: true },
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 320,
    render: (row) => {
      const index = users.value.findIndex(u => u.id === row.id)
      return h('div', { class: 'action-buttons' }, [
        h(NButton, {
          size: 'small',
          quaternary: true,
          onClick: () => openPasswordDialog(row.id || '', index),
        }, { icon: () => h(NIcon, null, { default: () => h(LockClosedOutline) }), tooltip: t('users.setPassword') }),
        h(NButton, {
          size: 'small',
          quaternary: true,
          onClick: () => openPermissionDialog(row.id || ''),
        }, { icon: () => h(NIcon, null, { default: () => h(ShieldOutline) }), tooltip: t('users.systemPermissions') }),
        h(NButton, {
          size: 'small',
          quaternary: true,
          onClick: () => openDirPermissionDialog(row.id || ''),
        }, { icon: () => h(NIcon, null, { default: () => h(FolderOutline) }), tooltip: t('users.dirPermissions') }),
        h(NButton, {
          size: 'small',
          quaternary: true,
          onClick: () => editUser(row, index),
        }, { icon: () => h(NIcon, null, { default: () => h(CreateOutline) }), tooltip: t('common.edit') }),
        h(NPopconfirm, {
          onPositiveClick: () => deleteUser(row.id || '', index),
        }, {
          trigger: () => h(NButton, {
            size: 'small',
            quaternary: true,
            type: 'error',
          }, { icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }),
          default: () => t('users.deleteConfirm'),
        }),
      ])
    },
  },
])

// 目录权限表格列
const dirPermissionColumns = computed<DataTableColumns<UserResource>>(() => [
  {
    title: t('users.dirPath'),
    key: 'folderName',
    width: 300,
    ellipsis: { tooltip: true },
  },
  {
    title: t('users.dirReadPermission'),
    key: 'canRead',
    width: 100,
    render: (row) => h(NCheckbox, {
      checked: row.permissionType?.includes('read'),
      disabled: true,
    }),
  },
  {
    title: t('users.dirWritePermission'),
    key: 'canWrite',
    width: 100,
    render: (row) => h(NCheckbox, {
      checked: row.permissionType?.includes('write'),
      disabled: true,
    }),
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 150,
    render: (row) => h('div', { class: 'action-buttons' }, [
      h(NButton, {
        size: 'small',
        quaternary: true,
        onClick: () => editDirPermission(row),
      }, { icon: () => h(NIcon, null, { default: () => h(CreateOutline) }) }),
      h(NPopconfirm, {
        onPositiveClick: () => deleteDirPermission(row),
      }, {
        trigger: () => h(NButton, {
          size: 'small',
          quaternary: true,
          type: 'error',
        }, { icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }),
        default: () => t('users.deleteDirConfirm'),
      }),
    ]),
  },
])

// 获取用户列表
async function fetchUsers() {
  loading.value = true
  try {
    const response = await userService.getUserList(searchKeyword.value || undefined, currentPage.value, pageSize.value)
    if (response.records && response.records.length > 0) {
      users.value = response.records
      totalPages.value = response.pages || Math.ceil((response.total || 0) / pageSize.value)
      totalRecords.value = response.total || 0
    } else {
      users.value = []
      totalPages.value = 0
      totalRecords.value = 0
    }
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('users.getUserListFailed'))
  } finally {
    loading.value = false
  }
}

// 保存用户
async function saveUser() {
  if (!userForm.value.userName) {
    message.error(t('users.usernameRequired'))
    return
  }
  if (!isEdit.value && !userForm.value.password) {
    message.error(t('users.passwordRequired'))
    return
  }

  saving.value = true
  try {
    const userData: User = {
      userName: userForm.value.userName,
      state: userForm.value.enabled ? 'enabled' : 'disabled',
    }

    if (isEdit.value && users.value[currentRowIndex.value]) {
      const originalUser = users.value[currentRowIndex.value]
      await userService.updateUser(userData, originalUser.id || '')
      message.success(t('users.updateUserSuccess'))
    } else {
      await userService.addUser({
        ...userData,
        password: userForm.value.password,
      })
      message.success(t('users.addSuccess'))
    }
    
    showAddUserDialog.value = false
    resetUserForm()
    fetchUsers()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('users.saveFailed'))
  } finally {
    saving.value = false
  }
}

// 重置用户表单
function resetUserForm() {
  userForm.value = {
    userName: '',
    password: '',
    enabled: true,
    state: 'enabled',
  }
  isEdit.value = false
  currentRowIndex.value = -1
}

// 编辑用户
function editUser(user: User, index: number) {
  isEdit.value = true
  currentRowIndex.value = index
  userForm.value = {
    userName: user.userName || '',
    password: '',
    enabled: user.state === 'enabled',
    state: user.state || 'enabled',
  }
  showAddUserDialog.value = true
}

// 删除用户
async function deleteUser(uuid: string, index: number) {
  if (!uuid) {
    message.error(t('users.uuidNotExist'))
    return
  }
  try {
    await userService.deleteUser(uuid)
    message.success(t('users.deleteSuccess'))
    fetchUsers()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('users.deleteFailed'))
  }
}

// 打开修改密码对话框
function openPasswordDialog(uuid: string, index: number) {
  currentUserUuid.value = uuid
  currentRowIndex.value = index
  passwordData.value.newPassword = ''
  showPasswordDialog.value = true
}

// 修改密码
async function changePassword() {
  if (!passwordData.value.newPassword) {
    message.error(t('users.enterNewPassword'))
    return
  }
  if (!currentUserUuid.value) {
    message.error(t('users.uuidNotExist'))
    return
  }
  changingPassword.value = true
  try {
    await userService.changePassword(currentUserUuid.value, passwordData.value.newPassword)
    message.success(t('users.passwordChangeSuccess'))
    showPasswordDialog.value = false
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('users.passwordChangeFailed'))
  } finally {
    changingPassword.value = false
  }
}

// 打开系统权限对话框
async function openPermissionDialog(uuid: string) {
  currentUserUuid.value = uuid
  loadingPermissions.value = true
  showPermissionDialog.value = true
  await loadPermissions()
  loadingPermissions.value = false
}

// 加载权限
async function loadPermissions() {
  try {
    const [allPerms, userPerms] = await Promise.all([
      userService.getAllPermissions(),
      userService.getUserPermissions(currentUserUuid.value),
    ])
    
    // 处理所有权限数据
    if (Array.isArray(allPerms) && allPerms.length > 0) {
      // 检查第一个元素的类型
      if (typeof allPerms[0] === 'object' && allPerms[0] !== null) {
        // 如果是对象数组，直接使用
        allPermissions.value = allPerms as Array<{name: string, description: string}>
      } else {
        // 如果是字符串数组，转换为对象
        allPermissions.value = (allPerms as string[]).map((name: string) => ({
          name,
          description: name,
        }))
      }
    } else {
      allPermissions.value = []
    }
    
    // 处理用户已授予的权限
    grantedPermissions.value = userPerms.map((p: UserPermission) => p.areaName)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('users.loadPermissionsFailed'))
  }
}

// 检查权限是否已授予
function isPermissionGranted(permissionName: string): boolean {
  return grantedPermissions.value.includes(permissionName)
}

// 授予权限
async function grantPermission(areaName: string) {
  try {
    await userService.grantPermission(currentUserUuid.value, areaName)
    message.success(t('users.grantSystemSuccess'))
    await loadPermissions()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('users.grantSystemFailed'))
  }
}

// 撤销权限
async function revokePermission(areaName: string) {
  try {
    await userService.revokePermission(currentUserUuid.value, areaName)
    message.success(t('users.revokeSystemSuccess'))
    await loadPermissions()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('users.revokeSystemFailed'))
  }
}

// 打开目录权限对话框
async function openDirPermissionDialog(uuid: string) {
  currentUserUuid.value = uuid
  showDirPermissionDialog.value = true
  await loadUserResources()
}

// 加载用户资源
async function loadUserResources() {
  loadingResources.value = true
  try {
    userResources.value = await userService.getUserResources(currentUserUuid.value)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('users.loadDirsFailed'))
  } finally {
    loadingResources.value = false
  }
}

// 编辑目录权限
function editDirPermission(resource: UserResource) {
  editingDir.value = resource
  dirForm.value = {
    folderName: resource.folderName || '',
    canRead: resource.permissionType?.includes('read') || false,
    canWrite: resource.permissionType?.includes('write') || false,
  }
  showAddDirDialog.value = true
}

// 保存目录权限
async function saveDirPermission() {
  if (!dirForm.value.folderName) {
    message.error(t('users.enterDirPath'))
    return
  }

  savingDir.value = true
  try {
    const typeList: string[] = []
    if (dirForm.value.canRead) typeList.push('read')
    if (dirForm.value.canWrite) typeList.push('write')

    if (editingDir.value) {
      // 修改现有目录权限
      await userService.modifyResource(
        currentUserUuid.value,
        editingDir.value.folderName || '',
        dirForm.value.folderName,
        typeList
      )
      message.success(t('users.updateDirSuccess'))
    } else {
      // 新增目录权限
      await userService.createResource(
        currentUserUuid.value,
        dirForm.value.folderName,
        typeList
      )
      message.success(t('users.addDirSuccess'))
    }

    showAddDirDialog.value = false
    resetDirForm()
    await loadUserResources()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || editingDir.value ? t('users.updateDirFailed') : t('users.addDirFailed'))
  } finally {
    savingDir.value = false
  }
}

// 重置目录表单
function resetDirForm() {
  dirForm.value = {
    folderName: '',
    canRead: true,
    canWrite: false,
  }
  editingDir.value = null
}

// 删除目录权限
async function deleteDirPermission(resource: UserResource) {
  if (!resource.folderName) {
    message.error(t('users.selectDirFirst'))
    return
  }

  try {
    await userService.deleteResource(currentUserUuid.value, resource.folderName)
    message.success(t('users.deleteDirSuccess'))
    await loadUserResources()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('users.deleteDirFailed'))
  }
}

// 生命周期
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped lang="css">
.user-management {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}
</style>
