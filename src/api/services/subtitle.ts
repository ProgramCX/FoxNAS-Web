/**
 * 外挂字幕文件 API 服务
 * 基于已存在的文件接口实现字幕搜索与读取
 * - /api/file/info/getList
 * - /api/file/op/get
 */

import { apiEndpoints, apiConfig } from '../config'
import { fileService } from './file'
import type { SubtitleFileInfo, SearchSubtitleResponse } from '@/types'

/**
 * 外挂字幕服务类
 */
class SubtitleService {
  private readonly subtitleExtSet = new Set(['ass', 'ssa'])

  private normalizePath(path: string): string {
    return (path || '').replace(/\\/g, '/').replace(/\/+/g, '/')
  }

  private getDirPath(filePath: string): string {
    const normalized = this.normalizePath(filePath)
    const idx = normalized.lastIndexOf('/')
    return idx > 0 ? normalized.substring(0, idx) : ''
  }

  private getBaseName(fileNameOrPath: string): string {
    const normalized = this.normalizePath(fileNameOrPath)
    const name = normalized.substring(normalized.lastIndexOf('/') + 1)
    const idx = name.lastIndexOf('.')
    return (idx > 0 ? name.substring(0, idx) : name).toLowerCase()
  }

  private mapSubtitleFile(item: {
    name: string
    path: string
    size: number
    lastModified: number
  }): SubtitleFileInfo {
    return {
      name: item.name,
      path: item.path,
      size: item.size,
      lastModified: item.lastModified,
      type: item.name.split('.').pop()?.toLowerCase() || 'ass',
    }
  }

  private findDefaultSubtitlePath(
    subtitles: SubtitleFileInfo[],
    videoNameOrPath: string
  ): string | null {
    if (!videoNameOrPath) return null
    const videoBase = this.getBaseName(videoNameOrPath)
    const sameName = subtitles.find((s) => this.getBaseName(s.name) === videoBase)
    return sameName?.path || null
  }

  /**
   * 递归搜索目录下的字幕文件
   * 基于 /api/file/info/getList 递归遍历目录
   * @param path 搜索目录路径
   * @param videoName 视频文件名（用于查找同名字幕）
   */
  async searchSubtitles(path: string, videoName: string = ''): Promise<SearchSubtitleResponse> {
    const root = this.normalizePath(path)
    if (!root) return { subtitles: [], defaultSubtitlePath: null }

    const subtitles: SubtitleFileInfo[] = []
    const queue: string[] = [root]
    const visited = new Set<string>()
    const maxDirs = 500

    while (queue.length > 0 && visited.size < maxDirs) {
      const currentDir = queue.shift() as string
      const key = this.normalizePath(currentDir)
      if (visited.has(key)) continue
      visited.add(key)

      try {
        const result = await fileService.getFileList(currentDir, 1, 1000, 'name', 'asc')
        const items = result.list || result.records || result.content || []

        for (const item of items) {
          if (item.type === 'directory') {
            queue.push(item.path)
            continue
          }

          const ext = item.name.split('.').pop()?.toLowerCase() || ''
          if (this.subtitleExtSet.has(ext)) {
            subtitles.push(this.mapSubtitleFile({
              name: item.name,
              path: item.path,
              size: item.size,
              lastModified: item.lastModified,
            }))
          }
        }
      } catch {
        // 单个目录读取失败时跳过，继续其他目录
      }
    }

    return {
      subtitles,
      defaultSubtitlePath: this.findDefaultSubtitlePath(subtitles, videoName),
    }
  }

  /**
   * 获取当前目录下的字幕文件（非递归）
   * 基于 /api/file/info/getList
   * @param path 目录路径
   * @param videoName 视频文件名（用于查找同名字幕）
   */
  async listSubtitles(path: string, videoName: string = ''): Promise<SearchSubtitleResponse> {
    const result = await fileService.getFileList(path, 1, 1000, 'name', 'asc')
    const items = result.list || result.records || result.content || []
    const subtitles = items
      .filter((item) => item.type !== 'directory')
      .filter((item) => this.subtitleExtSet.has(item.name.split('.').pop()?.toLowerCase() || ''))
      .map((item) => this.mapSubtitleFile({
        name: item.name,
        path: item.path,
        size: item.size,
        lastModified: item.lastModified,
      }))

    return {
      subtitles,
      defaultSubtitlePath: this.findDefaultSubtitlePath(subtitles, videoName),
    }
  }

  /**
   * 获取字幕文件内容
   * GET /api/file/op/get?path={path}&inline=true
   * @param path 字幕文件路径
   * @returns 字幕文件文本内容
   */
  async getSubtitleContent(path: string): Promise<string> {
    const token = localStorage.getItem(apiConfig.tokenKey) || ''
    const url = `${apiConfig.baseURL}${apiEndpoints.file.operation.get}?path=${encodeURIComponent(path)}&inline=true`

    const response = await fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })

    if (!response.ok) {
      throw new Error(`字幕读取失败: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    return await blob.text()
  }

  /**
   * 获取字幕文件下载 URL
   * @param path 字幕文件路径
   * @param inline 是否内联显示
   */
  getSubtitleDownloadUrl(path: string, inline: boolean = true): string {
    const token = localStorage.getItem(apiConfig.tokenKey) || ''
    return `${apiConfig.baseURL}${apiEndpoints.file.operation.get}?path=${encodeURIComponent(path)}&inline=${inline}&token=${encodeURIComponent(token)}`
  }

  /**
   * 获取字幕文件内容 URL（用于 ass.js 加载）
   * @param path 字幕文件路径
   */
  getSubtitleContentUrl(path: string): string {
    const token = localStorage.getItem(apiConfig.tokenKey) || ''
    return `${apiConfig.baseURL}${apiEndpoints.file.operation.get}?path=${encodeURIComponent(path)}&inline=true&token=${encodeURIComponent(token)}`
  }

  /**
   * 检查同名字幕文件
   * 基于当前目录字幕列表本地匹配
   * @param videoPath 视频文件路径
   * @returns 同名字幕文件信息，不存在返回 null
   */
  async checkSameNameSubtitle(videoPath: string): Promise<SubtitleFileInfo | null> {
    const dirPath = this.getDirPath(videoPath)
    if (!dirPath) return null

    const result = await this.listSubtitles(dirPath, videoPath)
    const targetPath = result.defaultSubtitlePath
    if (!targetPath) return null
    return result.subtitles.find((s) => s.path === targetPath) || null
  }
}

export const subtitleService = new SubtitleService()
export default subtitleService
