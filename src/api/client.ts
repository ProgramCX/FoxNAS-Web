/**
 * Axios HTTP 客户端封装
 * 提供统一的请求/响应处理、认证拦截和错误处理
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { apiConfig, apiEndpoints } from './config'
import { useAuthStore } from '@/stores/auth'

/**
 * 创建 axios 实例
 */
const httpClient: AxiosInstance = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 是否正在刷新 token 的标志
let isRefreshing = false
// 等待刷新 token 的请求队列
let failedRequestsQueue: Array<{ resolve: (token: string) => void; reject: (error: Error) => void }> = []

/**
 * 请求拦截器
 * 自动添加 JWT Access Token 到请求头
 */
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(apiConfig.tokenKey)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 尝试刷新 token
 */
async function tryRefreshToken(): Promise<string | null> {
  console.log('尝试刷新 token...')
  const authStore = useAuthStore()
  const uuid = authStore.userUuid
  if(!uuid) {
    return null
  }
  const refreshToken = localStorage.getItem(apiConfig.refreshTokenKey)
  if (!refreshToken) {
    return null
  }

  try {
    const response = await axios.post(
      `${apiConfig.baseURL}/auth/refresh`,
      { refreshToken,uuid },
      { headers: { 'Content-Type': 'application/json' } }
    )

    const { accessToken, refreshToken: newRefreshToken } = response.data
    if (accessToken) {
      localStorage.setItem(apiConfig.tokenKey, accessToken)
      console.log('token 刷新成功')
      if (newRefreshToken) {
        localStorage.setItem(apiConfig.refreshTokenKey, newRefreshToken)
      }
      return accessToken
    }
    return null
  } catch (error) {
    // 刷新失败，清除所有 token
    localStorage.removeItem(apiConfig.tokenKey)
    localStorage.removeItem(apiConfig.refreshTokenKey)
    return null
  }
}

/**
 * 响应拦截器
 * 统一处理响应和错误
 */
httpClient.interceptors.response.use(
  (response) => {
    // 对于文件下载，直接返回响应
    if (response.config.responseType === 'blob') {
      return response
    }

    // 对于其他响应，解构返回数据
    return response
  },
  async (error) => {
    console.error('API 响应错误:', error)

    const { response, config } = error

    // 401 未授权 - Token 过期或无效
    if (response?.status === 401 && config) {
      // 如果是刷新 token 接口或登录接口，不进行刷新
      if (config.url?.includes('/auth/refresh') || config.url?.includes('/auth/login')) {
        const authStore = useAuthStore()
        authStore.logout()
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      // 如果已经在刷新 token，加入队列等待
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            resolve: (token: string) => {
              config.headers.Authorization = `Bearer ${token}`
              resolve(httpClient(config))
            },
            reject: (err: Error) => {
              reject(err)
            },
          })
        })
      }

      isRefreshing = true

      try {
        
        const newToken = await tryRefreshToken()
        if (newToken) {
          // 刷新成功，更新所有等待的请求
          config.headers.Authorization = `Bearer ${newToken}`
          failedRequestsQueue.forEach(({ resolve }) => resolve(newToken))
          failedRequestsQueue = []
          return httpClient(config)
        } else {
          // 刷新失败，所有请求都拒绝
          failedRequestsQueue.forEach(({ reject }) => reject(error))
          failedRequestsQueue = []
          throw error
        }
      } catch (refreshError) {
        failedRequestsQueue.forEach(({ reject }) => reject(refreshError as Error))
        failedRequestsQueue = []
        
        const authStore = useAuthStore()
        authStore.logout()
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // 处理错误响应
    if (response?.data) {
      // 如果是 blob 响应，尝试解析错误信息
      if (response.data instanceof Blob) {
        const text = await response.data.text()
        try {
          const errorData = JSON.parse(text)
          return Promise.reject(new Error(errorData.message || errorData.error || '请求失败'))
        } catch {
          return Promise.reject(new Error(text || '请求失败'))
        }
      }
      return Promise.reject(new Error(response.data.message || response.data.error || '请求失败'))
    }

    return Promise.reject(error)
  }
)

/**
 * HTTP 请求方法封装
 */
export const http = {
  /**
   * GET 请求
   */
  get<T = unknown>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
    return httpClient.get(url, { params, ...config }).then((res) => res.data)
  },

  /**
   * POST 请求
   */
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return httpClient.post(url, data, config).then((res) => res.data)
  },

  /**
   * PUT 请求
   */
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return httpClient.put(url, data, config).then((res) => res.data)
  },

  /**
   * DELETE 请求
   */
  delete<T = unknown>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
    return httpClient.delete(url, { params, ...config }).then((res) => res.data)
  },

  /**
   * PATCH 请求
   */
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return httpClient.patch(url, data, config).then((res) => res.data)
  },

  /**
   * 上传文件
   */
  upload<T = unknown>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    return httpClient
      .post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        },
      })
      .then((res) => res.data)
  },

  /**
   * 下载文件
   */
  download(url: string, params?: Record<string, unknown>, filename?: string): Promise<void> {
    return httpClient
      .get(url, {
        params,
        responseType: 'blob',
      })
      .then((response) => {
        const blob = new Blob([response.data])
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = filename || 'download'
        link.click()
        window.URL.revokeObjectURL(link.href)
      })
  },
}

// 导出 httpClient 供特殊需求使用
export { httpClient }

export default http
