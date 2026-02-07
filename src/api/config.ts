/**
 * API 配置
 * 包含后端服务器地址和默认配置
 */

// 后端服务器地址
// 开发环境: http://localhost:8848
// 生产环境: 空字符串（使用相对路径）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api'

/**
 * API 基础配置
 */
export const apiConfig = {
  baseURL: API_BASE_URL ? `${API_BASE_URL}${API_PREFIX}` : API_PREFIX,
  // 后端服务器根地址（用于 OAuth 等需要完整 URL 的场景）
  serverBaseURL: API_BASE_URL || '',
  timeout: 30000,
  // Access Token 存储的 key
  tokenKey: 'foxnas_token',
  // Refresh Token 存储的 key
  refreshTokenKey: 'foxnas_refresh_token',
  // 认证信息存储的 key
  authKey: 'foxnas_auth',
}

/**
 * API 端点路径
 */
export const apiEndpoints = {
  // 认证相关
  auth: {
    login: '/auth/login',
    iniAdmin: '/auth/iniAdmin',
    initRequired: '/auth/initRequired',
    sendVerifyCode: '/auth/sendVerifyCode',
    register: '/auth/reg',
    refresh: '/auth/refresh',
    resetPassword: '/auth/password/reset',
    retrieveUsername: '/auth/username/retrieve',
    loginByEmailPassword: '/auth/login/email',
    loginByEmailCode: '/auth/login/email/code',
  },
  // OAuth 相关
  oauth: {
    activate: '/auth/oauth/activate',
    sendActivateCode: '/auth/oauth/sendActivateCode',
    // OAuth 授权入口（需要使用完整 URL）
    github: '/api/oauth2/authorization/github',
  },
  // 文件信息
  file: {
    info: {
      list: '/file/info/getList',
      dirList: '/file/info/dir-list',
    },
    operation: {
      delete: '/file/op/delete',
      get: '/file/op/get',
      move: '/file/op/move',
      copy: '/file/op/copy',
      rename: '/file/op/rename',
      upload: '/file/op/upload',
      createDir: '/file/op/createDir',
    },
    permission: {
      authedDirs: '/filePermission/getAuthedDirs',
    },
    media: {
      validate: '/file/media/validate',
      metadata: '/file/media/metadata',
      videoStream: '/file/media/video-stream',
      mediaType: '/file/media/media-type',
      prolongToken: '/file/media/prolong-token',
    },
  },
  // 硬件信息
  hardware: {
    info: '/hardware/info',
  },
  // 状态
  status: {
    check: '/status/status',
  },
  // 用户管理
  user: {
    list: '/user/list',
    add: '/user/addUser',
    delete: '/user/delUser',
    block: '/user/blockUser',
    unblock: '/user/unblockUser',
    changePassword: '/user/changePassword',
    permissions: '/user/permissions',
    grantPermission: '/user/grantPermission',
    revokePermission: '/user/revokePermission',
    allPermissions: '/user/allPermissions',
    update: '/user/updateUser',
    grantResource: '/user/grantResource',
    revokeResource: '/user/revokeResource',
    modifyResource: '/user/modifyResource',
    allResources: '/user/allResources',
    createResource: '/user/createResource',
    deleteResource: '/user/deleteResource',
    dirs: '/user/dirs',
  },
  // 用户自我配置
  userSelf: {
    changePassword: '/user-self/changePassword',
    changeUserName: '/user-self/changeUserName',
  },
  // 用户设置（邮箱绑定、OAuth 绑定）
  userSettings: {
    // 邮箱相关
    getEmail: '/auth/email',
    bindEmail: '/auth/email/bind',
    unbindEmail: '/auth/email/unbind',
    // OAuth 相关
    getBindedOAuthInfo: '/auth/oauth/getBindedOAuthInfo',
    bindOAuth: '/auth/oauth/bindOAuth',
    unbindOAuth: '/auth/oauth/unBindOAuth',
  },
  // DDNS 配置
  ddns: {
    config: {
      dnsProviders: '/ddns/config/dnsProviders',
      accessKeys: '/ddns/config/accessKeys',
      addAccessKey: '/ddns/config/addAccessKey',
      delAccessKey: '/ddns/config/delAccessKey',
      updateAccessKey: '/ddns/config/updateAccessKey',
    },
    task: {
      list: '/ddns/tasks/list',
      create: '/ddns/tasks/create',
      delete: '/ddns/tasks/delete',
      enable: '/ddns/tasks/enable',
      disable: '/ddns/tasks/disable',
      pause: '/ddns/tasks/pause',
      resume: '/ddns/tasks/resume',
      update: '/ddns/tasks/update',
      restart: '/ddns/tasks/restart',
      status: '/ddns/tasks/status',
    },
  },
  // 公共接口
  common: {
    permissions: '/common/permissionsByUuid',
    userInfo: '/common/userInfo',
  },
  // 日志管理
  log: {
    list: '/log/error',
    detail: '/log/error',
    deleteBefore: '/log/error/before',
  },
  // 系统监控
  monitor: {
    byTimeRange: '/monitor/getByMillRange',
    byLastTime: '/monitor/getRecentStatistics',
  },
}

export default apiConfig
