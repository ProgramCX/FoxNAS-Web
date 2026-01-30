/**
 * 认证状态管理
 * 处理用户登录、登出和认证状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiConfig } from '@/api/config'
import { http } from '@/api/client'
import { apiEndpoints } from '@/api/config'
import type { User } from '@/types'
import { useRouter } from 'vue-router'

/**
 * 认证 Store
 */
export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(localStorage.getItem(apiConfig.tokenKey))
  const userInfo = ref<User | null>(null)
  const isInitialized = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.userName || '')

  // Actions

  /**
   * 用户登录
   * @param username 用户名
   * @param password 密码
   */
  async function login(username: string, password: string): Promise<void> {
    const response = await http.post<string>(apiEndpoints.auth.login, { username, password })
    
    if (response) {
      token.value = response
      localStorage.setItem(apiConfig.tokenKey, response)
      
      // 获取用户信息
      await fetchUserInfo()
    }
  }

  /**
   * 用户注册
   * @param username 用户名
   * @param password 密码
   * @param code 验证码
   */
  async function register(username: string, password: string, code: string): Promise<string> {
    return await http.post<string>(apiEndpoints.auth.register, { username, password, code })
  }

  /**
   * 发送验证码
   * @param email 邮箱地址
   */
  async function sendVerifyCode(email: string): Promise<string> {
    return await http.post<string>(apiEndpoints.auth.sendVerifyCode, { emailAddr: email })
  }

  /**
   * 初始化管理员账户
   * 仅在系统中没有管理员时可用
   */
  async function initAdmin(): Promise<string> {
    return await http.post<string>(apiEndpoints.auth.iniAdmin)
  }

  /**
   * 获取当前用户信息
   */
  async function fetchUserInfo(): Promise<void> {
    try {
      // 从 token 中解析用户名
      const payload = parseJwtPayload(token.value || '')
      if (payload?.sub) {
        userInfo.value = { userName: payload.sub, state: 'enabled' }
      }
    } catch {
      userInfo.value = null
    }
  }

  /**
   * 登出
   */
  function logout(): void {
    token.value = null
    userInfo.value = null
    localStorage.removeItem(apiConfig.tokenKey)
    localStorage.removeItem(apiConfig.authKey)
  }

  /**
   * 解析 JWT Payload
   */
  function parseJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const base64Url = token.split('.')[1]
      if (!base64Url) return null
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch {
      return null
    }
  }

  /**
   * 初始化认证状态
   */
  async function initialize(): Promise<void> {
    if (isInitialized.value) return
    
    const storedToken = localStorage.getItem(apiConfig.tokenKey)
    if (storedToken) {
      token.value = storedToken
      await fetchUserInfo()
    }
    isInitialized.value = true
  }

  return {
    // State
    token,
    userInfo,
    isInitialized,
    // Getters
    isLoggedIn,
    username,
    // Actions
    login,
    register,
    sendVerifyCode,
    initAdmin,
    fetchUserInfo,
    logout,
    initialize,
  }
})

export default useAuthStore
