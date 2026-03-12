import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStatus } from '../api.js'

const MOCK_STATUS = {
  running: false,
  todayMessages: 0,
  model: '（未获取）',
  channels: [],
  version: '--',
}

// 快捷入口
const QUICK_ACTIONS = [
  { emoji: '💬', label: '开始聊天',   desc: '问任何问题',         to: '/chat' },
  { emoji: '⏰', label: '设自动任务', desc: '每天提醒/发新闻',    to: '/tasks' },
  { emoji: '🧩', label: '功能中心',   desc: '查天气/写文章…',     to: '/skills' },
  { emoji: '⚙️', label: '设置',       desc: '修改口令/渠道',      to: '/config' },
]

function Home() {
  const navigate = useNavigate()
  const [status, setStatus]             = useState(null)
  const [loading, setLoading]           = useState(true)
  const [apiAvailable, setApiAvailable] = useState(false)
  const [actionMsg, setActionMsg]       = useState(null)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getStatus()
      setStatus(data)
      setApiAvailable(true)
    } catch {
      setStatus({ ...MOCK_STATUS })
      setApiAvailable(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const t = setInterval(fetchStatus, 30000)
    return () => clearInterval(t)
  }, [fetchStatus])

  async function handleRestart() {
    setActionMsg(null)
    try {
      if (window.electronAPI?.restartService) {
        await window.electronAPI.restartService()
      } else {
        await fetch('http://localhost:18789/api/v1/restart', { method: 'POST' })
      }
      setActionMsg({ type: 'success', text: '✅ 重启中，约 5 秒后生效…' })
      setTimeout(fetchStatus, 5000)
    } catch {
      setActionMsg({ type: 'error', text: '❌ 无法连接服务，请手动重启龙虾助手' })
    }
    setTimeout(() => setActionMsg(null), 6000)
  }

  const isRunning = status?.running ?? false

  return (
    <div className="home-page">

      {/* ── 顶部欢迎区 ── */}
      <div className="home-header">
        <div className="home-logo">🦞</div>
        <div>
          <div className="home-title">龙虾助手</div>
          <div className="home-subtitle">您的私人 AI 助理</div>
        </div>
      </div>

      {/* ── 运行状态大横幅 ── */}
      <div
        className={`home-status-banner ${isRunning ? 'home-status-banner--ok' : 'home-status-banner--off'}`}
        onClick={!isRunning ? handleRestart : undefined}
        style={{ cursor: isRunning ? 'default' : 'pointer' }}
        title={isRunning ? '' : '点击尝试重启'}
      >
        <span className="home-status-dot">{isRunning ? '🟢' : '🔴'}</span>
        <div>
          <div className="home-status-text">
            {loading && !status ? '正在检测…' : isRunning ? '运行正常，随时可用 ✓' : '龙虾助手未启动'}
          </div>
          <div className="home-status-sub">
            {isRunning
              ? `今日已处理 ${status?.todayMessages ?? 0} 条消息`
              : apiAvailable === false ? '点击这里尝试重启' : '请打开龙虾助手程序'}
          </div>
        </div>
        {!isRunning && (
          <button className="home-restart-btn" onClick={e => { e.stopPropagation(); handleRestart() }}>
            🔄 重启
          </button>
        )}
      </div>

      {/* 操作反馈 */}
      {actionMsg && (
        <div className={`home-feedback ${actionMsg.type}`}>{actionMsg.text}</div>
      )}

      {/* ── 四个大快捷入口 ── */}
      <div className="home-actions">
        {QUICK_ACTIONS.map(a => (
          <button
            key={a.to}
            className="home-action-btn"
            onClick={() => navigate(a.to)}
          >
            <span className="home-action-emoji">{a.emoji}</span>
            <span className="home-action-label">{a.label}</span>
            <span className="home-action-desc">{a.desc}</span>
          </button>
        ))}
      </div>

      {/* ── 今日状态小卡片 ── */}
      {status && isRunning && (
        <div className="home-stats">
          <div className="home-stat-card">
            <div className="home-stat-icon">💬</div>
            <div className="home-stat-value">{status.todayMessages ?? 0}</div>
            <div className="home-stat-label">今日消息</div>
          </div>
          <div className="home-stat-card">
            <div className="home-stat-icon">🤖</div>
            <div className="home-stat-value" style={{ fontSize: '0.9rem' }}>
              {(status.model ?? '未知').split('/').pop()}
            </div>
            <div className="home-stat-label">当前模型</div>
          </div>
          <div className="home-stat-card">
            <div className="home-stat-icon">📡</div>
            <div className="home-stat-value">{status.channels?.length ?? 0}</div>
            <div className="home-stat-label">已连渠道</div>
          </div>
        </div>
      )}

      {/* ── 未运行时的引导 ── */}
      {!isRunning && !loading && (
        <div className="home-guide-box">
          <p style={{ fontWeight: 700, marginBottom: 10, fontSize: '1rem' }}>🚀 怎么启动龙虾助手？</p>
          <ol style={{ paddingLeft: 20, lineHeight: 2, color: '#555', fontSize: '0.95rem' }}>
            <li>在电脑桌面或开始菜单找到"龙虾助手"图标</li>
            <li>双击打开，等待几秒</li>
            <li>回到这里，状态会自动变绿 ✓</li>
          </ol>
        </div>
      )}

    </div>
  )
}

export default Home
