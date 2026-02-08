/**
 * 文件管理 API 服务
 * 提供文件和目录操作的网络请求功能
 */

import { http, httpClient } from '../client'
import { apiEndpoints, apiConfig } from '../config'
import type { FileInfo, PageResponse, AuthedDir, FileOperationResult } from '@/types'

/**
 * 文件管理服务类
 */
class FileService {
  /**
   * 获取目录文件列表
   * GET /api/file/info/getList
   * @param path 目录路径
   * @param page 页码
   * @param pageSize 每页数量
   * @param sortBy 排序字段
   * @param order 排序方向
   */
  async getFileList(
    path: string,
    page: number = 1,
    pageSize: number = 200,
    sortBy: string = 'name',
    order: string = 'asc'
  ): Promise<PageResponse<FileInfo>> {
    return await http.get<PageResponse<FileInfo>>(apiEndpoints.file.info.list, {
      path,
      page,
      pageSize,
      sortBy,
      order,
    })
  }

  /**
   * 获取目录列表（仅文件夹）
   * GET /api/file/info/dir-list
   * @param path 父目录路径
   */
  async getDirList(path: string): Promise<Array<{ name: string; path: string }>> {
    return await http.get<Array<{ name: string; path: string }>>(
      apiEndpoints.file.info.dirList,
      { path }
    )
  }

  /**
   * 获取已授权目录列表
   * GET /api/filePermission/getAuthedDirs
   */
  async getAuthedDirs(): Promise<AuthedDir[]> {
    return await http.get<AuthedDir[]>(apiEndpoints.file.permission.authedDirs)
  }

  /**
   * 删除文件或目录
   * DELETE /api/file/op/delete
   * @param paths 文件路径列表 (请求体)
   */
  async deleteFiles(paths: string[]): Promise<FileOperationResult> {
    return await httpClient.delete(apiEndpoints.file.operation.delete, {
      data: paths,
      headers: { 'Content-Type': 'application/json' }
    }).then((res) => res.data)
  }

  /**
   * 移动文件或目录
   * PUT /api/file/op/move
   * @param pathsList 移动路径列表 [{oldPath, newPath}]
   */
  async moveFiles(
    pathsList: Array<{ oldPath: string; newPath: string }>
  ): Promise<FileOperationResult> {
    return await http.put<FileOperationResult>(apiEndpoints.file.operation.move, pathsList)
  }

  /**
   * 复制文件或目录
   * POST /api/file/op/copy
   * @param pathsList 复制路径列表 [{oldPath, newPath}]
   */
  async copyFiles(
    pathsList: Array<{ oldPath: string; newPath: string }>
  ): Promise<FileOperationResult> {
    return await http.post<FileOperationResult>(apiEndpoints.file.operation.copy, pathsList)
  }

  /**
   * 重命名文件或目录
   * PUT /api/file/op/rename
   * @param path 文件路径
   * @param newName 新名称
   */
  async renameFile(path: string, newName: string): Promise<FileOperationResult> {
    return await http.put<FileOperationResult>(apiEndpoints.file.operation.rename, null, {
      params: { path, newName },
    })
  }

  /**
   * 创建目录
   * POST /api/file/op/createDir
   * @param path 目录路径
   */
  async createDir(path: string): Promise<FileOperationResult> {
    return await http.post<FileOperationResult>(
      apiEndpoints.file.operation.createDir,
      null,
      { params: { path } }
    )
  }

  /**
   * 上传文件
   * POST /api/file/op/upload
   * @param path 目标路径 (查询参数)
   * @param file 文件对象
   * @param onProgress 进度回调
   * @param abortController 取消控制器
   */
  async uploadFile(
    path: string,
    file: File,
    onProgress?: (total: number, completed: number) => void,
    abortController?: AbortController
  ): Promise<FileOperationResult> {
    const formData = new FormData()
    formData.append('file', file)

    const url = `${apiConfig.baseURL}${apiEndpoints.file.operation.upload}?path=${encodeURIComponent(path)}`
    const token = localStorage.getItem(apiConfig.tokenKey)

    return await new Promise<FileOperationResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // 监听取消信号
      if (abortController) {
        abortController.signal.addEventListener('abort', () => {
          xhr.abort()
          reject(new Error('Upload cancelled'))
        })
      }

      xhr.open('POST', url, true)

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      xhr.upload.onprogress = (event) => {
        if (!onProgress) return

        // 直接使用文件大小计算进度，不依赖 event.total
        const total = file.size
        if (total > 0) {
          const progress = Math.min(100, Math.round((event.loaded * 100) / total))
          onProgress(progress, 100)
        } else if (event.loaded > 0) {
          onProgress(1, 100)
        }
      }

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = xhr.responseText ? JSON.parse(xhr.responseText) : null
            resolve(data as FileOperationResult)
          } catch (err) {
            reject(err as Error)
          }
        } else {
          if (xhr.status === 0) {
            reject(new Error('Upload cancelled'))
          } else {
            reject(new Error(xhr.statusText || 'Upload failed'))
          }
        }
      }

      xhr.onerror = () => {
        reject(new Error('Upload failed'))
      }

      xhr.onabort = () => {
        reject(new Error('Upload cancelled'))
      }

      xhr.send(formData)
    })
  }

  /**
   * 下载文件
   * GET /api/file/op/get
   * @param path 文件路径
   * @param filename 下载文件名
   * @param onProgress 进度回调
   * @param abortController 取消控制器
   */
  async downloadFile(
    path: string, 
    filename?: string, 
    onProgress?: (loaded: number, total: number) => void,
    abortController?: AbortController
  ): Promise<void> {
    const token = localStorage.getItem(apiConfig.tokenKey)
    const url = `${apiConfig.baseURL}${apiEndpoints.file.operation.get}?path=${encodeURIComponent(path)}`

    const response = await fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      signal: abortController?.signal,
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

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        chunks.push(value)
        loaded += value.length

        if (onProgress) {
          onProgress(loaded, total)
        }
      }
    } catch (error) {
      if (abortController?.signal.aborted) {
        throw new Error('Download cancelled')
      }
      throw error
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
  }

  /**
   * 获取文件下载 URL
   * @param path 文件路径
   */
  getDownloadUrl(path: string): string {
    return `/api${apiEndpoints.file.operation.get}?path=${encodeURIComponent(path)}`
  }

  /**
   * 获取媒体文件访问 Token
   * GET /api/file/media/validate
   * @param path 文件路径
   */
  async getMediaToken(path: string): Promise<string> {
    return await http.get<string>(apiEndpoints.file.media.validate, { path })
  }

  /**
   * 获取媒体元数据
   * GET /api/file/media/metadata
   * @param path 文件路径
   */
  async getMediaMetadata(path: string): Promise<unknown> {
    return await http.get(apiEndpoints.file.media.metadata, { path })
  }

  /**
   * 获取媒体类型
   * GET /api/file/media/media-type
   * @param path 文件路径
   */
  async getMediaType(path: string): Promise<string> {
    return await http.get<string>(apiEndpoints.file.media.mediaType, { path })
  }

  /**
   * 获取视频流 URL
   * @param path 文件路径
   * @param token 访问令牌
   */
  getVideoStreamUrl(path: string, token: string): string {
    return `/api${apiEndpoints.file.media.videoStream}?path=${encodeURIComponent(path)}&token=${token}`
  }
}

export const fileService = new FileService()
export default fileService
