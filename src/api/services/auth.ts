/**
 * 认证 API 服务
 * 提供用户认证相关的网络请求功能
 */

import { http } from '../client'
import { apiEndpoints } from '../config'
import type { LoginRequest, RegisterRequest } from '@/types'

/**
 * 认证服务类
 */
class AuthService {
  /**
   * 用户登录
   * POST /api/auth/login
   * @param credentials 登录凭证
   * @returns JWT Token
   */
  async login(credentials: LoginRequest): Promise<string> {
    return await http.post<string>(apiEndpoints.auth.login, credentials)
  }

  /**
   * 用户注册
   * POST /api/auth/reg
   * @param data 注册信息
   * @returns 注册结果
   */
  async register(data: RegisterRequest): Promise<string> {
    return await http.post<string>(apiEndpoints.auth.register, data)
  }

  /**
   * 发送验证码
   * POST /api/auth/sendVerifyCode
   * @param email 邮箱地址
   * @returns 发送结果消息
   */
  async sendVerifyCode(email: string): Promise<string> {
    return await http.post<string>(apiEndpoints.auth.sendVerifyCode, { emailAddr: email })
  }

  /**
   * 初始化管理员账户
   * POST /api/auth/iniAdmin
   * @returns 初始密码
   */
  async initAdmin(): Promise<string> {
    return await http.post<string>(apiEndpoints.auth.iniAdmin)
  }

  /**
   * 检查服务器状态
   * GET /api/status/status
   * @returns 服务器状态
   */
  async checkStatus(): Promise<string> {
    return await http.get<string>(apiEndpoints.status.check)
  }
}

export const authService = new AuthService()
export default authService
