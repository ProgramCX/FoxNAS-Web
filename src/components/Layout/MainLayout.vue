<template>
  <n-layout has-sider class="main-layout">
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
          <n-tag size="tiny" type="success">已登录</n-tag>
        </div>
      </div>
    </n-layout-sider>

    <!-- 主内容区 -->
    <n-layout class="content-layout">
      <!-- 顶部栏 -->
      <n-layout-header bordered class="header">
        <div class="header-left">
          <n-breadcrumb>
            <n-breadcrumb-item>
              <router-link to="/">首页</router-link>
            </n-breadcrumb-item>
            <n-breadcrumb-item v-if="currentRoute.meta?.title">
              {{ currentRoute.meta.title }}
            </n-breadcrumb-item>
          </n-breadcrumb>
        </div>
        <div class="header-right">
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
            {{ isDarkMode ? '切换到亮色模式' : '切换到暗色模式' }}
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
            刷新页面
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
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NIcon } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
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
} from '@vicons/ionicons5'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

// 侧边栏状态
const sidebarCollapsed = computed(() => settingsStore.sidebarCollapsed)

// 主题状态
const isDarkMode = computed(() => settingsStore.currentTheme.darkMode)

// 用户名
const username = computed(() => authStore.username || '用户')

// 当前激活的菜单key
const activeKey = computed(() => {
  const name = route.name as string
  const path = route.path
  if (path.startsWith('/files')) return 'files'
  if (path.startsWith('/users')) return 'users'
  if (path.startsWith('/ddns')) return 'ddns'
  if (path.startsWith('/settings')) return 'settings'
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
const menuOptions = [
  {
    label: '概览',
    key: 'Dashboard',
    icon: renderIcon(HomeOutline),
  },
  {
    label: '文件管理',
    key: 'files',
    icon: renderIcon(FolderOutline),
  },
  {
    label: '用户管理',
    key: 'users',
    icon: renderIcon(PeopleOutline),
    show: username.value !== 'admin', // 管理员才显示
  },
  {
    label: 'DDNS管理',
    key: 'ddns',
    icon: renderIcon(CloudOutline),
  },
  {
    label: '系统信息',
    key: 'info',
    icon: renderIcon(HardwareChipOutline),
  },
  {
    label: '个人设置',
    key: 'settings',
    icon: renderIcon(SettingsOutline),
  },
]

/**
 * 用户菜单选项
 */
const userMenuOptions = [
  {
    label: '个人设置',
    key: 'settings',
    icon: renderIcon(PersonOutline),
  },
  {
    label: '主题设置',
    key: 'theme',
    icon: renderIcon(ColorPaletteOutline),
  },
  {
    type: 'divider',
    key: 'd1',
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: renderIcon(LogOutOutline),
  },
]

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
</script>

<style scoped lang="css">
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: var(--bg-color);
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border-color-light);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-base);
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
}

.header {
  height: 60px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-color);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  cursor: pointer;
}

.content {
  padding: 24px;
  height: calc(100vh - 60px);
  overflow-y: auto;
  background-color: var(--bg-color-secondary);
}

/* 响应式适配 */
@media screen and (max-width: 768px) {
  .header {
    padding: 0 12px;
  }

  .content {
    padding: 12px;
  }

  .hide-on-mobile {
    display: none !important;
  }
}
</style>
