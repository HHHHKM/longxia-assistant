// ── 语言包 ──
const locales = {
  'zh-CN': () => import('./zh-CN.js'),
  'en':    () => import('./en.js'),
  'ja':    () => import('./ja.js'),
  'ko':    () => import('./ko.js'),
  'es':    () => import('./es.js'),
  'pt':    () => import('./pt.js'),
}

let _lang = localStorage.getItem('longxia_lang') || 'zh-CN'
let _messages = {}

export async function initI18n() {
  const mod = await (locales[_lang] || locales['zh-CN'])()
  _messages = mod.default
}

export function t(key) {
  return _messages[key] || key
}

export function getLang() { return _lang }

export function setLang(lang) {
  _lang = lang
  localStorage.setItem('longxia_lang', lang)
  window.location.reload()
}

export const SUPPORTED_LANGS = [
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'en',    label: 'English',  flag: '🇺🇸' },
  { code: 'ja',    label: '日本語',   flag: '🇯🇵' },
  { code: 'ko',    label: '한국어',   flag: '🇰🇷' },
  { code: 'es',    label: 'Español',   flag: '🇪🇸' },
  { code: 'pt',    label: 'Português', flag: '🇧🇷' },
]
