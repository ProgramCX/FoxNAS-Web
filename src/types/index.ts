/**
 * FoxNAS Web API 类型定义
 * 基于后端API接口设计
 */

/**
 * 通用响应结构
 */
export interface ApiResponse<T = unknown> {
  status?: string
  message?: string
  data?: T
  error?: string
}

/**
 * 分页响应结构
 */
export interface PageResponse<T> {
  list?: T[]
  records?: T[]
  total: number
  from: number
  to: number
  page: number
  size: number
  pageSize?: number
  totalPage: number
}

/**
 * 用户相关类型
 */
export interface User {
  id?: string
  userName: string
  password?: string
  state: 'enabled' | 'disabled'
  createTime?: string
  updateTime?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  code: string
}

export interface UserPermission {
  permissionId?: number
  ownerUuid: string
  areaName: string
  permissionType: string
}

export interface UserResource {
  resourceId?: number
  ownerUuid: string
  folderName: string
  permissionType: string
}

/**
 * 文件相关类型
 */
export interface FileInfo {
  name: string
  path: string
  size: number
  lastModified: number
  type: 'directory' | 'file'
}

export interface AuthedDir {
  path: string
  permissions: string
  /**
   * 权限详情
   */
  readable?: boolean
  writable?: boolean
  downloadable?: boolean
  uploadable?: boolean
  deletable?: boolean
  renameable?: boolean
}

export interface FileOperationResult {
  status: 'success' | 'failed'
  message?: string
  totalDeleted?: number
  totalMoved?: number
  totalCopied?: number
  successCount?: number
  failedCount?: number
  failedPaths?: Array<{ path: string | string[]; error: string }>
}

/**
 * DDNS相关类型
 */
export interface DnsProvider {
  name: string
  value: string
  code: number
}

export interface AccessSecret {
  id?: number
  accessKey: string
  accessSecret: string
  accessName: string
  accessDescription?: string
  dnsCode?: number
  createTime?: string
  updateTime?: string
}

export interface DDNSTask {
  id?: number
  taskName?: string
  taskDescription?: string
  taskIp?: string
  domainRr?: string
  mainDomain?: string
  dnsSecretId?: number
  syncInterval?: number
  status?: number
  ipType?: string
  isPublicIp?: number
  lastFailed?: boolean
  realStatus?: string
  createTime?: string
  updateTime?: string
}

export interface DDNSTaskStatus {
  id: number
  status: string
}

export interface DDNSConfig {
  dnsProviders: DnsProvider[]
  accessKeys: PageResponse<AccessSecret>
}

/**
 * 硬件信息类型
 */
export interface HardwareInfoDTO {
  cpu?: {
    name: string
    usage: number
    cores: number
    threads: number
  }
  memory?: {
    total: number
    available: number
    used: number
    usage: string
  }
  disk?: Array<{
    device: string
    total: number
    available: number
    used: number
    usage: string
    mountPoint: string
  }>
  network?: Array<{
    name: string
    upload: number
    download: number
    uploadSpeed: string
    downloadSpeed: string
  }>
}

/**
 * 媒体相关类型
 */
export interface MediaInfoDTO {
  duration: number
  width?: number
  height?: number
  format?: string
  bitrate?: number
  codec?: string
}

export interface MediaTypeResponse {
  type: 'video' | 'audio' | 'image' | 'other'
  mimeType?: string
}

/**
 * 系统状态类型
 */
export interface SystemStatus {
  status: 'online' | 'offline'
  uptime?: number
  version?: string
}

/**
 * 主题类型
 */
export interface ThemeConfig {
  name: string
  primaryColor: string
  darkMode: boolean
}

/**
 * 上传请求类型
 */
export interface UploadOptions {
  file: File
  path: string
  onProgress?: (progress: number) => void
}
