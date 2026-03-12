import React, { useState } from 'react'

// ── 平台数据 ──────────────────────────────────────────────
const PLATFORMS = [
  {
    id: 'windows',
    icon: '🪟',
    name: 'Windows',
    version: 'v1.0.0',
    date: '2026-03-12',
    support: 'Windows 10 / 11',
    size: '约 80 MB',
    ext: '.exe 安装包',
    dlLabel: '下载 .exe',
    dlLink: 'https://github.com/longxia-assistant/longxia-assistant/releases/download/v1.0.0/龙虾助手.Setup.1.0.0.exe',
  },
  {
    id: 'macos',
    icon: '🍎',
    name: 'macOS',
    version: 'v1.0.0',
    date: '2026-03-12',
    support: 'macOS 12 及以上',
    size: '约 75 MB',
    ext: '.dmg 安装包',
    dlLabel: '下载 .dmg',
    dlLink: '#',   // 暂未构建
  },
  {
    id: 'linux',
    icon: '🐧',
    name: 'Linux',
    version: 'v1.0.0',
    date: '2026-03-12',
    support: 'Ubuntu 20.04+',
    size: '约 106 MB',
    ext: '.AppImage',
    dlLabel: '下载 .AppImage',
    dlLink: 'https://ixx.ai/downloads/龙虾助手-1.0.0.AppImage',
  },
]

// ── 安装说明 ──────────────────────────────────────────────
const INSTALL_STEPS = {
  windows: [
    '① 下载 .exe 安装包到本地',
    '② 双击运行安装包',
    '③ 按提示点击「下一步」完成安装',
    '④ 在桌面找到龙虾助手图标',
    '⑤ 双击图标，开始使用 🦞',
  ],
  macos: [
    '① 下载 .dmg 安装包到本地',
    '② 双击打开 .dmg 文件',
    '③ 将龙虾助手图标拖到 Applications（应用程序）文件夹',
    '④ 如遇「无法打开」提示，请到「系统设置 → 隐私与安全性」点「仍要打开」',
    '⑤ 打开 Applications，双击龙虾助手 🦞',
  ],
  linux: [
    '① 下载 .AppImage 文件到本地',
    '② 右键 → 属性 → 允许作为程序执行（或 chmod +x）',
    '③ 双击运行，即可使用 🦞',
  ],
}

// ── 卸载说明 ──────────────────────────────────────────────
const UNINSTALL_STEPS = {
  windows: '控制面板 → 程序和功能 → 找到龙虾助手 → 点卸载',
  macos: '打开 Finder → Applications（应用程序）→ 将龙虾助手拖入废纸篓',
  linux: '直接删除 .AppImage 文件即可',
}

// ── FAQ 数据 ──────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: '下载后打不开怎么办？',
    a: 'macOS 用户请到「系统设置 → 隐私与安全性」点「仍要打开」；Windows 用户如遇安全提示请点「更多信息 → 仍要运行」。',
  },
  {
    q: '需要网络吗？',
    a: '安装不需要网络，但 AI 对话功能需要网络连接到 AI 服务商。',
  },
  {
    q: '数据存在哪里？',
    a: '所有数据存储在本地，不上传到任何服务器，完全私密。',
  },
  {
    q: '免费的吗？',
    a: '完全免费，永久免费，无广告，无内购。',
  },
  {
    q: '会有病毒吗？',
    a: '龙虾助手完全开源，代码公开透明，欢迎自行在 GitHub 查验。',
  },
]

// ── 安全说明 ──────────────────────────────────────────────
const SECURITY_ITEMS = [
  { icon: '🔓', title: '开源透明', desc: '完整源代码在 GitHub 公开' },
  { icon: '💻', title: '本地运行', desc: '数据不离开你的电脑' },
  { icon: '🚫', title: '无追踪', desc: '不收集任何用户行为数据' },
  { icon: '📵', title: '无广告', desc: '永远不会有广告' },
]

// ── FAQ 折叠组件 ──────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`dl-faq-item ${open ? 'dl-faq-item--open' : ''}`}>
      <button className="dl-faq-q" onClick={() => setOpen(v => !v)}>
        <span>{q}</span>
        <span className="dl-faq-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="dl-faq-a">{a}</div>}
    </div>
  )
}

