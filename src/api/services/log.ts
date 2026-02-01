/**
 * 日志管理 API 服务
 * 提供错误日志查询和管理相关的网络请求功能
 */

import { http } from '../client'
import { apiEndpoints } from '../config'
import type { ErrorLog, LogQueryParams, PageResponse } from '@/types'

/**
 * 日志管理服务类
 */
class LogService {
  /**
   * 获取错误日志列表
   * GET /api/log/error
   * @param params 查询参数
   */
  async getErrorLogs(params: LogQueryParams): Promise<PageResponse<ErrorLog>> {
    return await http.get<PageResponse<ErrorLog>>(apiEndpoints.log.list, {
      page: params.page ?? 0,
      size: params.size ?? 20,
      moduleName: params.moduleName,
      userName: params.userName,
      exceptionType: params.exceptionType,
      startTime: params.startTime,
      endTime: params.endTime,
    })
  }

  /**
   * 获取错误日志详情
   * GET /api/log/error/{id}
   * @param id 日志 ID
   */
  async getErrorLogDetail(id: string): Promise<ErrorLog> {
    return await http.get<ErrorLog>(`${apiEndpoints.log.detail}/${id}`)
  }

  /**
   * 删除指定时间之前的日志
   * DELETE /api/log/error/before
   * @param beforeTime 时间阈值 (ISO 格式)
   */
  async deleteLogsBefore(beforeTime: string): Promise<string> {
    return await http.delete<string>(apiEndpoints.log.deleteBefore, {
      beforeTime,
    })
  }
}

export const logService = new LogService()
export default logService
