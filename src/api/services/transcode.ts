/**
 * 转码任务 API 服务
 * 提供转码任务的创建、查询、管理等网络请求功能
 */

import { http } from '../client'
import { apiEndpoints } from '../config'
import type {
  TranscodeJob,
  CreateTranscodeJobRequest,
  FingerprintCheckResult,
  TranscodeJobProgress,
  TranscodeStatistics,
  Result,
  IPage,
} from '@/types'

/**
 * 转码任务服务类
 */
class TranscodeJobService {
  /**
   * 创建视频转码任务
   * POST /api/transcode/jobs/create
   * @param request 创建任务请求
   */
  async createJob(request: CreateTranscodeJobRequest): Promise<Result<TranscodeJob>> {
    return await http.post<Result<TranscodeJob>>(apiEndpoints.transcode.create, request)
  }

  /**
   * 检查视频指纹（避免重复转码）
   * GET /api/transcode/jobs/check-fingerprint
   * @param videoPath 视频文件路径
   * @param fingerprint 可选指纹
   */
  async checkFingerprint(videoPath: string, fingerprint?: string): Promise<Result<FingerprintCheckResult>> {
    const params: Record<string, unknown> = { videoPath }
    if (fingerprint) {
      params.fingerprint = fingerprint
    }
    return await http.get<Result<FingerprintCheckResult>>(apiEndpoints.transcode.checkFingerprint, params)
  }

  /**
   * 查询任务详情
   * GET /api/transcode/jobs/{jobId}
   * @param jobId 任务ID
   */
  async getJobDetail(jobId: string): Promise<Result<TranscodeJob>> {
    return await http.get<Result<TranscodeJob>>(`${apiEndpoints.transcode.detail}/${jobId}`)
  }

  /**
   * 获取任务实时进度（轮询）
   * GET /api/transcode/jobs/{jobId}/progress
   * @param jobId 任务ID
   */
  async getJobProgress(jobId: string): Promise<Result<TranscodeJobProgress>> {
    return await http.get<Result<TranscodeJobProgress>>(`${apiEndpoints.transcode.progress}/${jobId}/progress`)
  }

  /**
   * 分页查询任务列表
   * GET /api/transcode/jobs/list
   * @param page 页码，默认1
   * @param size 每页大小，默认10
   */
  async listJobs(page: number = 1, size: number = 10): Promise<Result<IPage<TranscodeJob>>> {
    return await http.get<Result<IPage<TranscodeJob>>>(apiEndpoints.transcode.list, { page, size })
  }

  /**
   * 查询所有任务（不分页）
   * GET /api/transcode/jobs/list-all
   */
  async listAllJobs(): Promise<Result<TranscodeJob[]>> {
    return await http.get<Result<TranscodeJob[]>>(apiEndpoints.transcode.listAll)
  }

  /**
   * 停止进行中的任务
   * POST /api/transcode/jobs/{jobId}/stop
   * @param jobId 任务ID
   */
  async stopJob(jobId: string): Promise<Result<string>> {
    return await http.post<Result<string>>(`${apiEndpoints.transcode.stop}/${jobId}/stop`)
  }

  /**
   * 重试失败/已取消的任务
   * POST /api/transcode/jobs/{jobId}/retry
   * @param jobId 任务ID
   */
  async retryJob(jobId: string): Promise<Result<string>> {
    return await http.post<Result<string>>(`${apiEndpoints.transcode.retry}/${jobId}/retry`)
  }

  /**
   * 删除任务及其相关文件
   * DELETE /api/transcode/jobs/{jobId}
   * @param jobId 任务ID
   */
  async deleteJob(jobId: string): Promise<Result<string>> {
    return await http.delete<Result<string>>(`${apiEndpoints.transcode.delete}/${jobId}`)
  }

  /**
   * 批量删除当前用户所有任务
   * DELETE /api/transcode/jobs/delete-all
   */
  async deleteAllJobs(): Promise<Result<string>> {
    return await http.delete<Result<string>>(apiEndpoints.transcode.deleteAll)
  }

  /**
   * 获取任务统计信息
   * GET /api/transcode/jobs/statistics
   */
  async getStatistics(): Promise<Result<TranscodeStatistics>> {
    return await http.get<Result<TranscodeStatistics>>(apiEndpoints.transcode.statistics)
  }
}

export const transcodeJobService = new TranscodeJobService()
export default transcodeJobService
