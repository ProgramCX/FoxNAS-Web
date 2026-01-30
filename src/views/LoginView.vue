<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo区域 -->
      <div class="login-header">
        <n-icon size="48" color="#18a058">
          <CloudOutline />
        </n-icon>
        <h1 class="title">FoxNAS</h1>
        <p class="subtitle">NAS 文件管理系统</p>
      </div>

      <!-- 登录表单 -->
      <n-form ref="formRef" :model="formData" :rules="rules" @submit.prevent="handleLogin">
        <n-form-item path="username" label="用户名">
          <n-input
            v-model:value="formData.username"
            placeholder="请输入用户名"
            size="large"
            :input-props="{ autocomplete: 'username' }"
          >
            <template #prefix>
              <n-icon><PersonOutline /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="password" label="密码">
          <n-input
            v-model:value="formData.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password-on="click"
            :input-props="{ autocomplete: 'current-password' }"
          >
            <template #prefix>
              <n-icon><LockClosedOutline /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <!-- 验证码（仅在注册或忘记密码时显示） -->
        <n-form-item v-if="isRegisterMode" path="code" label="验证码">
          <n-input-group>
            <n-input
              v-model:value="formData.code"
              placeholder="请输入验证码"
              size="large"
            >
              <template #prefix>
                <n-icon><KeyOutline /></n-icon>
              </template>
            </n-input>
            <n-button
              size="large"
              :disabled="countdown > 0"
              @click="sendVerificationCode"
              :loading="sendingCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </n-button>
          </n-input-group>
        </n-form-item>

        <!-- 邮箱输入（仅注册时显示） -->
        <n-form-item v-if="isRegisterMode" path="email" label="邮箱">
          <n-input
            v-model:value="formData.email"
            placeholder="请输入邮箱地址"
            size="large"
          >
            <template #prefix>
              <n-icon><MailOutline /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item v-if="isRegisterMode" path="confirmPassword" label="确认密码">
          <n-input
            v-model:value="formData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="large"
            show-password-on="click"
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

        <!-- 登录/注册按钮 -->
        <n-form-item>
          <n-button
            type="primary"
            size="large"
            block
            :loading="loading"
            :disabled="loading"
            @click="handleLogin"
          >
            {{ isRegisterMode ? '注册' : '登录' }}
          </n-button>
        </n-form-item>

        <!-- 切换登录/注册 -->
        <div class="toggle-mode">
          <n-button quaternary size="small" @click="toggleMode">
            {{ isRegisterMode ? '已有账号？去登录' : '没有账号？去注册' }}
          </n-button>
        </div>
      </n-form>

      <!-- 初始化管理员提示 -->
      <div v-if="showInitAdmin" class="init-admin-section">
        <n-divider />
        <p class="init-tip">系统尚未初始化管理员账户</p>
        <n-button type="info" block @click="initAdmin" :loading="initingAdmin">
          初始化管理员账户
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
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import {
  CloudOutline,
  PersonOutline,
  LockClosedOutline,
  KeyOutline,
  MailOutline,
} from '@vicons/ionicons5'

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
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 32, message: '用户名长度必须在3-32个字符之间', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: unknown, value: string) => value === formData.password,
      message: '两次输入的密码不一致',
      trigger: 'blur',
    },
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度应为6位', trigger: 'blur' },
  ],
}

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
    message.error('请先输入邮箱地址')
    return
  }

  sendingCode.value = true
  try {
    await authStore.sendVerifyCode(formData.email)
    message.success('验证码已发送，请查收邮箱')
    countdown.value = 60
    countdownTimer = window.setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        if (countdownTimer) clearInterval(countdownTimer)
      }
    }, 1000)
  } catch (error: unknown) {
    const err = error as Error
    message.error(err.message || '发送验证码失败')
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
    message.error(err.message || '初始化失败')
  } finally {
    initingAdmin.value = false
  }
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
      await authStore.register(formData.username, formData.password, formData.code)
      message.success('注册成功，请登录')
      isRegisterMode.value = false
      formData.password = ''
    } else {
      // 登录
      await authStore.login(formData.username, formData.password)
      message.success('登录成功')

      // 跳转到重定向页面或首页
      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    }
  } catch (error: unknown) {
    const err = error as Error
    errorMessage.value = err.message || '操作失败，请稍后重试'

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
