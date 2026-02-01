/**
 * DDNS API 服务
 * 提供DDNS配置和任务管理的网络请求功能
 */

import { http } from '../client'
import { apiEndpoints } from '../config'
import type { DnsProvider, AccessSecret, PageResponse, DDNSTask } from '@/types'

/**
 * DDNS 配置服务类
 */
class DDNSConfigService {
  /**
   * 获取DNS服务商列表
   * GET /api/ddns/config/dnsProviders
   */
  async getDnsProviders(): Promise<DnsProvider[]> {
    return await http.get<DnsProvider[]>(apiEndpoints.ddns.config.dnsProviders)
  }

  /**
   * 获取访问密钥列表
   * GET /api/ddns/config/accessKeys
   * @param currentPage 当前页
   * @param pageSize 每页数量
   */
  async getAccessKeys(
    currentPage: number = 1,
    pageSize: number = 10
  ): Promise<PageResponse<AccessSecret>> {
    return await http.get<PageResponse<AccessSecret>>(
      apiEndpoints.ddns.config.accessKeys,
      { currentPage, pageSize }
    )
  }

  /**
   * 添加访问密钥
   * POST /api/ddns/config/addAccessKey
   * @param accessSecret 访问密钥信息
   */
  async addAccessKey(accessSecret: AccessSecret): Promise<string> {
    return await http.post<string>(apiEndpoints.ddns.config.addAccessKey, accessSecret)
  }

  /**
   * 删除访问密钥
   * DELETE /api/ddns/config/delAccessKey
   * @param id 密钥ID
   */
  async deleteAccessKey(id: string): Promise<string> {
    return await http.delete<string>(apiEndpoints.ddns.config.delAccessKey, { id })
  }

  /**
   * 更新访问密钥
   * PUT /api/ddns/config/updateAccessKey
   * @param accessSecret 访问密钥信息
   */
  async updateAccessKey(accessSecret: AccessSecret): Promise<string> {
    return await http.put<string>(apiEndpoints.ddns.config.updateAccessKey, accessSecret)
  }
}

/**
 * DDNS 任务服务类
 */
class DDNSTaskService {
  /**
   * 获取任务列表
   * GET /api/ddns/tasks/list
   * @param page 页码
   * @param size 每页数量
   * @param keyword 搜索关键字
   */
  async getTaskList(
    page: number = 1,
    size: number = 10,
    keyword?: string
  ): Promise<PageResponse<DDNSTask>> {
    return await http.get<PageResponse<DDNSTask>>(
      apiEndpoints.ddns.task.list,
      { page, size, keyword }
    )
  }

  /**
   * 创建任务
   * POST /api/ddns/tasks/create
   * @param task 任务信息
   */
  async createTask(task: DDNSTask): Promise<string> {
    return await http.post<string>(apiEndpoints.ddns.task.create, task)
  }

  /**
   * 删除任务
   * DELETE /api/ddns/tasks/delete
   * @param id 任务ID
   */
  async deleteTask(id: number): Promise<string> {
    return await http.delete<string>(apiEndpoints.ddns.task.delete, { id })
  }

  /**
   * 启用任务
   * PUT /api/ddns/tasks/enable
   * @param id 任务ID
   */
  async enableTask(id: number): Promise<string> {
    return await http.put<string>(apiEndpoints.ddns.task.enable, null, { params: { id } })
  }

  /**
   * 禁用任务
   * PUT /api/ddns/tasks/disable
   * @param id 任务ID
   */
  async disableTask(id: number): Promise<string> {
    return await http.put<string>(apiEndpoints.ddns.task.disable, null, { params: { id } })
  }

  /**
   * 暂停任务
   * PUT /api/ddns/tasks/pause
   * @param id 任务ID
   */
  async pauseTask(id: number): Promise<string> {
    return await http.put<string>(apiEndpoints.ddns.task.pause, null, { params: { id } })
  }

  /**
   * 恢复任务
   * PUT /api/ddns/tasks/resume
   * @param id 任务ID
   */
  async resumeTask(id: number): Promise<string> {
    return await http.put<string>(apiEndpoints.ddns.task.resume, null, { params: { id } })
  }

  /**
   * 更新任务
   * PUT /api/ddns/tasks/update
   * @param task 任务信息
   */
  async updateTask(task: DDNSTask): Promise<string> {
    return await http.put<string>(apiEndpoints.ddns.task.update, task)
  }

  /**
   * 重启任务
   * PUT /api/ddns/tasks/restart
   * @param id 任务ID
   */
  async restartTask(id: number): Promise<string> {
    return await http.put<string>(apiEndpoints.ddns.task.restart, null, { params: { id } })
  }
}

export const ddnsConfigService = new DDNSConfigService()
export const ddnsTaskService = new DDNSTaskService()
export default ddnsConfigService
