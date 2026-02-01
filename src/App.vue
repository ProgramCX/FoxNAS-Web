<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides" :locale="naiveLocale" :date-locale="naiveDateLocale">
    <ProgressBar ref="progressBarRef" />
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
import { computed, watch, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { darkTheme } from 'naive-ui'
import {
  zhCN, zhTW, enUS, frFR, deDE, jaJP, arDZ, ptBR, ruRU,
  dateZhCN, dateZhTW, dateEnUS, dateFrFR, dateDeDE, dateJaJP, dateArDZ, datePtBR, dateRuRU,
} from 'naive-ui'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import { useGlobalShortcuts, useEnterKeyBlur } from '@/composables/useKeyboard'
import { useAriaLive } from '@/composables/useFocus'
import { useRouterProgress } from '@/composables/useRouterProgress'
import ProgressBar from '@/components/ProgressBar.vue'

const { locale } = useI18n()
const router = useRouter()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

const progressBarRef = ref<InstanceType<typeof ProgressBar> | null>(null)

useGlobalShortcuts()
useEnterKeyBlur()
const { announce } = useAriaLive()

useRouterProgress(router, ref({
  start: () => progressBarRef.value?.start(),
  setProgress: (v: number) => progressBarRef.value?.setProgress(v),
  finish: () => progressBarRef.value?.finish(),
}))

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

// 监听登录状态变化，播报通知
watch(() => authStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    announce('已登录，欢迎回来 ' + authStore.username)
  }
})

// 初始化认证状态
onMounted(() => {
  authStore.initialize()
})
</script>

<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus,
.sr-only-focusable:active {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary-color);
  color: white;
  padding: 8px 16px;
  z-index: 10000;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 0;
}

:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}
</style>
