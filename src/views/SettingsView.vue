<template>
  <div class="settings-view">
    <n-card :title="t('settings.personalSettings')" class="settings-card">
      <n-tabs type="line" animated>
        <!-- 账户设置 -->
        <n-tab-pane name="account" :tab="t('settings.accountSettings')">
          <n-form :model="accountForm" label-placement="left" label-width="100px">
            <n-form-item :label="t('login.username')">
              <n-input v-model:value="accountForm.username" disabled />
            </n-form-item>
            <n-form-item :label="t('settings.newPassword')">
              <n-input
                v-model:value="accountForm.newPassword"
                type="password"
                :placeholder="t('login.passwordPlaceholder')"
                show-password-on="click"
              />
            </n-form-item>
            <n-form-item :label="t('settings.confirmPassword')">
              <n-input
                v-model:value="accountForm.confirmPassword"
                type="password"
                :placeholder="t('login.confirmPasswordPlaceholder')"
                show-password-on="click"
              />
            </n-form-item>
            <n-form-item>
              <n-button type="primary" @click="changePassword" :loading="changing">
                {{ t('settings.changePassword') }}
              </n-button>
            </n-form-item>
          </n-form>
        </n-tab-pane>

        <!-- 语言设置 -->
        <n-tab-pane name="language" :tab="t('settings.languageSettings')">
          <div class="language-section">
            <h3>{{ t('settings.selectLanguage') }}</h3>
            <div class="language-grid">
              <div
                v-for="lang in SUPPORTED_LANGUAGES"
                :key="lang.code"
                class="language-item"
                :class="{ active: currentLanguage === lang.code }"
                @click="selectLanguage(lang.code)"
              >
                <span class="language-flag">{{ getLanguageFlag(lang.code) }}</span>
                <span class="language-name">{{ lang.nativeName }}</span>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <!-- 主题设置 -->
        <n-tab-pane name="theme" :tab="t('settings.themeSettings')">
          <div class="theme-section">
            <h3>{{ t('settings.selectTheme') }}</h3>
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
                <span class="theme-name">{{ getThemeName(theme, index) }}</span>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <!-- 关于 -->
        <n-tab-pane name="about" :tab="t('settings.about')">
          <div class="about-section">
            <div class="about-logo">
              <n-icon size="64" color="#18a058"><CloudOutline /></n-icon>
              <h2>{{ t('app.name') }}</h2>
              <p class="version">{{ t('app.version') }} 1.0.0</p>
            </div>
            <n-divider />
            <div class="about-info">
              <p>{{ t('app.description') }}</p>
              <p>{{ t('app.techStack') }}</p>
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
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { userSelfService } from '@/api/services/user'
import type { ThemeConfig } from '@/types'
import { CloudOutline } from '@vicons/ionicons5'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

const { t, locale } = useI18n()
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

// 当前语言
const currentLanguage = computed(() => locale.value)

// 获取语言对应的 emoji 旗帜
function getLanguageFlag(code: string): string {
  const flags: Record<string, string> = {
    'zh-CN': '🇨🇳',
    'zh-TW': '🇹🇼',
    'en': '🇺🇸',
    'fr': '🇫🇷',
    'de': '🇩🇪',
    'ja': '🇯🇵',
    'ar': '🇸🇦',
    'pt': '🇧🇷',
    'ru': '🇷🇺',
  }
  return flags[code] || '🌐'
}

// 获取主题名称（国际化）
function getThemeName(_theme: ThemeConfig, index: number): string {
  const themeKeys = [
    'defaultGreen', 'darkGreen', 'purple', 'darkPurple',
    'orange', 'darkOrange', 'red', 'darkRed'
  ]
  const key = themeKeys[index] || 'defaultGreen'
  return t(`settings.themes.${key}`)
}

// 选择语言
function selectLanguage(code: string) {
  const selectedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === code)
  if (selectedLang) {
    locale.value = code as SupportedLanguage
    localStorage.setItem('foxnas_language', code)
    document.documentElement.dir = selectedLang.dir
    document.documentElement.lang = code
    message.success(t('message.operationSuccess'))
  }
}

// 选择主题
function selectTheme(index: number) {
  settingsStore.setTheme(index)
  message.success(t('message.operationSuccess'))
}

// 修改密码
async function changePassword() {
  if (!accountForm.value.newPassword) {
    message.error(t('login.passwordRequired'))
    return
  }
  if (accountForm.value.newPassword !== accountForm.value.confirmPassword) {
    message.error(t('login.passwordMismatch'))
    return
  }
  changing.value = true
  try {
    await userSelfService.changePassword('', accountForm.value.newPassword)
    message.success(t('settings.passwordChanged'))
    accountForm.value.newPassword = ''
    accountForm.value.confirmPassword = ''
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('settings.passwordChangeFailed'))
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

.language-section h3,
.theme-section h3 {
  margin-bottom: 16px;
  color: var(--text-color-base);
}

.language-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.language-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid transparent;
  background-color: var(--bg-color-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.language-item:hover {
  border-color: var(--primary-color);
}

.language-item.active {
  border-color: var(--primary-color);
  background-color: rgba(24, 160, 88, 0.1);
}

.language-flag {
  font-size: 24px;
}

.language-name {
  font-size: 14px;
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
