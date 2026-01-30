/**
 * 硬件信息 API 服务
 * 提供获取系统硬件信息的网络请求功能
 */

import { http } from '../client'
import { apiEndpoints } from '../config'
import type { HardwareInfoDTO } from '@/types'

/**
 * 硬件信息服务类
 */
class HardwareService {
  /**
   * 获取硬件信息
   * GET /api/hardware/info
   */
  async getHardwareInfo(): Promise<HardwareInfoDTO> {
    return await http.get<HardwareInfoDTO>(apiEndpoints.hardware.info)
  }
}

export const hardwareService = new HardwareService()
export default hardwareService
