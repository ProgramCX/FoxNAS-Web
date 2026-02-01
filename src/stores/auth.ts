/**
 * 认证状态管理
 * 处理用户登录、登出和认证状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiConfig } from '@/api/config'
import { http } from '@/api/client'
import { apiEndpoints } from '@/api/config'
import type { User, UserPermission } from '@/types'

const USERNAME_KEY = 'foxnas_username'

/**
 * 认证 Store
 */
export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(localStorage.getItem(apiConfig.tokenKey))
  const userInfo = ref<User | null>(null)
  const permissions = ref<string[]>([])
  const isInitialized = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.userName || '')
  const userUuid = computed(() => userInfo.value?.id || '')
  const userPermissions = computed(() => permissions.value)

  // Actions

  /**
   * 用户登录
   * @param username 用户名
   * @param password 密码
   */
  async function login(loginUsername: string, password: string): Promise<void> {
    const response = await http.post<{ accessToken: string; refreshToken: string }>(apiEndpoints.auth.login, { username: loginUsername, password })
    
    if (response && response.accessToken) {
      token.value = response.accessToken
      localStorage.setItem(apiConfig.tokenKey, response.accessToken)
      
      if (response.refreshToken) {
        localStorage.setItem(apiConfig.refreshTokenKey, response.refreshToken)
      }
      
      // 保存用户名到 store
      userInfo.value = {
        id: '',
        userName: loginUsername,
        state: 'enabled'
      }
      // 保存用户名到 localStorage（用于恢复会话时）
      localStorage.setItem(USERNAME_KEY, loginUsername)
      
      // 获取用户信息
      await fetchUserInfo()
      // 获取用户权限
      await fetchPermissions()
    }
  }

  /**
   * 用户注册
   * @param username 用户名
   * @param password 密码
   * @param code 验证码
   */
  async function register(username: string,emailAddr: string, password: string, code: string): Promise<string> {
    return await http.post<string>(apiEndpoints.auth.register, { username, emailAddr, password, code })
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
      // 从 token 中解析用户 UUID (sub 字段现在是 UUID)
      const payload = parseJwtPayload(token.value || '')
      if (payload?.sub) {
        // 只更新 id（UUID），保留已有的用户名
        userInfo.value = { 
          ...userInfo.value,
          id: String(payload.sub),
          state: 'enabled' 
        }
      }
    } catch {
      userInfo.value = null
    }
  }

  /**
   * 获取当前用户权限列表
   */
  async function fetchPermissions(): Promise<void> {
    try {
      const currentUuid = userUuid.value
      if (!currentUuid) return

      const response = await http.get<UserPermission[]>(apiEndpoints.user.permissions, {
        uuid: currentUuid
      })

      if (response && Array.isArray(response)) {
        permissions.value = response.map((p) => p.areaName)
      }
    } catch {
      permissions.value = []
    }
  }

  /**
   * 登出
   */
  function logout(): void {
    token.value = null
    userInfo.value = null
    permissions.value = []
    localStorage.removeItem(apiConfig.tokenKey)
    localStorage.removeItem(apiConfig.refreshTokenKey)
    localStorage.removeItem(apiConfig.authKey)
    localStorage.removeItem(USERNAME_KEY)
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
    const storedUsername = localStorage.getItem(USERNAME_KEY)
    if (storedToken) {
      token.value = storedToken
      // 恢复用户名（如果有）
      if (storedUsername) {
        userInfo.value = {
          id: '',
          userName: storedUsername,
          state: 'enabled'
        }
      }
      await fetchUserInfo()
      await fetchPermissions()
    }
    isInitialized.value = true
  }

  return {
    // State
    token,
    userInfo,
    permissions,
    isInitialized,
    // Getters
    isLoggedIn,
    username,
    userUuid,
    userPermissions,
    // Actions
    login,
    register,
    sendVerifyCode,
    initAdmin,
    fetchUserInfo,
    fetchPermissions,
    logout,
    initialize,
  }
})

export default useAuthStore
