import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import enInventory from './locales/en.inventory.json'
import enPii from './locales/en.pii.json'
import enTableMgmt from './locales/en.tableMgmt.json'
import zh from './locales/zh.json'
import zhInventory from './locales/zh.inventory.json'
import zhPii from './locales/zh.pii.json'
import zhTableMgmt from './locales/zh.tableMgmt.json'

const STORAGE_KEY = 'dpi-portal-lang'

const storedLang = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: { ...zh, tableMgmt: zhTableMgmt, inventory: zhInventory, pii: zhPii } },
    en: { translation: { ...en, tableMgmt: enTableMgmt, inventory: enInventory, pii: enPii } },
  },
  lng: storedLang ?? 'zh',
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, lng)
    document.documentElement.lang = lng
  }
})

export default i18n
