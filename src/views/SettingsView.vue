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

        <!-- 邮箱绑定 -->
        <n-tab-pane name="email" :tab="t('settings.emailSettings')">
          <div class="email-section">
            <!-- 当前邮箱状态 -->
            <n-card class="email-status-card" :bordered="false">
              <div class="email-status-content">
                <n-icon size="48" :color="emailInfo.bound ? '#18a058' : '#999'">
                  <MailOutline />
                </n-icon>
                <div class="email-status-info">
                  <h3>{{ emailInfo.bound ? t('settings.emailBound') : t('settings.emailNotBound') }}</h3>
                  <p v-if="emailInfo.bound" class="email-address">{{ emailInfo.email }}</p>
                  <p v-else class="email-hint">{{ t('settings.emailBindHint') }}</p>
                </div>
                <n-button
                  v-if="emailInfo.bound"
                  type="error"
                  @click="showUnbindEmailModal = true"
                >
                  {{ t('settings.unbindEmail') }}
                </n-button>
                <n-button
                  v-else
                  type="primary"
                  @click="showBindEmailModal = true"
                >
                  {{ t('settings.bindEmail') }}
                </n-button>
              </div>
            </n-card>

            <!-- 邮箱功能说明 -->
            <n-alert type="info" :show-icon="true" class="email-features">
              <template #header>
                {{ t('settings.emailFeatures') }}
              </template>
              <ul>
                <li>{{ t('settings.emailFeature1') }}</li>
                <li>{{ t('settings.emailFeature2') }}</li>
                <li>{{ t('settings.emailFeature3') }}</li>
              </ul>
            </n-alert>
          </div>
        </n-tab-pane>

        <!-- 第三方账户绑定 -->
        <n-tab-pane name="oauth" :tab="t('settings.oauthSettings')">
          <div class="oauth-section">
            <h3 class="section-title">{{ t('settings.oauthProviders') }}</h3>
            <div class="oauth-list">
              <div
                v-for="provider in oauthProviders"
                :key="provider.key"
                class="oauth-item"
                :class="{ bound: isOAuthBound(provider.key) }"
              >
                <div class="oauth-icon" :style="{ backgroundColor: provider.color + '20' }">
                  <n-icon :size="24" :color="provider.color">
                    <component :is="getOAuthIcon(provider.icon)" />
                  </n-icon>
                </div>
                <div class="oauth-info">
                  <span class="oauth-name">{{ provider.name }}</span>
                  <span class="oauth-status">
                    {{ isOAuthBound(provider.key) ? t('settings.bound') : t('settings.notBound') }}
                  </span>
                </div>
                <n-button
                  v-if="isOAuthBound(provider.key)"
                  type="error"
                  size="small"
                  @click="handleUnbindOAuth(provider)"
                >
                  {{ t('settings.unbind') }}
                </n-button>
                <n-button
                  v-else
                  type="primary"
                  size="small"
                  @click="handleBindOAuth(provider)"
                >
                  {{ t('settings.bind') }}
                </n-button>
              </div>
            </div>

            <!-- OAuth 功能说明 -->
            <n-alert type="info" :show-icon="true" class="oauth-features">
              <template #header>
                {{ t('settings.oauthFeatures') }}
              </template>
              <p>{{ t('settings.oauthFeatureDesc') }}</p>
            </n-alert>
          </div>
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

    <!-- 绑定邮箱弹窗 -->
    <n-modal
      v-model:show="showBindEmailModal"
      :title="t('settings.bindEmail')"
      preset="card"
      style="width: 90%; max-width: 480px"
      :mask-closable="false"
    >
      <n-form :model="bindEmailForm" label-placement="top">
        <n-form-item :label="t('login.email')" required>
          <n-input
            v-model:value="bindEmailForm.email"
            :placeholder="t('login.emailPlaceholder')"
          />
        </n-form-item>
        <n-form-item :label="t('login.verifyCode')" required>
          <n-input-group>
            <n-input
              v-model:value="bindEmailForm.code"
              :placeholder="t('login.verifyCodePlaceholder')"
            />
            <n-button
              :disabled="emailCodeCountdown > 0 || sendingEmailCode"
              :loading="sendingEmailCode"
              @click="sendEmailCode"
            >
              {{ emailCodeCountdown > 0 ? `${emailCodeCountdown}s` : t('login.getVerifyCode') }}
            </n-button>
          </n-input-group>
        </n-form-item>
        <n-form-item :label="t('settings.currentPassword')" required>
          <n-input
            v-model:value="bindEmailForm.password"
            type="password"
            :placeholder="t('settings.enterOldPassword')"
            show-password-on="click"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showBindEmailModal = false">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" :loading="bindingEmail" @click="confirmBindEmail">
            {{ t('common.confirm') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 解绑邮箱弹窗 -->
    <n-modal
      v-model:show="showUnbindEmailModal"
      :title="t('settings.unbindEmail')"
      preset="card"
      style="width: 90%; max-width: 480px"
      :mask-closable="false"
    >
      <n-alert type="warning" :show-icon="true" style="margin-bottom: 16px">
        {{ t('settings.unbindEmailWarning') }}
      </n-alert>
      <n-form :model="unbindEmailForm" label-placement="top">
        <n-form-item :label="t('login.verifyCode')" required>
          <n-input-group>
            <n-input
              v-model:value="unbindEmailForm.code"
              :placeholder="t('login.verifyCodePlaceholder')"
            />
            <n-button
              :disabled="unbindCodeCountdown > 0 || sendingUnbindCode"
              :loading="sendingUnbindCode"
              @click="sendUnbindCode"
            >
              {{ unbindCodeCountdown > 0 ? `${unbindCodeCountdown}s` : t('login.getVerifyCode') }}
            </n-button>
          </n-input-group>
        </n-form-item>
        <n-form-item :label="t('settings.currentPassword')" required>
          <n-input
            v-model:value="unbindEmailForm.password"
            type="password"
            :placeholder="t('settings.enterOldPassword')"
            show-password-on="click"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showUnbindEmailModal = false">{{ t('common.cancel') }}</n-button>
          <n-button type="error" :loading="unbindingEmail" @click="confirmUnbindEmail">
            {{ t('settings.unbindEmail') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 绑定 OAuth 弹窗 -->
    <n-modal
      v-model:show="showBindOAuthModal"
      :title="t('settings.bindOAuthTitle', { provider: currentOAuthProvider?.name })"
      preset="card"
      style="width: 90%; max-width: 480px"
      :mask-closable="false"
    >
      <n-alert type="info" :show-icon="true" style="margin-bottom: 16px">
        {{ t('settings.bindOAuthDesc', { provider: currentOAuthProvider?.name }) }}
      </n-alert>
      <n-form :model="bindOAuthForm" label-placement="top">
        <n-form-item :label="t('settings.currentPassword')" required>
          <n-input
            v-model:value="bindOAuthForm.password"
            type="password"
            :placeholder="t('settings.enterOldPassword')"
            show-password-on="click"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showBindOAuthModal = false">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" :loading="bindingOAuth" @click="confirmBindOAuth">
            {{ t('settings.goToBind') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 解绑 OAuth 弹窗 -->
    <n-modal
      v-model:show="showUnbindOAuthModal"
      :title="t('settings.unbindOAuthTitle', { provider: currentOAuthProvider?.name })"
      preset="card"
      style="width: 90%; max-width: 480px"
      :mask-closable="false"
    >
      <n-alert type="warning" :show-icon="true" style="margin-bottom: 16px">
        {{ t('settings.unbindOAuthDesc', { provider: currentOAuthProvider?.name }) }}
      </n-alert>
      <n-form :model="unbindOAuthForm" label-placement="top">
        <n-form-item :label="t('settings.currentPassword')" required>
          <n-input
            v-model:value="unbindOAuthForm.password"
            type="password"
            :placeholder="t('settings.enterOldPassword')"
            show-password-on="click"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showUnbindOAuthModal = false">{{ t('common.cancel') }}</n-button>
          <n-button type="error" :loading="unbindingOAuth" @click="confirmUnbindOAuth">
            {{ t('settings.unbind') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMessage, NIcon } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { userSelfService } from '@/api/services/user'
import {
  userSettingsService,
  SUPPORTED_OAUTH_PROVIDERS,
  type OAuthProvider,
  type OAuthInfo,
  type EmailInfoResponse,
} from '@/api/services/userSettings'
import { authService } from '@/api/services/auth'
import { apiConfig } from '@/api/config'
import type { ThemeConfig } from '@/types'
import {
  CloudOutline,
  SunnyOutline,
  MoonOutline,
  Checkmark,
  MailOutline,
  LogoGithub,
} from '@vicons/ionicons5'
import { useRoute } from 'vue-router'
import { Qq, Weixin, Tiktok } from '@vicons/fa'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

// OAuth 图标映射
const oauthIconMap: Record<string, any> = {
  LogoGithub,
  Qq,
  Weixin,
  Tiktok,
}

const { t, locale } = useI18n()
const message = useMessage()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const route = useRoute()

// ==================== 账户设置 ====================
const accountForm = ref({
  username: authStore.username || '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const changing = ref(false)

// ==================== 邮箱设置 ====================
const emailInfo = ref<EmailInfoResponse>({ email: null, bound: false })
const loadingEmail = ref(false)
const showBindEmailModal = ref(false)
const showUnbindEmailModal = ref(false)
const bindingEmail = ref(false)
const unbindingEmail = ref(false)
const sendingEmailCode = ref(false)
const sendingUnbindCode = ref(false)
const emailCodeCountdown = ref(0)
const unbindCodeCountdown = ref(0)

const bindEmailForm = ref({
  email: '',
  code: '',
  password: '',
})

const unbindEmailForm = ref({
  code: '',
  password: '',
})

// ==================== OAuth 设置 ====================
const oauthList = ref<OAuthInfo[]>([])
const loadingOAuth = ref(false)
const showBindOAuthModal = ref(false)
const showUnbindOAuthModal = ref(false)
const bindingOAuth = ref(false)
const unbindingOAuth = ref(false)
const currentOAuthProvider = ref<(typeof SUPPORTED_OAUTH_PROVIDERS)[number] | null>(null)

const bindOAuthForm = ref({
  password: '',
})

const unbindOAuthForm = ref({
  password: '',
})

const oauthProviders = computed(() => SUPPORTED_OAUTH_PROVIDERS)

// ==================== 主题设置 ====================
const themes = computed(() => settingsStore.getThemes())
const currentThemeIndex = computed(() => settingsStore.currentThemeIndex)
const isDarkMode = computed({
  get: () => themes.value[currentThemeIndex.value]?.darkMode || false,
  set: (val) => {
    const targetTheme = themes.value.find(
      (t) => t.darkMode === val && t.primaryColor === themes.value[currentThemeIndex.value]?.primaryColor
    )
    if (targetTheme) {
      selectTheme(themes.value.indexOf(targetTheme))
    }
  },
})

const filteredThemes = computed(() => {
  return themes.value.filter((theme) => theme.darkMode === isDarkMode.value)
})

// ==================== 语言设置 ====================
const currentLanguage = computed(() => locale.value)

// ==================== 初始化 ====================
onMounted(() => {
  loadEmailInfo()
  loadOAuthInfo()
})

// ==================== 路由消息处理 ====================
// 监听路由变化，处理 info 参数（成功消息）
watch(
  () => route.query.info,
  (newInfo) => {
    if (newInfo && newInfo.trim() !== '') {
      const decodedInfo = decodeURIComponent(newInfo as string)
      message.success(decodedInfo, { duration: 5000 })
    }
  },
  { immediate: true }
)

// 监听路由变化，处理 error 参数（错误消息）
watch(
  () => route.query.error,
  (newError) => {
    if (newError && newError.trim() !== '') {
      const decodedError = decodeURIComponent(newError as string)
      message.error(decodedError, { duration: 5000 })
    }
  },
  { immediate: true }
)

// ==================== 邮箱相关方法 ====================
async function loadEmailInfo() {
  loadingEmail.value = true
  try {
    emailInfo.value = await userSettingsService.getBoundEmail()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('settings.loadEmailFailed'))
  } finally {
    loadingEmail.value = false
  }
}

async function sendEmailCode() {
  if (!bindEmailForm.value.email) {
    message.error(t('validation.emailRequired'))
    return
  }
  sendingEmailCode.value = true
  try {
    await authService.sendVerifyCode(bindEmailForm.value.email)
    message.success(t('login.verifyCodeSent'))
    emailCodeCountdown.value = 60
    const timer = setInterval(() => {
      emailCodeCountdown.value--
      if (emailCodeCountdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('login.sendVerifyCodeFailed'))
  } finally {
    sendingEmailCode.value = false
  }
}

async function confirmBindEmail() {
  if (!bindEmailForm.value.email || !bindEmailForm.value.code || !bindEmailForm.value.password) {
    message.error(t('settings.fillAllFields'))
    return
  }
  bindingEmail.value = true
  try {
    await userSettingsService.bindEmail({
      email: bindEmailForm.value.email,
      code: bindEmailForm.value.code,
      password: bindEmailForm.value.password,
    })
    message.success(t('settings.emailBindSuccess'))
    showBindEmailModal.value = false
    bindEmailForm.value = { email: '', code: '', password: '' }
    await loadEmailInfo()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('settings.emailBindFailed'))
  } finally {
    bindingEmail.value = false
  }
}

async function sendUnbindCode() {
  if (!emailInfo.value.email) {
    message.error(t('settings.noEmailToSend'))
    return
  }
  sendingUnbindCode.value = true
  try {
    await authService.sendVerifyCode(emailInfo.value.email)
    message.success(t('login.verifyCodeSent'))
    unbindCodeCountdown.value = 60
    const timer = setInterval(() => {
      unbindCodeCountdown.value--
      if (unbindCodeCountdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('login.sendVerifyCodeFailed'))
  } finally {
    sendingUnbindCode.value = false
  }
}

async function confirmUnbindEmail() {
  if (!unbindEmailForm.value.code || !unbindEmailForm.value.password) {
    message.error(t('settings.fillAllFields'))
    return
  }
  unbindingEmail.value = true
  try {
    await userSettingsService.unbindEmail({
      code: unbindEmailForm.value.code,
      password: unbindEmailForm.value.password,
    })
    message.success(t('settings.emailUnbindSuccess'))
    showUnbindEmailModal.value = false
    unbindEmailForm.value = { code: '', password: '' }
    await loadEmailInfo()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('settings.emailUnbindFailed'))
  } finally {
    unbindingEmail.value = false
  }
}

// ==================== OAuth 相关方法 ====================
async function loadOAuthInfo() {
  loadingOAuth.value = true
  try {
    oauthList.value = await userSettingsService.getBindedOAuthInfo()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('settings.loadOAuthFailed'))
  } finally {
    loadingOAuth.value = false
  }
}

function isOAuthBound(provider: string): boolean {
  return oauthList.value.some((item) => item.provider === provider)
}

function getOAuthIcon(iconName: string) {
  return oauthIconMap[iconName] || CloudOutline
}

function handleBindOAuth(provider: (typeof SUPPORTED_OAUTH_PROVIDERS)[number]) {
  currentOAuthProvider.value = provider
  bindOAuthForm.value.password = ''
  showBindOAuthModal.value = true
}

async function confirmBindOAuth() {
  if (!bindOAuthForm.value.password || !currentOAuthProvider.value) {
    message.error(t('settings.enterPassword'))
    return
  }
  bindingOAuth.value = true
  try {
    // 先验证密码并获取授权 URL
    const redirectUrl = `${window.location.origin}/settings`
    const response = await fetch(`${apiConfig.baseURL}/auth/oauth/bindOAuth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('foxnas_token') || ''}`,
      },
      body: JSON.stringify({
        provider: currentOAuthProvider.value.key,
        password: bindOAuthForm.value.password,
        redirectUrl,
      }),
    })

    if (response.ok) {
      // 密码验证通过，获取授权 URL 并跳转
      const authUrl = await response.text()
      const baseUrl = apiConfig.serverBaseURL || window.location.origin
      const fullAuthUrl = authUrl.startsWith('http') ? authUrl : `${baseUrl}${authUrl}`
      window.location.href = fullAuthUrl
    } else {
      // 密码验证失败
      const errorText = await response.text()
      message.error(errorText || t('settings.oauthBindFailed'))
    }
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('settings.oauthBindFailed'))
  } finally {
    bindingOAuth.value = false
    showBindOAuthModal.value = false
  }
}

function handleUnbindOAuth(provider: (typeof SUPPORTED_OAUTH_PROVIDERS)[number]) {
  currentOAuthProvider.value = provider
  unbindOAuthForm.value.password = ''
  showUnbindOAuthModal.value = true
}

async function confirmUnbindOAuth() {
  if (!unbindOAuthForm.value.password || !currentOAuthProvider.value) {
    message.error(t('settings.enterPassword'))
    return
  }
  unbindingOAuth.value = true
  try {
    await userSettingsService.unbindOAuth({
      provider: currentOAuthProvider.value.key,
      password: unbindOAuthForm.value.password,
    })
    message.success(t('settings.oauthUnbindSuccess'))
    showUnbindOAuthModal.value = false
    unbindOAuthForm.value.password = ''
    await loadOAuthInfo()
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('settings.oauthUnbindFailed'))
  } finally {
    unbindingOAuth.value = false
  }
}

// ==================== 主题相关方法 ====================
function getThemeIndex(theme: ThemeConfig): number {
  return themes.value.indexOf(theme)
}

function toggleDarkMode(val: boolean) {
  const targetTheme = themes.value.find(
    (t) => t.darkMode === val && t.primaryColor === themes.value[currentThemeIndex.value]?.primaryColor
  )
  if (targetTheme) {
    selectTheme(themes.value.indexOf(targetTheme))
  }
}

function selectTheme(index: number) {
  settingsStore.setTheme(index)
  message.success(t('message.operationSuccess'))
}

// ==================== 语言相关方法 ====================
function getLanguageFlag(code: string): string {
  const flags: Record<string, string> = {
    'zh-CN': '🇨🇳',
    'zh-TW': '🇭🇰',
    en: '🇺🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    ja: '🇯🇵',
    ar: '🇸🇦',
    pt: '🇧🇷',
    ru: '🇷🇺',
  }
  return flags[code] || '🌐'
}

function selectLanguage(code: string) {
  const selectedLang = SUPPORTED_LANGUAGES.find((lang) => lang.code === code)
  if (selectedLang) {
    locale.value = code as SupportedLanguage
    localStorage.setItem('foxnas_language', code)
    document.documentElement.dir = selectedLang.dir
    document.documentElement.lang = code
    message.success(t('message.operationSuccess'))
  }
}

// ==================== 密码修改 ====================
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

/* 邮箱设置 */
.email-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.email-status-card {
  background: var(--bg-color-secondary);
}

.email-status-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
}

.email-status-info {
  flex: 1;
}

.email-status-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--text-color-base);
}

.email-address {
  margin: 0;
  font-size: 16px;
  color: var(--primary-color);
  font-weight: 500;
}

.email-hint {
  margin: 0;
  font-size: 14px;
  color: var(--text-color-secondary);
}

.email-features {
  margin-top: 8px;
}

.email-features ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.email-features li {
  margin: 4px 0;
  color: var(--text-color-secondary);
}

/* OAuth 设置 */
.oauth-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.oauth-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.oauth-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: var(--bg-color-secondary);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.oauth-item.bound {
  border-color: var(--primary-color);
  background: rgba(24, 160, 88, 0.05);
}

.oauth-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.oauth-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.oauth-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color-base);
}

.oauth-status {
  font-size: 13px;
  color: var(--text-color-secondary);
}

.oauth-item.bound .oauth-status {
  color: var(--primary-color);
}

.oauth-features {
  margin-top: 8px;
}

/* 语言设置 */
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

/* 主题设置 */
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

/* 关于 */
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
  .theme-section h3,
  .section-title {
    font-size: 16px;
    margin-bottom: 12px;
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

  /* 邮箱设置移动端 */
  .email-status-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .email-status-info h3 {
    font-size: 16px;
  }

  .email-address {
    font-size: 14px;
  }

  /* OAuth 设置移动端 */
  .oauth-item {
    padding: 12px;
    gap: 12px;
  }

  .oauth-icon {
    width: 40px;
    height: 40px;
  }

  .oauth-name {
    font-size: 14px;
  }

  .oauth-status {
    font-size: 12px;
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

  .oauth-item {
    flex-wrap: wrap;
  }

  .oauth-info {
    min-width: 0;
  }
}
</style>
