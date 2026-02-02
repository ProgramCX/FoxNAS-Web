<template>
  <n-dropdown
    :options="languageOptions"
    trigger="click"
    @select="handleLanguageChange"
  >
    <n-button quaternary circle>
      <template #icon>
        <n-icon>
          <LanguageOutline />
        </n-icon>
      </template>
    </n-button>
  </n-dropdown>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { LanguageOutline } from '@vicons/ionicons5'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

const { locale } = useI18n()

// 语言选项
const languageOptions = computed(() => {
  return SUPPORTED_LANGUAGES.map((lang) => ({
    key: lang.code,
    label: lang.nativeName,
    icon: () => h('span', { style: { marginRight: '8px' } }, getLanguageFlag(lang.code)),
    disabled: locale.value === lang.code,
  }))
})

// 获取语言对应的 emoji 旗帜
function getLanguageFlag(code: string): string {
  const flags: Record<string, string> = {
    'zh-CN': '🇨🇳',
    'zh-TW': '🇭🇰',
    'en': '🇺🇸',
    'fr': '🇫🇷',
    'de': '🇩🇪',
    'ja': '🇯🇵',
    'ar': '🇸🇦',
    'pt': '🇧🇷',
    'ru': '🇷🇺',
  }
  return flags[code] || '🌐'
}

// 处理语言切换
function handleLanguageChange(key: string) {
  const selectedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === key)
  if (selectedLang) {
    locale.value = key as SupportedLanguage
    localStorage.setItem('foxnas_language', key)
    
    // 设置文档方向（RTL 支持）
    document.documentElement.dir = selectedLang.dir
    document.documentElement.lang = key
  }
}
</script>

<style scoped>
.language-btn {
  font-size: 16px;
}
</style>
