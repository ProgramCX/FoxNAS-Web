<template>
  <div class="settings-view">
    <n-card title="个人设置" class="settings-card">
      <n-tabs type="line" animated>
        <!-- 账户设置 -->
        <n-tab-pane name="account" tab="账户设置">
          <n-form :model="accountForm" label-placement="left" label-width="100px">
            <n-form-item label="用户名">
              <n-input v-model:value="accountForm.username" disabled />
            </n-form-item>
            <n-form-item label="新密码">
              <n-input
                v-model:value="accountForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password-on="click"
              />
            </n-form-item>
            <n-form-item label="确认密码">
              <n-input
                v-model:value="accountForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password-on="click"
              />
            </n-form-item>
            <n-form-item>
              <n-button type="primary" @click="changePassword" :loading="changing">
                修改密码
              </n-button>
            </n-form-item>
          </n-form>
        </n-tab-pane>

        <!-- 主题设置 -->
        <n-tab-pane name="theme" tab="主题设置">
          <div class="theme-section">
            <h3>选择主题</h3>
            <div class="theme-grid">
              <div
                v-for="(theme, index) in themes"
                :key="index"
                class="theme-item"
                :class="{ active: currentThemeIndex === index }"
                @click="selectTheme(index)"
              >
                <div class="theme-preview" :style="{ backgroundColor: theme.darkMode ? '#1a1a2e' : '#f5f7fa' }">
                  <div class="preview-sidebar" :style="{ backgroundColor: theme.primaryColor }"></div>
                  <div class="preview-content">
                    <div class="preview-header" :style="{ backgroundColor: theme.primaryColor }"></div>
                    <div class="preview-body"></div>
                  </div>
                </div>
                <span class="theme-name">{{ theme.name }}</span>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <!-- 关于 -->
        <n-tab-pane name="about" tab="关于">
          <div class="about-section">
            <div class="about-logo">
              <n-icon size="64" color="#18a058"><CloudOutline /></n-icon>
              <h2>FoxNAS</h2>
              <p class="version">版本 1.0.0</p>
            </div>
            <n-divider />
            <div class="about-info">
              <p>FoxNAS 是一个功能强大的NAS文件管理系统，提供文件管理、用户管理、DDNS配置等功能。</p>
              <p>基于 Vue 3 + TypeScript + Naive UI 构建</p>
            </div>
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { userSelfService } from '@/api/services/user'
import type { ThemeConfig } from '@/types'
import { CloudOutline } from '@vicons/ionicons5'

const message = useMessage()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

// 账户表单
const accountForm = ref({
  username: authStore.username || '',
  newPassword: '',
  confirmPassword: '',
})

const changing = ref(false)

// 主题
const themes = computed(() => settingsStore.getThemes())
const currentThemeIndex = computed(() => settingsStore.currentThemeIndex)

// 选择主题
function selectTheme(index: number) {
  settingsStore.setTheme(index)
  message.success('主题已切换')
}

// 修改密码
async function changePassword() {
  if (!accountForm.value.newPassword) {
    message.error('请输入新密码')
    return
  }
  if (accountForm.value.newPassword !== accountForm.value.confirmPassword) {
    message.error('两次输入的密码不一致')
    return
  }
  changing.value = true
  try {
    await userSelfService.changePassword('', accountForm.value.newPassword)
    message.success('密码修改成功')
    accountForm.value.newPassword = ''
    accountForm.value.confirmPassword = ''
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '修改失败')
  } finally {
    changing.value = false
  }
}
</script>

<style scoped lang="css">
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-card {
  border-radius: 12px;
}

.theme-section h3 {
  margin-bottom: 16px;
  color: var(--text-color-base);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.theme-item {
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.theme-item:hover {
  background-color: var(--bg-color-secondary);
}

.theme-item.active {
  border-color: var(--primary-color);
  background-color: rgba(24, 160, 88, 0.1);
}

.theme-preview {
  height: 80px;
  border-radius: 6px;
  display: flex;
  overflow: hidden;
  margin-bottom: 8px;
}

.preview-sidebar {
  width: 30%;
  height: 100%;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-header {
  height: 20%;
}

.preview-body {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.5);
}

.theme-name {
  display: block;
  text-align: center;
  font-size: 14px;
  color: var(--text-color-base);
}

.about-section {
  text-align: center;
  padding: 24px;
}

.about-logo h2 {
  margin: 16px 0 8px;
  font-size: 24px;
  color: var(--text-color-base);
}

.version {
  color: var(--text-color-tertiary);
  margin-bottom: 24px;
}

.about-info p {
  margin: 8px 0;
  color: var(--text-color-secondary);
}
</style>
