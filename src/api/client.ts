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

/**
 * 请求拦截器
 * 自动添加 JWT Token 到请求头
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
    const { response } = error

    // 401 未授权 - Token 过期或无效
    if (response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      
      // 如果不是登录页面，跳转到登录页
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
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
