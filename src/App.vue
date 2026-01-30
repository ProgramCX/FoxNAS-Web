<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <n-loading-bar-provider>
            <router-view />
          </n-loading-bar-provider>
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { darkTheme } from 'naive-ui'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

// 计算当前主题
const theme = computed(() => {
  return settingsStore.currentTheme.darkMode ? darkTheme : null
})

// 主题覆盖配置
const themeOverrides = computed(() => ({
  common: {
    primaryColor: settingsStore.currentTheme.primaryColor,
    primaryColorHover: settingsStore.currentTheme.primaryColor,
    primaryColorPressed: settingsStore.currentTheme.primaryColor,
    primaryColorSuppl: settingsStore.currentTheme.primaryColor,
  },
}))
</script>
