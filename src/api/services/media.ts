/**
 * 媒体服务 API
 * 封装 MediaServiceController 转码/字幕相关端点
 */

import { http } from '../client'
import { apiEndpoints, apiConfig } from '../config'
import type {
  MediaMetadata,
  FingerprintCheckResponse,
  TranscodeSubmitRequest,
  TranscodeSubmitResponse,
  TranscodeStatusResponse,
  SubtitleTranscodeRequest,
  SubtitleStatusResponse,
  Result,
} from '@/types'

/**
 * 媒体转码/字幕服务类
 */
class MediaService {
  /**
   * 获取媒体元数据（轨道信息）
   * GET /api/file/media/metadata?path={path}
   */
  async getMetadata(path: string): Promise<MediaMetadata> {
    return await http.get<MediaMetadata>(apiEndpoints.file.media.metadata, { path })
  }

  /**
   * 检查文件指纹（是否已转码）
   * GET /api/file/media/transcode/check-fingerprint?path={path}
   */
  async checkFingerprint(path: string): Promise<FingerprintCheckResponse> {
    return await http.get<FingerprintCheckResponse>(
      apiEndpoints.file.media.checkFingerprint,
      { path }
    )
  }

  /**
   * 提交转码任务
   * POST /api/file/media/transcode/submit
   */
  async submitTranscode(request: TranscodeSubmitRequest): Promise<TranscodeSubmitResponse> {
    return await http.post<TranscodeSubmitResponse>(
      apiEndpoints.file.media.transcodeSubmit,
      request
    )
  }

  /**
   * 查询转码状态
   * GET /api/file/media/transcode/status/{jobId}
   */
  async getTranscodeStatus(jobId: string): Promise<TranscodeStatusResponse> {
    return await http.get<TranscodeStatusResponse>(
      `${apiEndpoints.file.media.transcodeStatus}/${jobId}`
    )
  }

  /**
   * 提交字幕提取任务
   * POST /api/file/media/subtitle/submit
   */
  async submitSubtitle(request: SubtitleTranscodeRequest): Promise<{ jobId: string }> {
    return await http.post<{ jobId: string }>(
      apiEndpoints.file.media.subtitleSubmit,
      request
    )
  }

  /**
   * 查询字幕提取状态
   * GET /api/file/media/subtitle/status/{jobId}
   */
  async getSubtitleStatus(jobId: string): Promise<SubtitleStatusResponse> {
    return await http.get<SubtitleStatusResponse>(
      `${apiEndpoints.file.media.subtitleStatus}/${jobId}`
    )
  }

  /**
   * 获取字幕 VTT 内容的 URL
   * GET /api/file/media/subtitle/{jobId}
   */
  getSubtitleVttUrl(jobId: string): string {
    const token = localStorage.getItem(apiConfig.tokenKey) || ''
    return `${apiConfig.baseURL}${apiEndpoints.file.media.subtitleVtt}/${jobId}?token=${encodeURIComponent(token)}`
  }

  /**
   * 获取 HLS 播放列表 URL
   * GET /api/file/media/stream/{jobId}/playlist.m3u8
   * 注意：stream 接口无需鉴权，直接返回文件
   */
  getHlsPlaylistUrl(jobId: string): string {
    return `${apiConfig.baseURL}${apiEndpoints.file.media.hlsStream}/${jobId}/playlist.m3u8`
  }
}

export const mediaService = new MediaService()
export default mediaService
