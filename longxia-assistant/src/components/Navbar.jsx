import React from 'react'
import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { t } from '../i18n/index.js'

const LINKS = [
  { to: '/',        icon: '🦞', label: '首页',   end: true  },
  { to: '/chat',    icon: '💬', label: '对话',   end: false },
  { to: '/tasks',   icon: '⏰', label: '任务',   end: false },
  { to: '/family',  icon: '👨‍👩‍👧', label: '家庭',   end: false },
  { to: '/care',    icon: '❤️', label: '关怀',   end: false },
  { to: '/skills',  icon: '🧩', label: '功能',   end: false },
  { to: '/config',  icon: '⚙️', label: '设置',   end: false },
]

function Navbar() {
  const location = useLocation()

  return (
    <nav className="navbar">
      {LINKS.map(l => {
        const isActive = l.end
          ? location.pathname === l.to
          : location.pathname.startsWith(l.to)
        return (
          <NavLink
            key={l.to}
            to={l.to}
            className={isActive ? 'nav-item active' : 'nav-item'}
          >
            <span className="nav-icon">{l.icon}</span>
            <span className="nav-label">{l.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default Navbar
