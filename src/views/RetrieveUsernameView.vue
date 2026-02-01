<template>
  <div class="retrieve-username-container">
    <div class="retrieve-username-card">
      <div class="card-header">
        <n-icon size="48" color="#18a058"><PersonOutline /></n-icon>
        <h1 class="title">{{ t('retrieveUsername.title') }}</h1>
        <p class="subtitle">{{ t('retrieveUsername.subtitle') }}</p>
      </div>

      <n-form ref="formRef" :model="formData" :rules="rules" @submit.prevent="handleSubmit">
        <n-form-item v-if="currentStep === 1" path="email" :label="t('retrieveUsername.email')">
          <n-input
            v-model:value="formData.email"
            :placeholder="t('retrieveUsername.emailPlaceholder')"
            size="large"
          >
            <template #prefix>
              <n-icon><MailOutline /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <template v-if="currentStep === 2">
          <n-form-item path="code" :label="t('retrieveUsername.verifyCode')">
            <n-input
              v-model:value="formData.code"
              :placeholder="t('retrieveUsername.verifyCodePlaceholder')"
              size="large"
              maxlength="6"
            >
              <template #prefix>
                <n-icon><KeyOutline /></n-icon>
              </template>
            </n-input>
          </n-form-item>

          <div class="resend-code-row">
            <n-button
              quaternary
              type="primary"
              size="small"
              :disabled="countdown > 0 || loadingResend"
              :loading="loadingResend"
              @click="resendCode"
            >
              {{ countdown > 0 ? t('retrieveUsername.resendCountdown', { seconds: countdown }) : t('retrieveUsername.resendCode') }}
            </n-button>
          </div>
        </template>

        <n-alert v-if="errorMessage" type="error" class="error-alert" :show-icon="true">
          {{ errorMessage }}
        </n-alert>

        <n-alert v-if="successMessage" type="success" class="success-alert" :show-icon="true">
          {{ successMessage }}
        </n-alert>

        <n-form-item>
          <n-button
            type="primary"
            size="large"
            block
            :loading="loading"
            :disabled="loading"
            @click="handleSubmit"
          >
            {{ getButtonText() }}
          </n-button>
        </n-form-item>
      </n-form>

      <div class="back-link">
        <n-button quaternary size="small" @click="goToLogin">
          <template #icon><n-icon><ArrowBackOutline /></n-icon></template>
          {{ t('retrieveUsername.backToLogin') }}
        </n-button>
      </div>
    </div>

    <div class="background-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { authService } from '@/api/services/auth'
import {
  PersonOutline,
  MailOutline,
  KeyOutline,
  ArrowBackOutline,
} from '@vicons/ionicons5'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const currentStep = ref(1)
const formRef = ref()
const loading = ref(false)
const loadingResend = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const countdown = ref(0)
let countdownTimer: number | null = null

const formData = reactive({
  email: '',
  code: '',
})

const rules = computed(() => ({
  email: [
    { required: true, message: t('validation.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('validation.email'), trigger: 'blur' },
  ],
  code: [
    { required: true, message: t('validation.verifyCodeRequired'), trigger: 'blur' },
    { len: 6, message: t('validation.verifyCodeLength'), trigger: 'blur' },
  ],
}))

function getButtonText(): string {
  if (loading.value) return ''
  if (currentStep.value === 1) return t('retrieveUsername.sendCode')
  return t('retrieveUsername.submit')
}

async function handleSubmit() {
  if (currentStep.value === 1) {
    await sendCode()
  } else {
    await retrieveUsername()
  }
}

async function sendCode() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await authService.sendVerifyCode(formData.email)
    message.success(t('retrieveUsername.codeSent'))
    currentStep.value = 2
    startCountdown()
  } catch (error: unknown) {
    const err = error as Error & { response?: { status?: number } }
    if (err.response?.status === 429) {
      errorMessage.value = t('retrieveUsername.rateLimit')
      message.warning(t('retrieveUsername.rateLimit'))
    } else {
      errorMessage.value = err.message || t('retrieveUsername.sendCodeFailed')
    }
  } finally {
    loading.value = false
  }
}

async function resendCode() {
  if (countdown.value > 0 || loadingResend.value) return

  loadingResend.value = true
  errorMessage.value = ''

  try {
    await authService.sendVerifyCode(formData.email)
    message.success(t('retrieveUsername.codeSent'))
    startCountdown()
  } catch (error: unknown) {
    const err = error as Error & { response?: { status?: number } }
    if (err.response?.status === 429) {
      errorMessage.value = t('retrieveUsername.rateLimit')
      message.warning(t('retrieveUsername.rateLimit'))
    } else {
      errorMessage.value = err.message || t('retrieveUsername.sendCodeFailed')
    }
  } finally {
    loadingResend.value = false
  }
}

function startCountdown() {
  countdown.value = 60
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer)
    }
  }, 1000)
}

async function retrieveUsername() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await authService.retrieveUsername({
      emailAddr: formData.email,
      code: formData.code,
    })
    successMessage.value = t('retrieveUsername.successMessage')
    message.success(t('retrieveUsername.success'))
    setTimeout(() => {
      goToLogin()
    }, 3000)
  } catch (error: unknown) {
    const err = error as Error
    errorMessage.value = err.message || t('retrieveUsername.failed')
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login')
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped lang="css">
.retrieve-username-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.retrieve-username-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-color);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color-base);
  margin: 16px 0 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-color-tertiary);
}

.error-alert,
.success-alert {
  margin-bottom: 16px;
}

.back-link {
  text-align: center;
  margin-top: -8px;
}

.resend-code-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
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

/* 深色模式适配 */
body.dark .retrieve-username-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

body.dark .retrieve-username-card {
  background: #242428;
}

/* 响应式 */
@media screen and (max-width: 480px) {
  .retrieve-username-card {
    padding: 24px;
  }

  .title {
    font-size: 20px;
  }
}
</style>
