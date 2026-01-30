<template>
  <div class="user-management">
    <n-card title="用户管理">
      <template #header-extra>
        <n-space>
          <n-input v-model:value="searchKeyword" placeholder="搜索用户名" clearable style="width: 200px">
            <template #prefix>
              <n-icon><SearchOutline /></n-icon>
            </template>
          </n-input>
          <n-button type="primary" @click="showAddUserDialog = true">
            <template #icon><n-icon><AddOutline /></n-icon></template>
            添加用户
          </n-button>
        </n-space>
      </template>

      <n-data-table
        :columns="columns"
        :data="filteredUsers"
        :pagination="pagination"
        :bordered="false"
        :loading="loading"
      />
    </n-card>

    <!-- 添加用户对话框 -->
    <n-modal v-model:show="showAddUserDialog" preset="dialog" title="添加用户" style="width: 500px">
      <n-form :model="newUser" label-placement="left" label-width="100px">
        <n-form-item label="用户名" required>
          <n-input v-model:value="newUser.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item label="密码" required>
          <n-input v-model:value="newUser.password" type="password" placeholder="请输入密码" show-password-on="click" />
        </n-form-item>
        <n-form-item label="状态">
          <n-switch v-model:value="newUser.enabled" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showAddUserDialog = false">取消</n-button>
        <n-button type="primary" @click="addUser" :loading="saving">保存</n-button>
      </template>
    </n-modal>

    <!-- 修改密码对话框 -->
    <n-modal v-model:show="showPasswordDialog" preset="dialog" title="修改密码" style="width: 400px">
      <n-form :model="passwordData" label-placement="left" label-width="80px">
        <n-form-item label="新密码" required>
          <n-input v-model:value="passwordData.newPassword" type="password" placeholder="请输入新密码" show-password-on="click" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showPasswordDialog = false">取消</n-button>
        <n-button type="primary" @click="changePassword" :loading="changingPassword">确定</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useMessage, NButton, NIcon, NTag, DataTableColumns } from 'naive-ui'
import { userService } from '@/api/services/user'
import type { User, PageResponse } from '@/types'
import { AddOutline, TrashOutline, CreateOutline, LockClosedOutline, SearchOutline } from '@vicons/ionicons5'

const message = useMessage()

// 状态
const loading = ref(false)
const saving = ref(false)
const changingPassword = ref(false)
const users = ref<User[]>([])
const searchKeyword = ref('')
const showAddUserDialog = ref(false)
const showPasswordDialog = ref(false)
const currentEditUser = ref<string>('')

const newUser = ref({
  username: '',
  password: '',
  enabled: true,
})

const passwordData = ref({
  newPassword: '',
})

const pagination = ref({
  pageSize: 10,
  page: 1,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

// 过滤后的用户列表
const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value
  return users.value.filter(u => 
    u.userName.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 表格列配置
const columns: DataTableColumns<User> = [
  { title: '用户名', key: 'userName' },
  {
    title: '状态',
    key: 'state',
    width: 100,
    render: (row) => h(NTag, {
      type: row.state === 'enabled' ? 'success' : 'error',
      size: 'small',
    }, { default: () => row.state === 'enabled' ? '正常' : '已禁用' }),
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => h('div', { class: 'action-buttons' }, [
      h(NButton, {
        size: 'small',
        quaternary: true,
        onClick: () => openPasswordDialog(row.userName),
      }, { icon: () => h(NIcon, null, { default: () => h(LockClosedOutline) }) }),
      h(NButton, {
        size: 'small',
        quaternary: true,
        onClick: () => toggleUserStatus(row),
      }, { icon: () => h(NIcon, null, { default: () => h(CreateOutline) }) }),
      h(NButton, {
        size: 'small',
        quaternary: true,
        type: 'error',
        onClick: () => deleteUser(row.userName),
      }, { icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }),
    ]),
  },
]

// 获取用户列表
async function fetchUsers() {
  loading.value = true
  try {
    const response = await userService.getUserList(searchKeyword.value || undefined)
    users.value = response.list || []
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 添加用户
async function addUser() {
  if (!newUser.value.username || !newUser.value.password) {
    message.error('请填写完整信息')
    return
  }
  saving.value = true
  try {
    await userService.addUser({
      userName: newUser.value.username,
      password: newUser.value.password,
      state: newUser.value.enabled ? 'enabled' : 'disabled',
    } as User)
    message.success('添加成功')
    showAddUserDialog.value = false
    newUser.value = { username: '', password: '', enabled: true }
    fetchUsers()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '添加失败')
  } finally {
    saving.value = false
  }
}

// 删除用户
async function deleteUser(username: string) {
  try {
    await userService.deleteUser(username)
    message.success('删除成功')
    fetchUsers()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '删除失败')
  }
}

// 切换用户状态
async function toggleUserStatus(user: User) {
  try {
    if (user.state === 'enabled') {
      await userService.blockUser(user.userName)
    } else {
      await userService.unblockUser(user.userName)
    }
    message.success('操作成功')
    fetchUsers()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '操作失败')
  }
}

// 打开修改密码对话框
function openPasswordDialog(username: string) {
  currentEditUser.value = username
  passwordData.value.newPassword = ''
  showPasswordDialog.value = true
}

// 修改密码
async function changePassword() {
  if (!passwordData.value.newPassword) {
    message.error('请输入新密码')
    return
  }
  changingPassword.value = true
  try {
    await userService.changePassword(currentEditUser.value, passwordData.value.newPassword)
    message.success('密码修改成功')
    showPasswordDialog.value = false
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '修改失败')
  } finally {
    changingPassword.value = false
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
