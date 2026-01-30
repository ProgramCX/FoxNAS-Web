/**
 * 设置状态管理
 * 处理主题、布局和其他用户偏好设置
 */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ThemeConfig } from '@/types'

/**
 * 可用主题列表
 */
const AVAILABLE_THEMES: ThemeConfig[] = [
  { name: '默认蓝', primaryColor: '#18a058', darkMode: false },
  { name: '暗色蓝', primaryColor: '#18a058', darkMode: true },
  { name: '紫色', primaryColor: '#9c27b0', darkMode: false },
  { name: '暗色紫', primaryColor: '#9c27b0', darkMode: true },
  { name: '橙色', primaryColor: '#ff9800', darkMode: false },
  { name: '暗色橙', primaryColor: '#ff9800', darkMode: true },
  { name: '红色', primaryColor: '#f44336', darkMode: false },
  { name: '暗色红', primaryColor: '#f44336', darkMode: true },
]

/**
 * 主题设置 Store
 */
export const useSettingsStore = defineStore('settings', () => {
  // State
  const currentThemeIndex = ref<number>(Number(localStorage.getItem('foxnas_theme_index')) || 0)
  const sidebarCollapsed = ref<boolean>(JSON.parse(localStorage.getItem('foxnas_sidebar_collapsed') || 'false'))
  const compactMode = ref<boolean>(JSON.parse(localStorage.getItem('foxnas_compact_mode') || 'false'))

  // Getters
  const currentTheme = ref<ThemeConfig>(AVAILABLE_THEMES[currentThemeIndex.value])

  // Watch theme changes
  watch(currentThemeIndex, (newIndex) => {
    const theme = AVAILABLE_THEMES[newIndex]
    if (theme) {
      currentTheme.value = theme
      localStorage.setItem('foxnas_theme_index', String(newIndex))
      applyTheme(theme)
    }
  })

  // Watch sidebar changes
  watch(sidebarCollapsed, (value) => {
    localStorage.setItem('foxnas_sidebar_collapsed', String(value))
  })

  // Watch compact mode changes
  watch(compactMode, (value) => {
    localStorage.setItem('foxnas_compact_mode', String(value))
  })

  // Actions

  /**
   * 应用主题
   */
  function applyTheme(theme: ThemeConfig): void {
    const root = document.documentElement
    
    // 设置主色调
    root.style.setProperty('--primary-color', theme.primaryColor)
    
    // 设置暗色模式
    if (theme.darkMode) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }

  /**
   * 设置主题
   */
  function setTheme(index: number): void {
    if (index >= 0 && index < AVAILABLE_THEMES.length) {
      currentThemeIndex.value = index
    }
  }

  /**
   * 切换侧边栏折叠状态
   */
  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  /**
   * 设置侧边栏折叠状态
   */
  function setSidebarCollapsed(collapsed: boolean): void {
    sidebarCollapsed.value = collapsed
  }

  /**
   * 切换紧凑模式
   */
  function toggleCompactMode(): void {
    compactMode.value = !compactMode.value
  }

  /**
   * 获取所有可用主题
   */
  function getThemes(): ThemeConfig[] {
    return AVAILABLE_THEMES
  }

  /**
   * 初始化主题
   */
  function initTheme(): void {
    applyTheme(currentTheme.value)
  }

  return {
    // State
    currentThemeIndex,
    sidebarCollapsed,
    compactMode,
    currentTheme,
    // Getters
    // Actions
    setTheme,
    toggleSidebar,
    setSidebarCollapsed,
    toggleCompactMode,
    getThemes,
    initTheme,
    applyTheme,
  }
})

export default useSettingsStore
