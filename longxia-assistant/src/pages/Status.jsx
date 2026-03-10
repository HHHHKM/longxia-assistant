import React, { useState, useEffect, useCallback } from 'react'
import StatusCard from '../components/StatusCard.jsx'
import { getStatus } from '../api.js'

// ── Mock 数据（服务未启动时展示） ──
const MOCK_STATUS = {
  running: false,
  todayMessages: 0,
  model: '（未获取）',
  channels: [],
  version: '--',
}

// 运行状态页 — 主页
// 老人一眼就能看懂"有没有在跑"
function Status() {
  const [status, setStatus]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [apiAvailable, setApiAvailable] = useState(false)
  const [lastRefresh, setLastRefresh]   = useState(null)
  const [actionMsg, setActionMsg]       = useState(null) // 操作结果反馈

  // 拉取状态
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
      setLastRefresh(new Date())
    }
  }, [])

  // 首次加载 + 每 30 秒自动刷新
  useEffect(() => {
    fetchStatus()
    const t = setInterval(fetchStatus, 30000)
    return () => clearInterval(t)
  }, [fetchStatus])

  // 重启服务
  async function handleRestart() {
    setActionMsg(null)
    try {
      // 优先使用 Electron IPC
      if (window.electronAPI?.restartService) {
        await window.electronAPI.restartService()
        setActionMsg({ type: 'success', text: '✅ 重启指令已发送！大约需要 5 秒，请稍候……' })
      } else {
        await fetch('http://localhost:3001/api/restart', { method: 'POST' })
        setActionMsg({ type: 'success', text: '✅ 重启指令已发送！大约需要 5 秒，请稍候……' })
      }
      setTimeout(fetchStatus, 5000)
    } catch {
      setActionMsg({ type: 'error', text: '❌ 无法连接服务，请手动在电脑上重启龙虾助手' })
    }
  }

  // 查看日志
  function handleViewLogs() {
    try {
      window.open('http://localhost:3001/api/logs', '_blank')
    } catch {
      setActionMsg({ type: 'error', text: '❌ 无法打开日志，请确认服务已启动' })
    }
  }

  const isRunning = status?.running ?? false

  return (
    <div className="status-page">
      <h1 className="page-title">🏠 运行状态</h1>

      {/* ── 老人最关心的：跑没跑 —— 超大横幅 ── */}
      <div className={`big-status-banner ${isRunning ? 'running' : 'stopped'}`}>
        <span className="banner-emoji">{isRunning ? '🟢' : '🔴'}</span>
        <div className={`banner-text ${isRunning ? 'running' : 'stopped'}`}>
          {isRunning ? '龙虾助手正在运行 ✔' : '龙虾助手未启动'}
        </div>
        <div className="banner-subtext">
          {isRunning
            ? '服务一切正常，您可以正常使用'
            : '请打开电脑上的龙虾助手程序，然后刷新此页面'}
        </div>
      </div>

      {/* ── API 离线提示 ── */}
      {!apiAvailable && (
        <div className="alert alert-warning">
          <span className="alert-icon">⚠️</span>
          <span>
            暂时无法连接到服务（地址：localhost:3001）。
            下方数据为示例，<strong>不代表真实状态</strong>。
            请先启动龙虾助手，然后点"刷新状态"。
          </span>
        </div>
      )}

      {/* ── 加载中 ── */}
      {loading && !status && (
        <div className="loading-center">
          <span className="spinner" />
          <span>正在检测服务状态，请稍候……</span>
        </div>
      )}

      {/* ── 快捷操作按钮 ── */}
      {status && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14 }}>
            🛠 快捷操作
          </div>
          <div className="service-actions">
            <button className="btn btn-secondary" onClick={handleRestart} disabled={loading}>
              🔄 重启服务
            </button>
            <button className="btn btn-secondary" onClick={handleViewLogs}>
              📋 查看日志
            </button>
            <button className="btn btn-secondary" onClick={fetchStatus} disabled={loading}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> 检测中…</>
                : '🔃 刷新状态'}
            </button>
          </div>

          {/* 操作结果反馈 */}
          {actionMsg && (
            <div className={`feedback-msg ${actionMsg.type}`}>
              {actionMsg.text}
            </div>
          )}
        </div>
      )}

      {/* ── 详细统计卡片 ── */}
      {status && (
        <div className="grid-2">
          <StatusCard
            icon="💬"
            label="今日消息数"
            value={`${status.todayMessages ?? 0} 条`}
            sub="今天处理的消息总数"
          />
          <StatusCard
            icon="🤖"
            label="正在使用的模型"
            value={status.model ?? '未知'}
            sub="当前选择的 AI 大模型"
          />
          <StatusCard
            icon="📡"
            label="已连接的渠道"
            value={status.channels?.length ? status.channels.join('、') : '暂无连接'}
            sub={`共连接了 ${status.channels?.length ?? 0} 个聊天平台`}
          />
          <StatusCard
            icon="🕐"
            label="最后刷新时间"
            value={lastRefresh ? lastRefresh.toLocaleTimeString('zh-CN') : '--'}
            sub="每 30 秒自动刷新一次"
          />
        </div>
      )}
    </div>
  )
}

export default Status
