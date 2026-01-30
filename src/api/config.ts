/**
 * API 配置
 * 包含后端服务器地址和默认配置
 */

// 后端服务器地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8848'
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api'

/**
 * API 基础配置
 */
export const apiConfig = {
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: 30000,
  // Token 存储的 key
  tokenKey: 'foxnas_token',
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
    sendVerifyCode: '/auth/sendVerifyCode',
    register: '/auth/reg',
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
}

export default apiConfig
