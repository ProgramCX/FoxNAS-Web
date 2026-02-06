<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo区域 -->
      <div class="login-header">
        <div class="language-switch-container">
          <LanguageSwitcher />
        </div>
        <n-icon size="48" color="#18a058">
          <CloudOutline />
        </n-icon>
        <h1 class="title">{{ t('app.name') }}</h1>
        <p class="subtitle">{{ t('app.subtitle') }}</p>
      </div>

      <!-- 登录表单 -->
      <n-form ref="formRef" :model="formData" :rules="rules" @submit.prevent="handleLogin">
        <n-form-item path="username" :label="t('login.username')">
          <n-input v-model:value="formData.username" :placeholder="t('login.usernamePlaceholder')" size="large"
            :input-props="{ autocomplete: 'username' }">
            <template #prefix>
              <n-icon>
                <PersonOutline />
              </n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="password" :label="t('login.password')">
          <n-input v-model:value="formData.password" type="password" :placeholder="t('login.passwordPlaceholder')"
            size="large" show-password-on="click" :input-props="{ autocomplete: 'current-password' }">
            <template #prefix>
              <n-icon>
                <LockClosedOutline />
              </n-icon>
            </template>
          </n-input>
        </n-form-item>

        <!-- 验证码（仅在注册或忘记密码时显示） -->
        <n-form-item v-if="isRegisterMode" path="code" :label="t('login.verifyCode')">
          <n-input-group>
            <n-input v-model:value="formData.code" :placeholder="t('login.verifyCodePlaceholder')" size="large">
              <template #prefix>
                <n-icon>
                  <KeyOutline />
                </n-icon>
              </template>
            </n-input>
            <n-button size="large" :disabled="countdown > 0" @click="sendVerificationCode" :loading="sendingCode">
              {{ countdown > 0 ? `${countdown}s` : t('login.getVerifyCode') }}
            </n-button>
          </n-input-group>
        </n-form-item>

        <!-- 邮箱输入（仅注册时显示） -->
        <n-form-item v-if="isRegisterMode" path="email" :label="t('login.email')">
          <n-input v-model:value="formData.email" :placeholder="t('login.emailPlaceholder')" size="large">
            <template #prefix>
              <n-icon>
                <MailOutline />
              </n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item v-if="isRegisterMode" path="confirmPassword" :label="t('login.confirmPassword')">
          <n-input v-model:value="formData.confirmPassword" type="password"
            :placeholder="t('login.confirmPasswordPlaceholder')" size="large" show-password-on="click">
            <template #prefix>
              <n-icon>
                <LockClosedOutline />
              </n-icon>
            </template>
          </n-input>
        </n-form-item>

        <!-- 错误提示 -->
        <n-alert v-if="errorMessage" type="error" class="error-alert" :show-icon="true">
          {{ errorMessage }}
        </n-alert>

        <!-- 登录/注册按钮 -->
        <n-form-item>
          <n-button type="primary" size="large" block :loading="loading" :disabled="loading" @click="handleLogin">
            {{ isRegisterMode ? t('login.registerButton') : t('login.loginButton') }}
          </n-button>
        </n-form-item>

        <!-- 切换登录/注册 -->
        <div class="toggle-mode">
          <n-button quaternary size="small" @click="toggleMode">
            {{ isRegisterMode ? t('login.hasAccount') : t('login.noAccount') }}
          </n-button>
        </div>

        <!-- 忘记密码/找回用户名 -->
        <div v-if="!isRegisterMode" class="auth-links">
          <n-button text @click="goToForgotPassword">
            {{ t('login.forgotPassword') }}
          </n-button>
          <span class="divider">|</span>
          <n-button text @click="goToRetrieveUsername">
            {{ t('login.forgotUsername') }}
          </n-button>
        </div>

        <!-- OAuth 第三方登录 -->
        <div v-if="!isRegisterMode" class="oauth-section">
          <n-divider>{{ t('login.orLoginWith') }}</n-divider>
          <div class="oauth-buttons">
            <n-button @click="handleGitHubLogin" circle size="large" strong>
              <template #icon>
                <n-icon>
                  <LogoGithub />
                </n-icon>
              </template>
            </n-button>

            <n-button @click="handleQQLogin" circle size="large" strong>
              <template #icon>
                <Icon color="#1aa7ef">
                  <Qq />
                </Icon>
              </template>
            </n-button>

            <n-button @click="handleWeixinLogin" circle size="large" strong>
              <template #icon>
                <Icon color="#28c445" :size="24">
                  <Weixin />
                </Icon>
              </template>
            </n-button>

            <n-button @click="handleMicrosoftLogin" circle size="large" strong>
              <template #icon>
                <img :src="MicrosoftIcon" style="width: 20px; height: 20px;" alt="Microsoft" />
              </template>
            </n-button>

             <n-button @click="handleEmailLogin" circle size="large" strong>
              <template #icon>
                 <n-icon color="#FF6600">
                  <Mail />
                </n-icon>
              </template>
            </n-button>

          </div>
        </div>
      </n-form>

      <!-- 初始化管理员提示 -->
      <div v-if="showInitAdmin" class="init-admin-section">
        <n-divider />
        <p class="init-tip">{{ t('login.initAdminTip') }}</p>
        <n-button type="info" block @click="initAdmin" :loading="initingAdmin">
          {{ t('login.initAdmin') }}
        </n-button>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { http } from '@/api/client'
