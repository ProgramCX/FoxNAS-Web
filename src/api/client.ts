/**
 * Axios HTTP 客户端封装
 * 提供统一的请求/响应处理、认证拦截和错误处理
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { apiConfig } from './config'
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
    const fileInForm = formData.get('file') as File | null
    return httpClient
      .post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (!onProgress) return

          // Axios v1 提供 progress (0~1)，优先使用以避免 total 为空导致不更新
          if (typeof progressEvent.progress === 'number') {
            onProgress(Math.round(progressEvent.progress * 100))
            return
          }

          const total = progressEvent.total || fileInForm?.size || 0
          if (total > 0) {
            const progress = Math.round((progressEvent.loaded * 100) / total)
            onProgress(progress)
          }
        },
      })
      .then((res) => res.data)
  },

  /**
   * 下载文件
   * 使用 fetch API 配合 ReadableStream，支持显示下载进度
   */
  async download(
    url: string,
    params?: Record<string, unknown>,
    filename?: string,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    const token = localStorage.getItem(apiConfig.tokenKey)
    const queryParams = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : ''
    const fullUrl = `${apiConfig.baseURL}${url}${queryParams}`

    const response = await fetch(fullUrl, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`)
    }

    const contentLength = response.headers.get('Content-Length')
    const total = contentLength ? parseInt(contentLength, 10) : 0
    const reader = response.body?.getReader()

    if (!reader) {
      throw new Error('无法读取响应流')
    }

    const chunks: Uint8Array[] = []
    let loaded = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      chunks.push(value)
      loaded += value.length

      if (onProgress) {
        onProgress(loaded, total)
      }
    }

    // 合并所有 chunks
    const allChunks = new Uint8Array(loaded)
    let position = 0
    for (const chunk of chunks) {
      allChunks.set(chunk, position)
      position += chunk.length
    }

    // 创建 blob 并下载
    const blob = new Blob([allChunks])
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(link.href)
  },
}

// 导出 httpClient 供特殊需求使用
export { httpClient }

export default http
