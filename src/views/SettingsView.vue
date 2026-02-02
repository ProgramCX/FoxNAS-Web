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
            <n-form-item :label="t('settings.oldPassword')">
              <n-input
                v-model:value="accountForm.oldPassword"
                type="password"
                :placeholder="t('settings.enterOldPassword')"
                show-password-on="click"
              />
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
            <h3 class="section-title">{{ t('settings.selectTheme') }}</h3>
            <div class="theme-section-header">
              <span class="theme-mode-label" :class="{ active: !isDarkMode }">
                <n-icon><SunnyOutline /></n-icon>
                {{ t('theme.light') }}
              </span>
              <n-switch v-model:value="isDarkMode" @update:value="toggleDarkMode" />
              <span class="theme-mode-label" :class="{ active: isDarkMode }">
                <n-icon><MoonOutline /></n-icon>
                {{ t('theme.dark') }}
              </span>
            </div>
            <div class="theme-grid">
              <div
                v-for="theme in filteredThemes"
                :key="theme.name"
                class="theme-card"
                :class="{ active: currentThemeIndex === getThemeIndex(theme) }"
                @click="selectTheme(getThemeIndex(theme))"
              >
                <div class="theme-card-preview" :style="{ background: theme.bgColor || (theme.darkMode ? '#1a1a2e' : '#f5f7fa') }">
                  <div class="preview-glass">
                    <div class="preview-header-bar" :style="{ background: theme.gradient || theme.primaryColor }"></div>
                    <div class="preview-content-area">
                      <div class="preview-sidebar-bar" :style="{ background: theme.gradient || theme.primaryColor }"></div>
                      <div class="preview-main-area">
                        <div class="preview-dots">
                          <span v-for="i in 3" :key="i" class="preview-dot" :style="{ background: theme.primaryColor + '40' }"></span>
                        </div>
                        <div class="preview-lines">
                          <span v-for="i in 4" :key="i" class="preview-line" :style="{ background: theme.primaryColor + '20' }"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="currentThemeIndex === getThemeIndex(theme)" class="theme-check">
                    <n-icon color="#fff" size="20"><Checkmark /></n-icon>
                  </div>
                </div>
                <div class="theme-card-info">
                  <span class="theme-card-name">{{ theme.name }}</span>
                  <span class="theme-card-badge" v-if="theme.darkMode">{{ t('theme.dark') }}</span>
                </div>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <!-- 关于 -->
        <n-tab-pane name="about" :tab="t('settings.about')">
          <div class="about-section">
            <div class="about-logo">
              <img src="@/assets/favicon.ico" alt="App Logo" width="80" height="80" />
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
import { CloudOutline, SunnyOutline, MoonOutline, Checkmark } from '@vicons/ionicons5'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

const { t, locale } = useI18n()
const message = useMessage()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

// 账户表单
const accountForm = ref({
  username: authStore.username || '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const changing = ref(false)

// 主题
const themes = computed(() => settingsStore.getThemes())
const currentThemeIndex = computed(() => settingsStore.currentThemeIndex)
const isDarkMode = computed({
  get: () => themes.value[currentThemeIndex.value]?.darkMode || false,
  set: (val) => {
    const targetTheme = themes.value.find(t => t.darkMode === val && t.primaryColor === themes.value[currentThemeIndex.value]?.primaryColor)
    if (targetTheme) {
      selectTheme(themes.value.indexOf(targetTheme))
    }
  }
})

const filteredThemes = computed(() => {
  return themes.value.filter(theme => theme.darkMode === isDarkMode.value)
})

function getThemeIndex(theme: ThemeConfig): number {
  return themes.value.indexOf(theme)
}

function toggleDarkMode(val: boolean) {
  const targetTheme = themes.value.find(t => t.darkMode === val && t.primaryColor === themes.value[currentThemeIndex.value]?.primaryColor)
  if (targetTheme) {
    selectTheme(themes.value.indexOf(targetTheme))
  }
}

// 当前语言
const currentLanguage = computed(() => locale.value)

// 获取语言对应的 emoji 旗帜
function getLanguageFlag(code: string): string {
  const flags: Record<string, string> = {
    'zh-CN': '🇨🇳',
    'zh-TW': '🇭🇰',
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
  if (!accountForm.value.oldPassword) {
    message.error(t('settings.enterOldPassword'))
    return
  }
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
    await userSelfService.changePassword(accountForm.value.oldPassword, accountForm.value.newPassword)
    message.success(t('settings.passwordChanged'))
    accountForm.value.oldPassword = ''
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

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
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

.theme-section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: var(--bg-color-secondary);
  border-radius: 12px;
  width: fit-content;
}

.theme-mode-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-color-tertiary);
  transition: color 0.3s ease;
}

.theme-mode-label.active {
  color: var(--primary-color);
  font-weight: 500;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.theme-card {
  position: relative;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-color-secondary);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.theme-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.theme-card.active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(24, 160, 88, 0.2);
}

.theme-card-preview {
  position: relative;
  height: 100px;
  padding: 8px;
  box-sizing: border-box;
}

.preview-glass {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}

.preview-header-bar {
  height: 16px;
  width: 100%;
}

.preview-content-area {
  display: flex;
  height: calc(100% - 16px);
}

.preview-sidebar-bar {
  width: 24px;
  height: 100%;
}

.preview-main-area {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-dots {
  display: flex;
  gap: 4px;
}

.preview-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.preview-lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-line {
  height: 8px;
  border-radius: 4px;
  width: 100%;
}

.theme-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.2s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.theme-card-info {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border-color);
}

.theme-card-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color-base);
}

.theme-card-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--primary-color);
  color: #fff;
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

/* 响应式 */
@media screen and (max-width: 768px) {
  .settings-view {
    gap: 16px;
  }

  .settings-card {
    padding: 12px !important;
  }

  .language-section h3,
  .theme-section h3 {
    font-size: 16px;
    margin-bottom: 12px;
  }

  .section-title {
    font-size: 16px;
    margin-bottom: 16px;
  }

  .language-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .language-item {
    padding: 10px 12px;
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .language-flag {
    font-size: 28px;
  }

  .language-name {
    font-size: 13px;
  }

  .theme-section-header {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    padding: 12px;
  }

  .theme-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .theme-card-preview {
    height: 80px;
    padding: 6px;
  }

  .preview-sidebar-bar {
    width: 16px;
  }

  .preview-main-area {
    padding: 6px;
    gap: 4px;
  }

  .about-section {
    padding: 16px;
  }

  .about-logo img {
    width: 60px !important;
    height: 60px !important;
  }

  .about-logo h2 {
    font-size: 20px;
  }

  /* 表单响应式 */
  .settings-view :deep(.n-form) {
    gap: 16px;
  }

  .settings-view :deep(.n-form-item) {
    margin-bottom: 0;
  }
}

@media screen and (max-width: 480px) {
  .language-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .theme-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .theme-card-info {
    padding: 8px;
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }

  .theme-card-name {
    font-size: 12px;
  }

  .about-logo h2 {
    font-size: 18px;
  }
}
</style>