import { apiEndpoints, apiConfig } from '@/api/config'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { Qq, Weixin } from '@vicons/fa'
import { Icon } from '@vicons/utils'
import {
  CloudOutline,
  PersonOutline,
  LockClosedOutline,
  KeyOutline,
  MailOutline,
} from '@vicons/ionicons5'
import { LogoGithub, Mail } from '@vicons/ionicons5'
import MicrosoftIcon from '@/assets/microsoft-color.svg'
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  code: '',
})

// 表单验证规则
const rules = computed(() => ({
  username: [
    { required: true, message: t('login.usernameRequired'), trigger: 'blur' },
    { min: 3, max: 32, message: t('validation.usernameLength'), trigger: 'blur' },
  ],
  password: [
    { required: true, message: t('login.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('validation.passwordMinLength'), trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: t('validation.confirmPasswordRequired'), trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string) => value === formData.password,
      message: t('login.passwordMismatch'),
      trigger: 'blur',
    },
  ],
  email: [
    { required: true, message: t('validation.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('validation.email'), trigger: 'blur' },
  ],
  code: [
    { required: true, message: t('validation.verifyCodeRequired'), trigger: 'blur' },
    { len: 6, message: t('validation.verifyCodeLength'), trigger: 'blur' },
  ],
}))

// 状态
const loading = ref(false)
const errorMessage = ref('')
const isRegisterMode = ref(false)
const showInitAdmin = ref(false)
const initingAdmin = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let countdownTimer: number | null = null

const formRef = ref()

// 切换登录/注册模式
function toggleMode() {
  isRegisterMode.value = !isRegisterMode.value
  errorMessage.value = ''
  formData.code = ''
  formData.email = ''
  formData.confirmPassword = ''
}

// 发送验证码
async function sendVerificationCode() {
  if (!formData.email) {
    message.error(t('validation.emailRequired'))
    return
  }

  sendingCode.value = true
  try {
    await authStore.sendVerifyCode(formData.email)
    message.success(t('login.verifyCodeSent'))
    countdown.value = 60
    countdownTimer = window.setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        if (countdownTimer) clearInterval(countdownTimer)
      }
    }, 1000)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('login.sendVerifyCodeFailed'))
  } finally {
    sendingCode.value = false
  }
}

