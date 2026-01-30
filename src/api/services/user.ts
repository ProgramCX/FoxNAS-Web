/**
 * 用户管理 API 服务
 * 提供用户管理和权限相关的网络请求功能
 */

import { http } from '../client'
import { apiEndpoints } from '../config'
import type { User, UserPermission, UserResource, PageResponse } from '@/types'

/**
 * 用户管理服务类
 */
class UserService {
  /**
   * 获取用户列表
   * GET /api/user/list
   * @param keyword 搜索关键词
   * @param page 页码
   * @param size 每页数量
   */
  async getUserList(
    keyword?: string,
    page: number = 1,
    size: number = 30
  ): Promise<PageResponse<User>> {
    return await http.get<PageResponse<User>>(apiEndpoints.user.list, {
      keyword,
      page,
      size,
    })
  }

  /**
   * 添加用户
   * POST /api/user/addUser
   * @param user 用户信息
   * @param permissions 权限列表
   * @param resources 资源列表
   */
  async addUser(
    user: User,
    permissions?: UserPermission[],
    resources?: UserResource[]
  ): Promise<void> {
    await http.post(apiEndpoints.user.add, {
      userName: user.userName,
      password: user.password,
      permissions,
      resources,
    })
  }

  /**
   * 删除用户
   * DELETE /api/user/delUser
   * @param userName 用户名
   */
  async deleteUser(userName: string): Promise<void> {
    await http.delete(apiEndpoints.user.delete, { userName })
  }

  /**
   * 封禁用户
   * PUT /api/user/blockUser
   * @param userName 用户名
   */
  async blockUser(userName: string): Promise<void> {
    await http.put(apiEndpoints.user.block, null, { params: { userName } })
  }

  /**
   * 解封用户
   * PUT /api/user/unblockUser
   * @param userName 用户名
   */
  async unblockUser(userName: string): Promise<void> {
    await http.put(apiEndpoints.user.unblock, null, { params: { userName } })
  }

  /**
   * 修改用户密码
   * PUT /api/user/changePassword
   * @param userName 用户名
   * @param password 新密码
   */
  async changePassword(userName: string, password: string): Promise<void> {
    await http.put(apiEndpoints.user.changePassword, { userName, password })
  }

  /**
   * 获取用户权限列表
   * GET /api/user/permissions
   * @param userName 用户名
   */
  async getUserPermissions(userName: string): Promise<UserPermission[]> {
    return await http.get<UserPermission[]>(apiEndpoints.user.permissions, { userName })
  }

  /**
   * 授予用户权限
   * PUT /api/user/grantPermission
   * @param userName 用户名
   * @param areaName 权限区域名称
   */
  async grantPermission(userName: string, areaName: string): Promise<void> {
    await http.put(apiEndpoints.user.grantPermission, null, {
      params: { userName, areaName },
    })
  }

  /**
   * 撤销用户权限
   * PUT /api/user/revokePermission
   * @param userName 用户名
   * @param areaName 权限区域名称
   */
  async revokePermission(userName: string, areaName: string): Promise<void> {
    await http.put(apiEndpoints.user.revokePermission, null, {
      params: { userName, areaName },
    })
  }

  /**
   * 获取所有权限
   * GET /api/user/allPermissions
   */
  async getAllPermissions(): Promise<string[]> {
    return await http.get<string[]>(apiEndpoints.user.allPermissions)
  }

  /**
   * 更新用户信息
   * PUT /api/user/updateUser
   * @param user 用户信息
   * @param originalName 原始用户名
   */
  async updateUser(user: User, originalName: string): Promise<void> {
    await http.put(apiEndpoints.user.update, user, { params: { originalName } })
  }

  /**
   * 授予用户资源
   * PUT /api/user/grantResource
   * @param userName 用户名
   * @param resourcePath 资源路径
   * @param type 权限类型
   */
  async grantResource(userName: string, resourcePath: string, type: string): Promise<void> {
    await http.put(apiEndpoints.user.grantResource, null, {
      params: { userName, resourcePath, type },
    })
  }

  /**
   * 撤销用户资源
   * PUT /api/user/revokeResource
   * @param userName 用户名
   * @param resourcePath 资源路径
   * @param type 权限类型
   */
  async revokeResource(userName: string, resourcePath: string, type: string): Promise<void> {
    await http.put(apiEndpoints.user.revokeResource, null, {
      params: { userName, resourcePath, type },
    })
  }

  /**
   * 修改用户资源
   * PUT /api/user/modifyResource
   */
  async modifyResource(
    userName: string,
    oldResourcePath: string,
    newResourcePath: string,
    newTypeList: string[]
  ): Promise<void> {
    await http.put(apiEndpoints.user.modifyResource, newTypeList, {
      params: { userName, oldResourcePath, newResourcePath },
    })
  }

  /**
   * 获取用户所有资源
   * GET /api/user/allResources
   * @param userName 用户名
   */
  async getUserResources(userName: string): Promise<UserResource[]> {
    return await http.get<UserResource[]>(apiEndpoints.user.allResources, { userName })
  }

  /**
   * 创建用户资源
   * POST /api/user/createResource
   */
  async createResource(
    userName: string,
    resourcePath: string,
    typeList: string[]
  ): Promise<void> {
    await http.post(apiEndpoints.user.createResource, typeList, {
      params: { userName, resourcePath },
    })
  }

  /**
   * 删除用户资源
   * DELETE /api/user/deleteResource
   */
  async deleteResource(userName: string, resourcePath: string): Promise<void> {
    await http.delete(apiEndpoints.user.deleteResource, { userName, resourcePath })
  }

  /**
   * 获取目录列表
   * GET /api/user/dirs
   * @param path 路径
   */
  async getDirs(path: string): Promise<Array<{ name: string; path: string }>> {
    return await http.get<Array<{ name: string; path: string }>>(apiEndpoints.user.dirs, { path })
  }
}

/**
 * 用户自我设置服务类
 */
class UserSelfService {
  /**
   * 修改密码
   * PUT /api/user-self/changePassword
   * @param oldPassword 旧密码
   * @param newPassword 新密码
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await http.put(apiEndpoints.userSelf.changePassword, null, {
      params: { oldPassword, newPassword },
    })
  }

  /**
   * 修改用户名
   * PUT /api/user-self/changeUserName
   * @param newUserName 新用户名
   */
  async changeUserName(newUserName: string): Promise<void> {
    await http.put(apiEndpoints.userSelf.changeUserName, null, {
      params: { newUserName },
    })
  }
}

export const userService = new UserService()
export const userSelfService = new UserSelfService()
export default userService
