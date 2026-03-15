import React from 'react'
import { useNavigate } from 'react-router-dom'

const TEAM = [
  { emoji: '🦞', name: '龙虾助手', role: '产品本体' },
  { emoji: '⚙️', name: 'OpenClaw', role: '底层引擎' },
]

const LINKS = [
  { label: 'GitHub 开源仓库', url: 'https://github.com/longxia-assistant/longxia-assistant', icon: '🐙' },
  { label: '官方网站', url: 'https://ixx.ai', icon: '🌐' },
  { label: '问题反馈', url: 'https://github.com/longxia-assistant/longxia-assistant/issues', icon: '🐛' },
]

export default function About() {
  const navigate = useNavigate()

  function openLink(url) {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url)
    } else {
      window.open(url, '_blank', 'noopener')
    }
  }

  return (
    <div className="page-padding" style={{ paddingBottom: 48 }}>

      {/* Logo + 版本 */}
      <div style={{ textAlign: 'center', padding: '32px 0 28px' }}>
        <img
          src="/lobster-icon.jpg"
          alt="龙虾助手"
          style={{ width: 72, height: 72, borderRadius: 18, objectFit: 'cover', marginBottom: 14 }}
        />
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fafafa', marginBottom: 4 }}>龙虾助手</div>
        <div style={{ fontSize: '0.78rem', color: '#52525b' }}>版本 v0.1.0 · 基于 OpenClaw</div>
      </div>

      {/* 使命 */}
      <div style={{
        background: '#18181b', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '20px 18px', marginBottom: 20,
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          我们的使命
        </div>
        <p style={{ fontSize: '0.875rem', color: '#a1a1aa', lineHeight: 1.8, margin: 0 }}>
          让 AI 真正走进普通人的日常生活。<br />
          不只是聊天，还能提醒、安排、关怀。<br />
          让七八十岁的叔叔阿姨也能轻松用上。
        </p>
        <div style={{
          marginTop: 14, paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '0.78rem', color: '#3f3f46', lineHeight: 1.7,
        }}>
          🌟 公益开源 &nbsp;·&nbsp; 永久免费 &nbsp;·&nbsp; 无广告 &nbsp;·&nbsp; 科技平权
        </div>
      </div>

      {/* 外部链接 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          相关链接
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {LINKS.map(l => (
            <button
              key={l.url}
              onClick={() => openLink(l.url)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: '#18181b',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                width: '100%',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              <span style={{ fontSize: '1.1rem' }}>{l.icon}</span>
              <span style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>{l.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#3f3f46' }}>↗</span>
            </button>
          ))}
        </div>
      </div>

      {/* 致谢 */}
      <div style={{
        background: '#18181b', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '18px', marginBottom: 20,
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          技术致谢
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['OpenClaw', 'Electron', 'React', 'Vite', 'OpenAI', 'DeepSeek', 'Anthropic'].map(name => (
            <span key={name} style={{
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.75rem', color: '#71717a',
            }}>{name}</span>
          ))}
        </div>
      </div>

      {/* 底部版权 */}
      <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#3f3f46', lineHeight: 1.8 }}>
        <div>© 2025–2026 龙虾助手 · MIT License</div>
        <div>Made with ❤️ for everyone</div>
      </div>
    </div>
  )
}
