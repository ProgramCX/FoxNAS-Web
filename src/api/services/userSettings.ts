/**
 * 用户设置 API 服务
 * 提供用户个人设置相关的网络请求功能
 * 包括邮箱绑定、第三方 OAuth 账户绑定等
 */

import { http } from '../client'
import { apiEndpoints } from '../config'

/**
 * 邮箱信息响应
 */
export interface EmailInfoResponse {
  email: string | null
  bound: boolean
}

/**
 * 绑定邮箱请求
 */
export interface BindEmailRequest {
  email: string
  code: string
  password: string
}

/**
 * 解绑邮箱请求
 */
export interface UnbindEmailRequest {
  code: string
  password: string
}

/**
 * OAuth 绑定信息
 */
export interface OAuthInfo {
  provider: string
  oauthId: string
}

/**
 * 绑定 OAuth 请求
 */
export interface BindOAuthRequest {
  provider: string
  password: string
  redirectUrl: string
}

/**
 * 解绑 OAuth 请求
 */
export interface UnbindOAuthRequest {
  provider: string
  password: string
}

/**
 * 支持的 OAuth 提供商
 */
export const SUPPORTED_OAUTH_PROVIDERS = [
  { key: 'github', name: 'GitHub', icon: 'LogoGithub', color: '#24292e' },
  { key: 'qq', name: 'QQ', icon: 'Qq', color: '#1aa7ef' },
  { key: 'weixin', name: 'WeChat', icon: 'Weixin', color: '#28c445' },
  { key: 'microsoft', name: 'Microsoft', icon: 'Microsoft', color: '#00a4ef' },
] as const

export type OAuthProvider = typeof SUPPORTED_OAUTH_PROVIDERS[number]['key']

/**
 * 用户设置服务类
 */
class UserSettingsService {
  // ==================== 邮箱相关接口 ====================

  /**
   * 获取当前用户绑定的邮箱
   * GET /api/auth/email
   * @returns 邮箱信息（部分隐藏）
   */
  async getBoundEmail(): Promise<EmailInfoResponse> {
    return await http.get<EmailInfoResponse>(apiEndpoints.userSettings.getEmail)
  }

  /**
   * 绑定邮箱
   * POST /api/auth/email/bind
   * @param data 绑定邮箱请求（包含邮箱、验证码、密码）
   * @returns 绑定结果消息
   */
  async bindEmail(data: BindEmailRequest): Promise<string> {
    return await http.post<string>(apiEndpoints.userSettings.bindEmail, data)
  }

  /**
   * 解绑邮箱
   * POST /api/auth/email/unbind
   * @param data 解绑邮箱请求（包含验证码、密码）
   * @returns 解绑结果消息
   */
  async unbindEmail(data: UnbindEmailRequest): Promise<string> {
    return await http.post<string>(apiEndpoints.userSettings.unbindEmail, data)
  }

  // ==================== OAuth 相关接口 ====================

  /**
   * 获取已绑定的 OAuth 账户信息
   * GET /api/auth/oauth/getBindedOAuthInfo
   * @returns OAuth 绑定信息列表
   */
  async getBindedOAuthInfo(): Promise<OAuthInfo[]> {
    return await http.get<OAuthInfo[]>(apiEndpoints.userSettings.getBindedOAuthInfo)
  }

  /**
   * 绑定 OAuth 账户
   * POST /api/auth/oauth/bindOAuth
   * @param data 绑定 OAuth 请求（包含提供商、密码、回调地址）
   * @returns 302 重定向到 OAuth 授权页面
   */
  async bindOAuth(data: BindOAuthRequest): Promise<void> {
    // 这个接口会返回 302 重定向，需要特殊处理
    const response = await http.post<void>(apiEndpoints.userSettings.bindOAuth, data, {
      maxRedirects: 0, // 禁止自动重定向，手动处理
    })
    return response
  }

  /**
   * 解绑 OAuth 账户
   * POST /api/auth/oauth/unBindOAuth
   * @param data 解绑 OAuth 请求（包含提供商、密码）
   * @returns 解绑结果消息
   */
  async unbindOAuth(data: UnbindOAuthRequest): Promise<string> {
    return await http.post<string>(apiEndpoints.userSettings.unbindOAuth, data)
  }
}

export const userSettingsService = new UserSettingsService()
export default userSettingsService