// 初始化管理员
async function initAdmin() {
  initingAdmin.value = true
  try {
    const password = await authStore.initAdmin()
    message.success(`管理员账户初始化成功！初始密码: ${password}`)
    showInitAdmin.value = false
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('login.initFailed'))
  } finally {
    initingAdmin.value = false
  }
}

// 跳转到忘记密码页面
function goToForgotPassword() {
  router.push('/forgot-password')
}

// 跳转到找回用户名页面
function goToRetrieveUsername() {
  router.push('/retrieve-username')
}

function goOauthLogin(provider: string) {
  // 构建后端 OAuth 授权地址
  // 后端 OAuth 入口: /api/oauth2/authorization/{provider}
  const baseUrl = apiConfig.baseURL.replace('/api', '') || window.location.origin
  const oauthUrl = `${baseUrl}/api/oauth2/authorization/${provider}`

  // 跳转到后端 OAuth 授权地址
  window.location.href = oauthUrl
}
// 处理 GitHub OAuth 登录
function handleGitHubLogin() {
  goOauthLogin('github')
}

// QQ OAuth 登录
function handleQQLogin() {
  goOauthLogin('qq')
}

// 微信 OAuth 登录
function handleWeixinLogin() {
 goOauthLogin('weixin')
}

// Microsoft OAuth 登录
function handleMicrosoftLogin() {
  goOauthLogin('microsoft')
}

// 邮箱登录
function handleEmailLogin() {
  
}

// 处理登录
async function handleLogin() {
  // 验证表单
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    if (isRegisterMode.value) {
      // 注册
      await authStore.register(formData.username, formData.email, formData.password, formData.code)
      message.success(t('login.registerSuccess'))
      isRegisterMode.value = false
      formData.password = ''
    } else {
      // 登录
      await authStore.login(formData.username, formData.password)
      message.success(t('login.loginSuccess'))

      // 跳转到重定向页面或首页
      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    }
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number }
    errorMessage.value = t('login.loginFailed')
    showInitAdmin.value = false

    // 检查是否需要初始化管理员
    if (err.message?.includes('admin') || err.message?.includes('Admin')) {
      showInitAdmin.value = true
    }
  } finally {
    loading.value = false
  }
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

// 组件挂载时检查是否需要初始化管理员
onMounted(async () => {
  try {
    const result = await http.get<{ required: boolean }>(apiEndpoints.auth.initRequired)
    if (result.required) {
      showInitAdmin.value = true
    }
  } catch {
    // 忽略错误，让用户正常登录
  }
})
</script>

<style scoped lang="css">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-color);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
  position: relative;
}

.language-switch-container {
  position: absolute;
  top: 0;
  right: 0;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-color-base);
  margin: 16px 0 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-color-tertiary);
}

.error-alert {
  margin-bottom: 16px;
}

.toggle-mode {
  text-align: center;
  margin-top: -8px;
}

.auth-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.auth-links .divider {
  color: var(--text-color-quaternary);
}

/* OAuth 第三方登录 */
.oauth-section {
  margin-top: 16px;
}

.oauth-buttons {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 12px;
}



/* .github-btn:hover {
  background-color: #2f363d;
}

.github-btn:active {
  background-color: #1b1f23;
} */

.init-admin-section {
  margin-top: 16px;
}

.init-tip {
  text-align: center;
  color: var(--text-color-secondary);
  margin-bottom: 12px;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
}

.circle-1 {
  width: 400px;
  height: 400px;
  background: var(--primary-color);
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: var(--primary-color);
  bottom: -50px;
  left: -50px;
}

.circle-3 {
  width: 200px;
  height: 200px;
  background: var(--primary-color);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 响应式 */
@media screen and (max-width: 480px) {
  .login-card {
    padding: 24px;
  }

  .title {
    font-size: 24px;
  }
}

/* 深色模式适配 */
body.dark .login-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

body.dark .login-card {
  background: #242428;
}


</style>
