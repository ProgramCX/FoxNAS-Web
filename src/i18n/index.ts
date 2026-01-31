/**
 * i18n 国际化配置
 * 支持的语言：简体中文、繁体中文、英语、法语、德语、日语、阿拉伯语、葡萄牙语、俄语
 */

import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import zhTW from './locales/zh-TW'
import en from './locales/en'
import fr from './locales/fr'
import de from './locales/de'
import ja from './locales/ja'
import ar from './locales/ar'
import pt from './locales/pt'
import ru from './locales/ru'

/**
 * 支持的语言列表
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文', dir: 'ltr' },
  { code: 'zh-TW', name: '繁體中文', nativeName: '繁體中文', dir: 'ltr' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'fr', name: 'Français', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'ja', name: '日本語', nativeName: '日本語', dir: 'ltr' },
  { code: 'ar', name: 'العربية', nativeName: 'العربية', dir: 'rtl' },
  { code: 'pt', name: 'Português', nativeName: 'Português', dir: 'ltr' },
  { code: 'ru', name: 'Русский', nativeName: 'Русский', dir: 'ltr' },
] as const

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code']

/**
 * 获取浏览器语言
 */
function getBrowserLanguage(): SupportedLanguage {
  const browserLang = navigator.language
  // 精确匹配
  const exactMatch = SUPPORTED_LANGUAGES.find(lang => lang.code === browserLang)
  if (exactMatch) return exactMatch.code
  // 前缀匹配 (如 zh 匹配 zh-CN)
  const prefix = browserLang.split('-')[0]
  if (prefix) {
    const prefixMatch = SUPPORTED_LANGUAGES.find(lang => lang.code.startsWith(prefix))
    if (prefixMatch) return prefixMatch.code
  }
  // 默认中文
  return 'zh-CN'
}

/**
 * 获取已保存的语言设置
 */
function getSavedLanguage(): SupportedLanguage | null {
  const saved = localStorage.getItem('foxnas_language')
  if (saved && SUPPORTED_LANGUAGES.some(lang => lang.code === saved)) {
    return saved as SupportedLanguage
  }
  return null
}

/**
 * 获取初始语言
 */
function getInitialLanguage(): SupportedLanguage {
  return getSavedLanguage() || getBrowserLanguage()
}

/**
 * 创建 i18n 实例
 */
const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: getInitialLanguage(),
  fallbackLocale: 'en',
  messages: {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    en,
    fr,
    de,
    ja,
    ar,
    pt,
    ru,
  },
})

export default i18n
