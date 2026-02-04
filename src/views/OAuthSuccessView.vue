<template>
  <div class="oauth-container">
    <div class="oauth-card">
      <!-- Logo区域 -->
      <div class="oauth-header">
        <n-icon size="48" :color="error ? '#d03050' : '#18a058'">
          <CheckmarkCircleOutline v-if="!error" />
          <CloseCircleOutline v-else />
        </n-icon>
        <h1 class="title">{{ error ? t('oauth.error') : t('oauth.success.title') }}</h1>
        <p class="subtitle">{{ error ? errorMessage : t('oauth.success.subtitle') }}</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-section">
        <n-spin size="large" />
        <p class="loading-text">{{ t('oauth.success.processing') }}</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-section">
        <n-alert type="error" :title="t('oauth.error')" class="error-alert">
          {{ errorMessage }}
        </n-alert>
        <n-button type="primary" size="large" block @click="goToLogin">
          {{ t('oauth.backToLogin') }}
        </n-button>
      </div>

      <!-- 成功状态 -->
      <div v-else class="success-section">
        <n-result status="success" :title="t('oauth.success.title')" :description="t('oauth.success.redirecting')">
          <template #footer>
            <n-button type="primary" @click="goToDashboard">
              {{ t('oauth.success.goToDashboard') }}
            </n-button>
          </template>
        </n-result>
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { CheckmarkCircleOutline, CloseCircleOutline } from '@vicons/ionicons5'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 状态
const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')

/**
 * 处理 OAuth 成功回调
 * 从 URL 参数中获取 accessToken 和 refreshToken
 */
async function handleOAuthCallback() {
  try {
    const accessToken = route.query.accessToken as string
    const refreshToken = route.query.refreshToken as string
    const username = route.query.username as string
    const uuid = route.query.uuid as string
    // 验证 token 参数是否存在
    if (!accessToken) {
      error.value = true
      errorMessage.value = t('oauth.success.missingToken')
      return
    }

    // 存储 token 到 store 和 localStorage
    await authStore.setTokens(accessToken, refreshToken || '')
    if (username) {
      authStore.saveUserInfoToLocalStorage(uuid, username)
    }
    // 短暂延迟后跳转到首页
    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (err) {
    error.value = true
    errorMessage.value = (err as Error).message || t('oauth.success.failed')
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

/**
 * 跳转到控制台
 */
function goToDashboard() {
  router.push('/')
}

onMounted(() => {
  handleOAuthCallback()
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

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 0;
}

.loading-text {
  color: var(--text-color-secondary);
}

.error-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-alert {
  margin-bottom: 8px;
}

.success-section {
  padding: 16px 0;
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
