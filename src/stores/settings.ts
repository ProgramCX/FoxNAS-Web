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
  { name: '薄荷绿', primaryColor: '#18a058', darkMode: false, gradient: 'linear-gradient(135deg, #18a058 0%, #36ad6a 100%)', bgColor: '#f0f9f4' },
  { name: '暗夜绿', primaryColor: '#18a058', darkMode: true, gradient: 'linear-gradient(135deg, #18a058 0%, #36ad6a 100%)', bgColor: '#1a1f25' },
  { name: '海洋蓝', primaryColor: '#2080f0', darkMode: false, gradient: 'linear-gradient(135deg, #2080f0 0%, #4096ff 100%)', bgColor: '#f0f7ff' },
  { name: '暗夜蓝', primaryColor: '#2080f0', darkMode: true, gradient: 'linear-gradient(135deg, #2080f0 0%, #4096ff 100%)', bgColor: '#1a1f25' },
  { name: '紫罗兰', primaryColor: '#9c27b0', darkMode: false, gradient: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)', bgColor: '#f8f0fc' },
  { name: '暗夜紫', primaryColor: '#9c27b0', darkMode: true, gradient: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)', bgColor: '#1a1f25' },
  { name: '日落橙', primaryColor: '#ff9800', darkMode: false, gradient: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)', bgColor: '#fff8f0' },
  { name: '暗夜橙', primaryColor: '#ff9800', darkMode: true, gradient: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)', bgColor: '#1a1f25' },
  { name: '珊瑚红', primaryColor: '#f44336', darkMode: false, gradient: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)', bgColor: '#fff5f5' },
  { name: '暗夜红', primaryColor: '#f44336', darkMode: true, gradient: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)', bgColor: '#1a1f25' },
  { name: '极光青', primaryColor: '#00bcd4', darkMode: false, gradient: 'linear-gradient(135deg, #00bcd4 0%, #26c6da 100%)', bgColor: '#f0fcff' },
  { name: '暗夜青', primaryColor: '#00bcd4', darkMode: true, gradient: 'linear-gradient(135deg, #00bcd4 0%, #26c6da 100%)', bgColor: '#1a1f25' },
  { name: '樱花粉', primaryColor: '#e91e63', darkMode: false, gradient: 'linear-gradient(135deg, #e91e63 0%, #ec407a 100%)', bgColor: '#fce4ec' },
  { name: '暗夜粉', primaryColor: '#e91e63', darkMode: true, gradient: 'linear-gradient(135deg, #e91e63 0%, #ec407a 100%)', bgColor: '#1a1f25' },
  { name: '琥珀金', primaryColor: '#ff8f00', darkMode: false, gradient: 'linear-gradient(135deg, #ff8f00 0%, #ffa726 100%)', bgColor: '#fff8e1' },
  { name: '暗夜金', primaryColor: '#ff8f00', darkMode: true, gradient: 'linear-gradient(135deg, #ff8f00 0%, #ffa726 100%)', bgColor: '#1a1f25' },
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
  const currentTheme = ref<ThemeConfig>(AVAILABLE_THEMES[currentThemeIndex.value] || AVAILABLE_THEMES[0])

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
