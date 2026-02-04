<template>
  <div class="oauth-container">
    <div class="oauth-card">
      <!-- Logo区域 -->
      <div class="oauth-header">
        <n-icon size="48" color="#d03050">
          <CloseCircleOutline />
        </n-icon>
        <h1 class="title">{{ t('oauth.errorPage.title') }}</h1>
        <p class="subtitle">{{ t('oauth.errorPage.subtitle') }}</p>
      </div>

      <!-- 错误信息 -->
      <div class="error-section">
        <n-alert type="error" :title="t('oauth.error')" class="error-alert">
          {{ errorMessage || t('oauth.errorPage.defaultMessage') }}
        </n-alert>

        <n-space vertical :size="12">
          <n-button type="primary" size="large" block @click="retryOAuth">
            {{ t('oauth.errorPage.retry') }}
          </n-button>
          <n-button size="large" block @click="goToLogin">
            {{ t('oauth.backToLogin') }}
          </n-button>
        </n-space>
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
import { CloseCircleOutline } from '@vicons/ionicons5'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// 错误信息
const errorMessage = ref('')

/**
 * 重试 OAuth 登录
 * 跳转到登录页，用户可以再次点击 OAuth 登录按钮
 */
function retryOAuth() {
  router.push('/login')
}

/**
 * 返回登录页
 */
function goToLogin() {
  router.push('/login')
}

onMounted(() => {
  // 从 URL 参数获取错误信息
  errorMessage.value = (route.query.message as string) || ''
  
  // URL 解码错误信息（后端可能进行了编码）
  if (errorMessage.value) {
    try {
      errorMessage.value = decodeURIComponent(errorMessage.value)
    } catch {
      // 解码失败则保持原样
    }
  }
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

.error-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-alert {
  margin-bottom: 8px;
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
