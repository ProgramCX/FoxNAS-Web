<template>
  <div class="oauth-container">
    <div class="oauth-card">
      <!-- Logo区域 -->
      <div class="oauth-header">
        <div class="language-switch-container">
          <LanguageSwitcher />
        </div>
        <n-icon size="48" color="#18a058">
          <PersonAddOutline />
        </n-icon>
        <h1 class="title">{{ t('oauth.activate.title') }}</h1>
        <p class="subtitle">{{ t('oauth.activate.subtitle') }}</p>
      </div>

      <!-- 激活表单 -->
      <n-form ref="formRef" :model="formData" :rules="rules" @submit.prevent="handleActivate">
        <n-form-item path="email" :label="t('oauth.activate.email')">
          <n-input
            v-model:value="formData.email"
            :placeholder="t('oauth.activate.emailPlaceholder')"
            size="large"
            :input-props="{ autocomplete: 'email' }"
          >
            <template #prefix>
              <n-icon><MailOutline /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="code" :label="t('oauth.activate.verifyCode')">
          <n-input-group>
            <n-input
              v-model:value="formData.code"
              :placeholder="t('oauth.activate.verifyCodePlaceholder')"
              size="large"
            >
              <template #prefix>
                <n-icon><KeyOutline /></n-icon>
              </template>
            </n-input>
            <n-button
              size="large"
              :disabled="countdown > 0 || !formData.email"
              @click="sendVerificationCode"
              :loading="sendingCode"
            >
              {{ countdown > 0 ? `${countdown}s` : t('oauth.activate.getVerifyCode') }}
            </n-button>
          </n-input-group>
        </n-form-item>

        <n-form-item path="password" :label="t('oauth.activate.password')">
          <n-input
            v-model:value="formData.password"
            type="password"
            :placeholder="t('oauth.activate.passwordPlaceholder')"
            size="large"
            show-password-on="click"
            :input-props="{ autocomplete: 'new-password' }"
          >
            <template #prefix>
              <n-icon><LockClosedOutline /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="confirmPassword" :label="t('oauth.activate.confirmPassword')">
          <n-input
            v-model:value="formData.confirmPassword"
            type="password"
            :placeholder="t('oauth.activate.confirmPasswordPlaceholder')"
            size="large"
            show-password-on="click"
            :input-props="{ autocomplete: 'new-password' }"
          >
            <template #prefix>
              <n-icon><LockClosedOutline /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <!-- 错误提示 -->
        <n-alert v-if="errorMessage" type="error" class="error-alert" :show-icon="true">
          {{ errorMessage }}
        </n-alert>

        <!-- ticket 缺失提示 -->
        <n-alert v-if="!ticket" type="warning" class="error-alert" :show-icon="true">
          {{ t('oauth.activate.missingTicket') }}
        </n-alert>

        <!-- 激活按钮 -->
        <n-form-item>
          <n-button
            type="primary"
            size="large"
            block
            :loading="loading"
            :disabled="loading || !ticket"
            @click="handleActivate"
          >
            {{ t('oauth.activate.activateButton') }}
          </n-button>
        </n-form-item>

        <!-- 返回登录 -->
        <div class="back-to-login">
          <n-button quaternary size="small" @click="goToLogin">
            {{ t('oauth.backToLogin') }}
          </n-button>
        </div>
      </n-form>
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
import { ref, reactive, computed, onUnmounted, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { authService } from '@/api/services/auth'
import { useAuthStore } from '@/stores/auth'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import {
  PersonAddOutline,
  MailOutline,
  LockClosedOutline,
  KeyOutline,
} from '@vicons/ionicons5'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()

// ticket 参数
const ticket = ref<string>('')

// 表单数据
const formData = reactive({
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
})

// 表单验证规则
const rules = computed(() => ({
  email: [
    { required: true, message: t('validation.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('validation.email'), trigger: 'blur' },
  ],
  code: [
    { required: true, message: t('validation.verifyCodeRequired'), trigger: 'blur' },
    { len: 6, message: t('validation.verifyCodeLength'), trigger: 'blur' },
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
}))

// 状态
const loading = ref(false)
const errorMessage = ref('')
const sendingCode = ref(false)
const countdown = ref(0)
let countdownTimer: number | null = null

const formRef = ref()

/**
 * 发送验证码
 */
async function sendVerificationCode() {
  if (!formData.email) {
    message.error(t('validation.emailRequired'))
    return
  }

  sendingCode.value = true
  try {
    await authService.sendOAuthActivateCode(formData.email)
    message.success(t('oauth.activate.codeSent'))
    countdown.value = 60
    countdownTimer = window.setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        if (countdownTimer) clearInterval(countdownTimer)
      }
    }, 1000)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || t('oauth.activate.sendCodeFailed'))
  } finally {
    sendingCode.value = false
  }
}

/**
 * 处理激活
 */
async function handleActivate() {
  // 验证表单
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  if (!ticket.value) {
    errorMessage.value = t('oauth.activate.missingTicket')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await authService.activateOAuthAccount({
      email: formData.email,
      code: formData.code,
      password: formData.password,
      ticket: ticket.value,
    })

    // 检查激活是否成功（有 accessToken 表示成功）
    if (response.accessToken && response.username) {

      // 保存用户信息到本地存储
      authStore.saveUserInfoToLocalStorage(response.uuid, response.username)
      
      // 显示成功对话框，告知用户用户名
      dialog.success({
        title: t('oauth.activate.successTitle'),
        content: t('oauth.activate.successWithUsername', { username: response.username }),
        positiveText: t('oauth.activate.enterSystem'),
        closable: false,
        maskClosable: false,
        onPositiveClick: async () => {
          // 使用返回的 token 直接登录
          await authStore.setTokens(response.accessToken, response.refreshToken)
          message.success(t('login.loginSuccess'))
          router.push('/')
        }
      })
    } else {
      // 激活失败
      errorMessage.value = response.message || t('oauth.activate.failed')
    }
  } catch (error: unknown) {
    const err = error as Error
    errorMessage.value = err.message || t('oauth.activate.failed')
  } finally {
    loading.value = false
  }
}

/**
 * 跳转到登录页
 */
function goToLogin() {
  router.push('/login')
}

// 组件挂载时获取 ticket
onMounted(() => {
  ticket.value = (route.query.ticket as string) || ''
  if (!ticket.value) {
    errorMessage.value = t('oauth.activate.missingTicket')
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped lang="css">
.oauth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.oauth-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-color);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.oauth-header {
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

.back-to-login {
  text-align: center;
  margin-top: -8px;
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
  .oauth-card {
    padding: 24px;
  }

  .title {
    font-size: 24px;
  }
}

/* 深色模式适配 */
body.dark .oauth-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

body.dark .oauth-card {
  background: #242428;
}
</style>
