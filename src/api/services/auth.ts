/**
 * 认证 API 服务
 * 提供用户认证相关的网络请求功能
 */

import { http } from '../client'
import { apiEndpoints } from '../config'
import type { LoginRequest, RegisterRequest } from '@/types'

interface ResetPasswordRequest {
  emailAddr: string
  code: string
  newPassword: string
}

interface RetrieveUsernameRequest {
  emailAddr: string
  code: string
}

interface OAuthActivateRequest {
  email: string
  code: string
  password: string
  ticket: string
}

/**
 * OAuth 激活响应
 */
interface OAuthActivateResponse {
  message: string
  accessToken: string
  refreshToken: string
  username: string,
  uuid: string
}

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
   * 重置密码
   * POST /api/auth/password/reset
   * @param data 重置密码信息
   * @returns 重置结果
   */
  async resetPassword(data: ResetPasswordRequest): Promise<string> {
    return await http.post<string>(apiEndpoints.auth.resetPassword, data)
  }

  /**
   * 找回用户名
   * POST /api/auth/username/retrieve
   * @param data 找回用户名信息
   * @returns 找回结果
   */
  async retrieveUsername(data: RetrieveUsernameRequest): Promise<string> {
    return await http.post<string>(apiEndpoints.auth.retrieveUsername, data)
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

  /**
   * 发送 OAuth 激活验证码
   * POST /api/auth/oauth/sendActivateCode
   * @param email 邮箱地址
   * @returns 发送结果消息
   */
  async sendOAuthActivateCode(email: string): Promise<string> {
    return await http.post<string>(apiEndpoints.oauth.sendActivateCode, { email })
  }

  /**
   * 激活 OAuth 账户
   * POST /api/auth/oauth/activate
   * @param data 激活信息
   * @returns 激活结果，包含 token 和用户名
   */
  async activateOAuthAccount(data: OAuthActivateRequest): Promise<OAuthActivateResponse> {
    return await http.post<OAuthActivateResponse>(apiEndpoints.oauth.activate, data)
  }
}

export const authService = new AuthService()
export default authService
