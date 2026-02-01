<template>
  <n-layout has-sider class="main-layout">
    <!-- 移动端遮罩层 -->
    <div 
      v-if="mobileMenuOpen" 
      class="mobile-overlay" 
      @click="mobileMenuOpen = false"
    ></div>

    <!-- 侧边栏 -->
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="sidebarCollapsed"
      show-trigger
      @collapse="toggleSidebar"
      @expand="toggleSidebar"
      :native-scrollbar="false"
      class="sidebar"
      :class="{ 'mobile-open': mobileMenuOpen }"
    >
      <!-- Logo区域 -->
      <div class="logo-container">
        <div class="logo">
          <n-icon size="28" color="#18a058">
            <CloudOutline />
          </n-icon>
          <span v-if="!sidebarCollapsed" class="logo-text">FoxNAS</span>
        </div>
      </div>

      <!-- 导航菜单 -->
      <n-menu
        :collapsed="sidebarCollapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuClick"
      />

      <!-- 底部用户信息 -->
      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <n-avatar round size="small" style="background-color: var(--primary-color)">
          {{ username.charAt(0).toUpperCase() }}
        </n-avatar>
        <div class="user-info">
          <span class="username">{{ username }}</span>
          <n-tag size="tiny" type="success">{{ t('auth.loggedIn') }}</n-tag>
        </div>
      </div>
    </n-layout-sider>

    <!-- 主内容区 -->
    <n-layout class="content-layout">
      <!-- 顶部栏 -->
      <n-layout-header bordered class="header">
        <div class="header-left">
          <!-- 移动端汉堡菜单 -->
          <n-button 
            class="mobile-menu-btn hide-on-desktop" 
            quaternary 
            circle
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <template #icon>
              <n-icon size="22"><MenuOutline /></n-icon>
            </template>
          </n-button>
          
          <!-- Logo（移动端显示） -->
          <div class="mobile-logo hide-on-desktop">
            <n-icon size="24" color="#18a058"><CloudOutline /></n-icon>
            <span class="mobile-logo-text">FoxNAS</span>
          </div>
          
          <!-- 面包屑（桌面端显示） -->
          <n-breadcrumb class="hide-on-mobile">
            <n-breadcrumb-item>
              <router-link to="/">{{ t('nav.home') }}</router-link>
            </n-breadcrumb-item>
            <n-breadcrumb-item v-if="currentRoute.meta?.title">
              {{ currentRoute.meta.title }}
            </n-breadcrumb-item>
          </n-breadcrumb>
        </div>
        <div class="header-right">
          <!-- 语言切换 -->
          <n-tooltip>
            <template #trigger>
              <LanguageSwitcher />
            </template>
            {{ t('header.language') }}
          </n-tooltip>

          <!-- 主题切换 -->
          <n-tooltip>
            <template #trigger>
              <n-button quaternary circle @click="toggleTheme">
                <template #icon>
                  <n-icon>
                    <MoonOutline v-if="!isDarkMode" />
                    <SunnyOutline v-else />
                  </n-icon>
                </template>
              </n-button>
            </template>
            {{ isDarkMode ? t('header.switchToLight') : t('header.switchToDark') }}
          </n-tooltip>

          <!-- 刷新按钮 -->
          <n-tooltip>
            <template #trigger>
              <n-button quaternary circle @click="refreshPage">
                <template #icon>
                  <n-icon>
                    <RefreshOutline />
                  </n-icon>
                </template>
              </n-button>
            </template>
            {{ t('header.refreshPage') }}
          </n-tooltip>

          <!-- 用户菜单 -->
          <n-dropdown :options="userMenuOptions" @select="handleUserMenu">
            <n-avatar round size="medium" class="user-avatar" style="background-color: var(--primary-color)">
              {{ username.charAt(0).toUpperCase() }}
            </n-avatar>
          </n-dropdown>
        </div>
      </n-layout-header>

      <!-- 页面内容 -->
      <n-layout-content class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </n-layout-content>

      <!-- 移动端底部导航栏 -->
      <div class="mobile-bottom-nav hide-on-desktop">
        <div 
          v-for="item in mobileNavItems" 
          :key="item.key"
          class="nav-item"
          :class="{ active: activeKey === item.key }"
          @click="handleMobileNav(item.key)"
        >
          <n-icon :size="22">
            <component :is="item.icon" />
          </n-icon>
          <span class="nav-label">{{ item.label }}</span>
        </div>
      </div>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NIcon } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import {
  HomeOutline,
  FolderOutline,
  PeopleOutline,
  SettingsOutline,
  HardwareChipOutline,
  CloudOutline,
  MoonOutline,
  SunnyOutline,
  RefreshOutline,
  LogOutOutline,
  PersonOutline,
  ColorPaletteOutline,
  MenuOutline,
  DocumentTextOutline,
} from '@vicons/ionicons5'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

// 侧边栏状态
const sidebarCollapsed = computed(() => settingsStore.sidebarCollapsed)

// 主题状态
const isDarkMode = computed(() => settingsStore.currentTheme.darkMode)

// 用户名
const username = computed(() => authStore.username || t('common.user'))

// 用户权限
const userPermissions = computed(() => authStore.userPermissions || [])

// 检查用户是否有指定权限（不区分大小写）
function hasPermission(permission: string): boolean {
  const normalizedPermission = permission.toUpperCase()
  return userPermissions.value.some(p => p.toUpperCase() === normalizedPermission)
}

