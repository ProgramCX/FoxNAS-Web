/**
 * 应用入口文件
 * 初始化Vue应用、Pinia状态管理和路由
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import App from './App.vue'
import router from './router'
import { useSettingsStore } from './stores/settings'

// 导入全局样式
import './styles/main.css'

/**
 * 创建并挂载Vue应用
 */
async function bootstrap() {
  const app = createApp(App)

  // 初始化 Pinia
  const pinia = createPinia()
  app.use(pinia)

  // 初始化主题设置
  const settingsStore = useSettingsStore()
  settingsStore.initTheme()

  // 使用路由
  app.use(router)

  // 使用 Naive UI
  app.use(naive)

  // 挂载应用
  app.mount('#app')
}

bootstrap()
