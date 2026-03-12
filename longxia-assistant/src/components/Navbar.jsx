import React from 'react'
import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { t } from '../i18n/index.js'

const LINKS = [
  { to: '/', icon: '🦞', labelKey: 'nav.home', end: true },
  { to: '/chat', icon: '💬', labelKey: 'nav.chat', end: false },
  { to: '/tasks', icon: '⏰', labelKey: 'nav.tasks', end: false },
  { to: '/family', icon: '👨‍👩‍👧', labelKey: 'nav.family', end: false },
  { to: '/care', icon: '❤️', labelKey: 'nav.care', end: false },
  { to: '/skills', icon: '🧩', labelKey: 'nav.skills', end: false },
  { to: '/config', icon: '⚙️', labelKey: 'nav.config', end: false },
]

// 仅在侧边导航栏显示的额外链接（案例 & 下载 & 语言），不放底部导航以免过挤
const EXTRA_LINKS = [
  { to: '/cases', icon: '🌟', labelKey: 'nav.cases', end: false },
  { to: '/download', icon: '⬇️', labelKey: 'nav.download', end: false },
  { to: '/model',    icon: '🧠', labelKey: 'nav.model',    end: false },
  { to: '/update',   icon: '🔄', labelKey: 'nav.update',   end: false },
  { to: '/elder',    icon: '👴', labelKey: 'nav.elder',    end: false },
  { to: '/language', icon: '🌐', labelKey: 'nav.language', end: false },
]

function Navbar() {
  const location = useLocation()
  const [theme, setTheme] = useState(() => localStorage.getItem('longxia_theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('longxia_theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/lobster-icon.jpg" style={{width:28,height:28,objectFit:"cover",borderRadius:8,flexShrink:0}} alt=""/>
          <span className="navbar-title">{t('app.name')}</span>
          <span className="navbar-tagline">{t('app.tagline')}</span>
        </div>
        <button className="theme-toggle-btn" onClick={toggleTheme} title="切换主题">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="navbar-links">
          {LINKS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <span className="nav-icon">{l.icon}</span>
              <span className="nav-label">{t(l.labelKey)}</span>
            </NavLink>
          ))}
          <div className="navbar-divider" />
          {EXTRA_LINKS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <span className="nav-icon">{l.icon}</span>
              <span className="nav-label">{t(l.labelKey)}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="bottom-nav">
        <div className="bottom-nav-inner">
          {LINKS.map(l => {
            const active = l.end ? location.pathname === l.to : location.pathname.startsWith(l.to)
            return (
              <NavLink key={l.to} to={l.to} className={active ? 'bottom-nav-item active' : 'bottom-nav-item'}>
                <span className="bn-icon">{l.icon}</span>
                <span>{t(l.labelKey)}</span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default Navbar
