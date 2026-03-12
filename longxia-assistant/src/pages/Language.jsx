import React from 'react'
import { SUPPORTED_LANGS, getLang, setLang, t } from '../i18n/index.js'

export default function Language() {
  const current = getLang()
  return (
    <div className="lang-page">
      <h1 className="page-title">{t('lang.title')}</h1>
      <p className="page-subtitle">{t('lang.select')}</p>
      <div className="lang-grid">
        {SUPPORTED_LANGS.map(lang => (
          <button
            key={lang.code}
            className={`lang-card ${current === lang.code ? 'lang-card--active' : ''}`}
            onClick={() => setLang(lang.code)}
          >
            <span className="lang-flag">{lang.flag}</span>
            <span className="lang-name">{lang.label}</span>
            {current === lang.code && <span className="lang-check">✓ 当前使用</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
