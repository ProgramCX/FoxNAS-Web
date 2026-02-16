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
  content?: T[]
  total: number
  totalElements?: number
  from: number
  to: number
  page: number
  pageNumber?: number
  size: number
  pageSize?: number
  totalPage?: number
  totalPages?: number
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
  types: string[]
}

/**
 * 文件类别
 */
export type FileCategory = 'directory' | 'video' | 'audio' | 'image' | 'doc' | 'archive' | 'code' | 'other'

/**
 * 文件相关类型
 */
export interface FileInfo {
  name: string
  path: string
  size: number
  lastModified: number
  type: 'directory' | 'file'
  /** MIME 类型 */
  mime?: string
  /** 文件类别：video / audio / image / doc / archive / code / other / directory */
  category?: FileCategory
  /** 浏览器是否可以原生播放/预览 */
  canPlay?: boolean
  /** 是否需要转码（仅视频类型且不可直接播放时为 true） */
  needTranscode?: boolean
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
  gradient?: string
  bgColor?: string
}

/**
 * 上传请求类型
 */
export interface UploadOptions {
  file: File
  path: string
  onProgress?: (progress: number) => void
}

/**
 * 错误日志类型
 */
export interface ErrorLog {
  id: string
  userName: string
  moduleName: string
  errorMessage: string
  stackTrace: string
  uri: string
  method: string
  params: string
  ipAddress: string
  createdTime: string
  exceptionType: string
}

/**
 * 日志查询参数
 */
export interface LogQueryParams {
  page?: number
  size?: number
  moduleName?: string
  userName?: string
  exceptionType?: string
  startTime?: string
  endTime?: string
}

/**
 * 系统监控相关类型
 */

/**
 * 时间单位类型
 * min: 分钟, h: 小时, d: 天, m: 月, y: 年
 */
export type TimeUnit = 'min' | 'h' | 'd' | 'm' | 'y'

/**
 * 磁盘指标
 */
export interface SysDiskMetrics {
  id: string
  mainId: string | null
  diskName: string
  usedSpace: number
  totalSpace: number
}

/**
 * 系统主指标
 */
export interface SysMainMetrics {
  id: string
  cpu: number
  totalMemory: number
  usedMemory: number
  uploadSpeed: number
  downloadSpeed: number
  timestamp: string
  diskMetricsList: SysDiskMetrics[]
}

/**
 * 时间范围预设选项
 */
export interface TimeRangePreset {
  label: string
  value: number
  unit: TimeUnit
}

/**
 * 图表导出选项
 */
export interface ChartExportOptions {
  filename?: string
  type?: 'png' | 'jpeg'
  pixelRatio?: number
  backgroundColor?: string
}

// ==================== 媒体信息类型 (MediaServiceController) ====================

/**
 * 媒体轨道信息 (对应后端 MediaInfoDTO.TrackDTO)
 */
export interface MediaTrackInfo {
  index: number
  type: 'video' | 'audio' | 'subtitle' | 'others'
  codec: string
  language?: string
  title?: string
}

/**
 * 媒体元数据 (对应后端 MediaInfoDTO)
 */
export interface MediaMetadata {
  title?: string
  durationSeconds: number
  videoTrackCount: number
  audioTrackCount: number
  tracks: MediaTrackInfo[]
}

/**
 * 指纹检查响应 (对应后端 FingerprintCheckResponse)
 */
export interface FingerprintCheckResponse {
  existed: boolean
  jobId?: string
  fingerprint: string
  hlsPath?: string
}

/**
 * 转码提交请求 (对应后端 TranscodeRequest)
 */
export interface TranscodeSubmitRequest {
  path: string
  audioTrackIndex?: number
  subtitleTrackIndex?: number
  immediate?: boolean
  fingerprint?: string
}

/**
 * 转码提交响应
 */
export interface TranscodeSubmitResponse {
  jobId: string
  fingerprint: string
  reused: string
  hlsPath?: string
  status?: string
}

/**
 * 转码状态轮询响应 (对应后端 JobStatus)
 */
export interface TranscodeStatusResponse {
  state: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  progress: number
  hlsPath?: string
  stages?: number
  currentStage?: number
  message?: string
}

/**
 * 字幕转码提交请求 (对应后端 SubtitleTranscodeRequest)
 */
export interface SubtitleTranscodeRequest {
  path: string
  subtitleTrackIndex: number
}

/**
 * 字幕转码状态响应 (对应后端 SubtitleJobStatus)
 */
export interface SubtitleStatusResponse {
  state: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  progress: number
  vttPath?: string
  message?: string
  completeTime?: string
}

// ==================== 转码任务相关类型 ====================

/**
 * 转码任务状态
 */
export type TranscodeJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

/**
 * 转码任务类型
 */
export type TranscodeJobType = 'VIDEO' | 'SUBTITLE'

/**
 * 转码任务实体
 */
export interface TranscodeJob {
  id?: number
  jobId: string
  creatorId: string
  videoPath: string
  fingerprint?: string
  jobType?: TranscodeJobType
  audioTrackIndex?: number
  subtitleTrackIndex?: number
  status: TranscodeJobStatus
  progress?: number
  currentStage?: number
  totalStages?: number
  outputPath?: string
  hlsPath?: string
  errorMessage?: string
  retryCount?: number
  isImmediate?: boolean
  createdAt?: string
  updatedAt?: string
  completedAt?: string
}

/**
 * 创建转码任务请求
 */
export interface CreateTranscodeJobRequest {
  videoPath: string
  audioTrackIndex?: number
  subtitleTrackIndex?: number
  immediate?: boolean
  fingerprint?: string
}

/**
 * 指纹检查结果
 */
export interface FingerprintCheckResult {
  existed: boolean
  jobId?: string
  fingerprint: string
  hlsPath?: string
  status?: string
}

/**
 * 任务实时进度（getJobProgress）
 */
export interface TranscodeJobProgress {
  progress: string
  state: string
  currentStage?: string
  totalStages?: string
}

/**
 * 转码任务统计
 */
export interface TranscodeStatistics {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
  cancelled: number
  [key: string]: number
}

/**
 * 后端通用 Result 包装
 */
export interface Result<T = unknown> {
  code: number
  message?: string
  data?: T
}

/**
 * IPage 分页结构 (MyBatis-Plus)
 */
export interface IPage<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}
