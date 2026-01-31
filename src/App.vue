<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides" :locale="naiveLocale" :date-locale="naiveDateLocale">
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
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { darkTheme } from 'naive-ui'
import {
  zhCN, zhTW, enUS, frFR, deDE, jaJP, arDZ, ptBR, ruRU,
  dateZhCN, dateZhTW, dateEnUS, dateFrFR, dateDeDE, dateJaJP, dateArDZ, datePtBR, dateRuRU,
} from 'naive-ui'
import { useSettingsStore } from '@/stores/settings'
import { SUPPORTED_LANGUAGES } from '@/i18n'

const { locale } = useI18n()
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

// Naive UI 语言映射
const naiveLocaleMap: Record<string, any> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en': enUS,
  'fr': frFR,
  'de': deDE,
  'ja': jaJP,
  'ar': arDZ,
  'pt': ptBR,
  'ru': ruRU,
}

const naiveDateLocaleMap: Record<string, any> = {
  'zh-CN': dateZhCN,
  'zh-TW': dateZhTW,
  'en': dateEnUS,
  'fr': dateFrFR,
  'de': dateDeDE,
  'ja': dateJaJP,
  'ar': dateArDZ,
  'pt': datePtBR,
  'ru': dateRuRU,
}

// Naive UI 语言
const naiveLocale = computed(() => naiveLocaleMap[locale.value] || zhCN)
const naiveDateLocale = computed(() => naiveDateLocaleMap[locale.value] || dateZhCN)

// 监听语言变化，更新文档属性
watch(locale, (newLocale) => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === newLocale)
  if (lang) {
    document.documentElement.dir = lang.dir
    document.documentElement.lang = newLocale
  }
}, { immediate: true })
</script>
