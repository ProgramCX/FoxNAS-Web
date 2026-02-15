/**
 * Vue Router 路由配置
 * 定义应用的路由结构和导航守卫
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * 路由配置
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false, title: '登录' },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { requiresAuth: false, title: '找回密码' },
  },
  {
    path: '/retrieve-username',
    name: 'RetrieveUsername',
    component: () => import('@/views/RetrieveUsernameView.vue'),
    meta: { requiresAuth: false, title: '找回用户名' },
  },
  // OAuth 相关路由
  {
    path: '/oauth/success',
    name: 'OAuthSuccess',
    component: () => import('@/views/OAuthSuccessView.vue'),
    meta: { requiresAuth: false, title: 'OAuth 登录成功' },
  },
  {
    path: '/oauth/activate',
    name: 'OAuthActivate',
    component: () => import('@/views/OAuthActivateView.vue'),
    meta: { requiresAuth: false, title: '激活账户' },
  },
  {
    path: '/oauth/error',
    name: 'OAuthError',
    component: () => import('@/views/OAuthErrorView.vue'),
    meta: { requiresAuth: false, title: 'OAuth 登录失败' },
  },
  {
    path: '/',
    component: () => import('@/components/Layout/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '概览' },
      },
      {
        path: 'files',
        name: 'Files',
        component: () => import('@/views/FilesView.vue'),
        meta: { title: '文件管理' },
      },
      {
        path: 'files/:path(.*)*',
        name: 'FileBrowser',
        component: () => import('@/views/FileBrowserView.vue'),
        meta: { title: '文件浏览器' },
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('@/views/UserManagementView.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'ddns',
        name: 'DDNS',
        component: () => import('@/views/DDNSView.vue'),
        meta: { title: 'DDNS管理' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: { title: '个人设置' },
      },
      {
        path: 'media/:path(.*)*',
        name: 'MediaPlayer',
        component: () => import('@/views/MediaPlayerView.vue'),
        meta: { title: '媒体播放' },
      },
      {
        path: 'logs',
        name: 'LogManagement',
        component: () => import('@/views/LogManagementView.vue'),
        meta: { title: '日志管理' },
      },
      {
        path: 'monitor',
        name: 'SystemMonitor',
        component: () => import('@/views/SystemMonitorView.vue'),
        meta: { title: '系统监控' },
      },
      {
        path: 'transcode',
        name: 'TranscodeManagement',
        component: () => import('@/views/TranscodeManagementView.vue'),
        meta: { title: '转码管理' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面未找到' },
  },
]

/**
 * 创建路由实例
 */
const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * 导航守卫 - 路由守卫
 */
router.beforeEach(async (to, _from, next) => {
  // 更新页面标题
  document.title = to.meta.title ? `${to.meta.title} - FoxNAS` : 'FoxNAS'

  const authStore = useAuthStore()

  // 初始化认证状态（如果尚未初始化）
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
    // 未登录，跳转到登录页
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && authStore.isLoggedIn) {
    // 已登录，访问登录页，跳转到首页
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