// ── 安装/卸载说明折叠 ──────────────────────────────────────
function InstructionSection({ platform }) {
  const [tab, setTab] = useState('install')
  const ids = ['windows', 'macos', 'linux']
  const names = { windows: '🪟 Windows', macos: '🍎 macOS', linux: '🐧 Linux' }

  return (
    <div className="dl-instructions">
      <h2 className="dl-section-title">📋 安装与卸载说明</h2>

      <div className="dl-inst-tabs">
        {['install', 'uninstall'].map(t => (
          <button
            key={t}
            className={`dl-inst-tab ${tab === t ? 'dl-inst-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'install' ? '安装步骤' : '卸载方法'}
          </button>
        ))}
      </div>

      {tab === 'install' ? (
        <div className="dl-inst-platform-grid">
          {ids.map(pid => (
            <div key={pid} className="dl-inst-platform">
              <div className="dl-inst-platform-name">{names[pid]}</div>
              <ol className="dl-inst-steps">
                {INSTALL_STEPS[pid].map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <div className="dl-inst-platform-grid">
          {ids.map(pid => (
            <div key={pid} className="dl-inst-platform">
              <div className="dl-inst-platform-name">{names[pid]}</div>
              <p className="dl-uninstall-text">{UNINSTALL_STEPS[pid]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 主页面 ───────────────────────────────────────────────
export default function Download() {
  const [macAlert, setMacAlert] = React.useState(false)
  return (
    <div className="dl-page">

      {/* ── 顶部标题 ── */}
      <div className="dl-hero">
        <div className="dl-hero-icon">🦞</div>
        <h1 className="dl-hero-title">下载龙虾助手</h1>
        <p className="dl-hero-sub">完全免费，无广告，永久开源</p>
        <div className="dl-badges">
          <span className="dl-badge">✅ 免费</span>
          <span className="dl-badge">🔓 开源</span>
          <span className="dl-badge">📵 无广告</span>
          <span className="dl-badge">🔒 本地存储</span>
        </div>
      </div>

      {/* ── 平台选择 ── */}
      <h2 className="dl-section-title">📦 选择你的系统</h2>
      <div className="dl-platform-grid">
        {PLATFORMS.map(p => (
          <div key={p.id} className="dl-platform-card">
            <div className="dl-platform-icon">{p.icon}</div>
            <div className="dl-platform-name">{p.name}</div>
            <div className="dl-platform-meta">
              <span className="dl-platform-version">{p.version}</span>
              <span className="dl-platform-date">更新：{p.date}</span>
            </div>
            <div className="dl-platform-info">
              <div>🖥 支持：{p.support}</div>
              <div>📦 大小：{p.size}</div>
              <div>📄 格式：{p.ext}</div>
            </div>
            <a
              href={p.dlLink === '#' ? undefined : p.dlLink}
              className="dl-download-btn"
              onClick={e => {
                if (p.dlLink === '#') {
                  e.preventDefault()
                  alert('Mac 安装包正在准备中，敬请期待！')
                }
              }}
              download
              target="_blank"
              rel="noreferrer"
            >
              ⬇️ {p.dlLabel}
            </a>
          </div>
        ))}
      </div>

      {macAlert && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 16,
          fontSize: '0.82rem',
          color: '#fcd34d',
          fontWeight: 500,
        }}>
          🍎 Mac 安装包正在准备中，敬请期待！
        </div>
      )}
      {/* ── 安装/卸载说明 ── */}
      <InstructionSection />

      {/* ── FAQ ── */}
      <div className="dl-faq">
        <h2 className="dl-section-title">❓ 常见问题</h2>
        {FAQ_ITEMS.map((item, i) => (
          <FaqItem key={i} q={item.q} a={item.a} />
        ))}
      </div>

      {/* ── 安全说明 ── */}
      <div className="dl-security">
        <h2 className="dl-section-title">🛡 安全说明</h2>
        <div className="dl-security-grid">
          {SECURITY_ITEMS.map(s => (
            <div key={s.title} className="dl-security-item">
              <div className="dl-security-icon">{s.icon}</div>
              <div>
                <div className="dl-security-title">{s.title}</div>
                <div className="dl-security-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