// 当前激活的菜单key
const activeKey = computed(() => {
  const name = route.name as string
  const path = route.path
  if (path.startsWith('/files')) return 'files'
  if (path.startsWith('/users')) return 'users'
  if (path.startsWith('/ddns')) return 'ddns'
  if (path.startsWith('/settings')) return 'settings'
  if (path.startsWith('/logs')) return 'logs'
  return name
})

// 当前路由
const currentRoute = computed(() => route)

/**
 * 渲染菜单图标
 */
function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

/**
 * 菜单选项
 */
const menuOptions = computed(() => [
  {
    label: t('nav.dashboard'),
    key: 'Dashboard',
    icon: renderIcon(HomeOutline),
  },
  {
    label: t('nav.files'),
    key: 'files',
    icon: renderIcon(FolderOutline),
    show: hasPermission('FILE'),
  },
  {
    label: t('nav.users'),
    key: 'users',
    icon: renderIcon(PeopleOutline),
    show: hasPermission('USER'),
  },
  {
    label: t('nav.ddns'),
    key: 'ddns',
    icon: renderIcon(CloudOutline),
    show: hasPermission('DDNS'),
  },
  {
    label: t('nav.logs'),
    key: 'logs',
    icon: renderIcon(DocumentTextOutline),
  },
  {
    label: t('dashboard.systemInfo'),
    key: 'info',
    icon: renderIcon(HardwareChipOutline),
  },
  {
    label: t('nav.settings'),
    key: 'settings',
    icon: renderIcon(SettingsOutline),
  },
].filter(item => item.show !== false))

/**
 * 用户菜单选项
 */
const userMenuOptions = computed(() => [
  {
    label: t('nav.settings'),
    key: 'settings',
    icon: renderIcon(PersonOutline),
  },
  {
    label: t('nav.theme'),
    key: 'theme',
    icon: renderIcon(ColorPaletteOutline),
  },
  {
    type: 'divider',
    key: 'd1',
  },
  {
    label: t('nav.logout'),
    key: 'logout',
    icon: renderIcon(LogOutOutline),
  },
])

/**
 * 切换侧边栏
 */
function toggleSidebar() {
  settingsStore.toggleSidebar()
}

/**
 * 切换主题
 */
function toggleTheme() {
  const themes = settingsStore.getThemes()
  const currentIndex = settingsStore.currentThemeIndex
  const nextIndex = (currentIndex + 1) % themes.length
  settingsStore.setTheme(nextIndex)
}

/**
 * 刷新页面
 */
function refreshPage() {
  window.location.reload()
}

/**
 * 处理菜单点击
 */
function handleMenuClick(key: string) {
  if (key === 'Dashboard') {
    router.push('/')
  } else if (key === 'files') {
    router.push('/files')
  } else if (key === 'users') {
    router.push('/users')
  } else if (key === 'ddns') {
    router.push('/ddns')
  } else if (key === 'logs') {
    router.push('/logs')
  } else if (key === 'info') {
    router.push('/')
  } else if (key === 'settings') {
    router.push('/settings')
  }
}

/**
 * 处理用户菜单选择
 */
function handleUserMenu(key: string) {
  if (key === 'settings') {
    router.push('/settings')
  } else if (key === 'theme') {
    router.push('/settings')
  } else if (key === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}

// ============ 移动端相关 ============
const mobileMenuOpen = ref(false)
const isMobile = ref(window.innerWidth <= 768)

// 移动端底部导航项
const mobileNavItems = computed(() => [
  { key: 'Dashboard', label: t('nav.home'), icon: HomeOutline },
  { key: 'files', label: t('nav.files'), icon: FolderOutline, permission: 'FILE' },
  { key: 'ddns', label: t('nav.ddns'), icon: CloudOutline, permission: 'DDNS' },
  { key: 'settings', label: t('nav.settings'), icon: SettingsOutline },
].filter(item => !item.permission || hasPermission(item.permission)))

function handleMobileNav(key: string) {
  handleMenuClick(key)
  mobileMenuOpen.value = false
}

// 监听窗口大小变化
function handleResize() {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    mobileMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="css">
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: var(--bg-color);
  transition: transform 0.3s ease;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border-color-light);
  background: linear-gradient(135deg, var(--primary-color) 0%, #36ad6a 100%);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.logo-container :deep(.n-icon) {
  color: #fff !important;
}

.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  border-top: 1px solid var(--border-color-light);
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-color);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-base);
}

.content-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.content {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  background-color: var(--bg-color-secondary);
}

/* 移动端遮罩层 */
.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  animation: fadeIn 0.2s ease;
}

/* 移动端 Logo */
.mobile-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
}

/* 移动端底部导航栏 */
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--bg-color);
  border-top: 1px solid var(--border-color-light);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--text-color-tertiary);
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 8px 0;
}

.nav-item.active {
  color: var(--primary-color);
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
}

/* 响应式适配 */
@media screen and (max-width: 768px) {
  .sidebar {
    position: fixed !important;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .mobile-overlay {
    display: block;
  }

  .mobile-bottom-nav {
    display: flex;
  }

  .header {
    padding: 0 12px;
    height: 56px;
  }

  .content {
    padding: 12px;
    padding-bottom: 72px; /* 底部导航栏高度 + 安全区域 */
    height: calc(100vh - 56px);
  }

  .hide-on-mobile {
    display: none !important;
  }

  .hide-on-desktop {
    display: flex !important;
  }
}

@media screen and (min-width: 769px) {
  .hide-on-desktop {
    display: none !important;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
