import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

// V1 导航：首页 / 聊天 / 自动任务 / 功能中心 / 设置
const LINKS = [
  { to: '/',        icon: '🏠', label: '首页',     end: true },
  { to: '/chat',    icon: '💬', label: '聊天',     end: false },
  { to: '/tasks',   icon: '⏰', label: '自动任务', end: false },
  { to: '/skills',  icon: '🧩', label: '功能中心', end: false },
  { to: '/family',  icon: '👨‍👩‍👧', label: '家庭',     end: false },
  { to: '/config',  icon: '⚙️', label: '设置',     end: false },
]

function Navbar() {
  const location = useLocation()

  return (
    <>
      {/* ── 桌面顶部导航 ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="navbar-logo">🦞</span>
          <span className="navbar-title">龙虾助手</span>
        </div>
        <div className="navbar-links">
          {LINKS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <span className="nav-icon">{l.icon}</span>
              <span className="nav-label">{l.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── 手机底部 Tab 栏 ── */}
      <div className="bottom-nav">
        <div className="bottom-nav-inner">
          {LINKS.map(l => {
            const active = l.end
              ? location.pathname === l.to
              : location.pathname.startsWith(l.to)
            return (
              <NavLink
                key={l.to}
                to={l.to}
                className={active ? 'bottom-nav-item active' : 'bottom-nav-item'}
              >
                <span className="bn-icon">{l.icon}</span>
                <span>{l.label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default Navbar
