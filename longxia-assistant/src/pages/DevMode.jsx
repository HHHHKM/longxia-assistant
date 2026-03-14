import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ── 工具函数 ──
function getAllLocalStorage() {
  const result = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    try { result[k] = JSON.parse(localStorage.getItem(k)) }
    catch { result[k] = localStorage.getItem(k) }
  }
  return result
}

function fmtSize(str) {
  const bytes = new Blob([str]).size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1024/1024).toFixed(2)} MB`
}

const SECTION_STYLE = {
  background: '#18181b',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '18px 16px',
  marginBottom: 16,
}

const LABEL_STYLE = {
  fontSize: '0.68rem', fontWeight: 700, color: '#52525b',
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
}

const INPUT_STYLE = {
  width: '100%', background: '#09090b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: '#fafafa',
  fontSize: '0.8rem', padding: '7px 10px',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'monospace',
}

const BTN = {
  padding: '6px 12px', borderRadius: 6, border: 'none',
  fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600,
}

export default function DevMode() {
  const navigate = useNavigate()

  // ── A. 调试信息 ──
  const [gatewayStatus, setGatewayStatus] = useState(null) // null | 'ok' | 'fail'
  const [statusData, setStatusData] = useState(null)
  const [checking, setChecking] = useState(false)

  async function checkGateway() {
    setChecking(true)
    setGatewayStatus(null)
    const url = advConfig.gatewayUrl || 'http://localhost:18789'
    try {
      const res = await fetch(`${url}/api/v1/status`)
      if (res.ok) {
        const data = await res.json()
        setStatusData(data)
        setGatewayStatus('ok')
      } else {
        setGatewayStatus('fail')
      }
    } catch {
      setGatewayStatus('fail')
    } finally {
      setChecking(false)
    }
  }

  // ── B. localStorage 查看器 ──
  const [lsData, setLsData] = useState({})
  const [lsFilter, setLsFilter] = useState('')
  const [lsExpanded, setLsExpanded] = useState({})

  function refreshLS() { setLsData(getAllLocalStorage()) }
  useEffect(() => { refreshLS() }, [])

  const lsKeys = Object.keys(lsData).filter(k =>
    !lsFilter || k.toLowerCase().includes(lsFilter.toLowerCase())
  )

  // ── C. 高级配置 ──
  const [advConfig, setAdvConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem('longxia_dev_config') || '{}') } catch { return {} }
  })

  function saveAdvConfig(patch) {
    const next = { ...advConfig, ...patch }
    setAdvConfig(next)
    localStorage.setItem('longxia_dev_config', JSON.stringify(next))
  }

  // ── D. 实验性功能开关 ──
  const [flags, setFlags] = useState(() => {
    try { return JSON.parse(localStorage.getItem('longxia_dev_flags') || '{}') } catch { return {} }
  })

  function toggleFlag(key) {
    const next = { ...flags, [key]: !flags[key] }
    setFlags(next)
    localStorage.setItem('longxia_dev_flags', JSON.stringify(next))
  }

  const FEATURE_FLAGS = [
    { key: 'streamDisabled',   label: '禁用流式响应',       desc: '强制使用普通请求模式' },
    { key: 'memoryDisabled',   label: '禁用记忆上下文',     desc: '发送时不附带记忆信息' },
    { key: 'showTokenPerMsg',  label: '每条消息显示token数', desc: '气泡底部显示估算token' },
    { key: 'showLatency',      label: '显示请求耗时',       desc: '回复气泡显示响应毫秒数' },
    { key: 'verboseLog',       label: '详细日志模式',       desc: '控制台输出详细请求日志' },
  ]

  // ── E. 数据管理 ──
  const [exportDone, setExportDone] = useState(false)
  const [importErr, setImportErr] = useState(null)
  const fileRef = useRef(null)
  const [resetConfirm, setResetConfirm] = useState(false)

  function handleExport() {
    const data = getAllLocalStorage()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `longxia-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportDone(true)
    setTimeout(() => setExportDone(false), 2000)
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        Object.entries(data).forEach(([k, v]) => {
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
        })
        refreshLS()
        setImportErr('✅ 导入成功，共 ' + Object.keys(data).length + ' 条数据')
      } catch {
        setImportErr('❌ 文件格式错误，请导入有效的JSON备份文件')
      }
    }
    reader.readAsText(file)
  }

  function handleReset() {
    if (!resetConfirm) { setResetConfirm(true); return }
    // 只清龙虾相关数据，不清浏览器其他数据
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('longxia_')) keys.push(k)
    }
    keys.forEach(k => localStorage.removeItem(k))
    refreshLS()
    setResetConfirm(false)
    alert('已重置所有龙虾助手数据')
  }

  // ── F. 命令终端 ──
  const [cmdInput, setCmdInput] = useState('')
  const [cmdHistory, setCmdHistory] = useState([
    { type: 'system', text: '🦞 龙虾终端 v1.0 — 输入命令并按 Enter 执行' },
    { type: 'system', text: '提示：在 Electron 桌面端运行时支持系统命令；网页端仅支持内置命令' },
  ])
  const [cmdRunning, setCmdRunning] = useState(false)
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [cmdInputHistory, setCmdInputHistory] = useState([])
  const terminalRef = useRef(null)
  const cmdInputRef = useRef(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [cmdHistory])

  // 内置命令
  const BUILTIN_CMDS = {
    help: () => [
      '可用命令：',
      '  help              — 显示帮助',
      '  status            — 检测 Gateway 状态',
      '  ls                — 列出所有 localStorage keys',
      '  get <key>         — 读取 localStorage 值',
      '  set <key> <val>   — 写入 localStorage 值',
      '  del <key>         — 删除 localStorage key',
      '  clear             — 清空终端',
      '  version           — 显示版本信息',
      '  ping              — 测试 Gateway 连接',
      '  config            — 显示当前配置',
      '  以及任意系统命令（仅Electron桌面端）',
    ].join('\n'),

    version: () => `龙虾助手 v1.0.0\nElectron: ${window.electronAPI ? '已检测到' : '未检测到（网页模式）'}\nUA: ${navigator.userAgent.slice(0,80)}`,

    ls: () => {
      const keys = []
      for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i))
      return keys.length ? keys.map(k => `  ${k} (${fmtSize(localStorage.getItem(k))})`).join('\n') : '(空)'
    },

    clear: () => {
      setCmdHistory([{ type: 'system', text: '🦞 终端已清空' }])
      return null
    },

    ping: async () => {
      const url = advConfig.gatewayUrl || 'http://localhost:18789'
      const t0 = Date.now()
      try {
        const res = await fetch(`${url}/api/v1/status`)
        const ms = Date.now() - t0
        return res.ok ? `✅ Gateway 响应正常 (${ms}ms)` : `❌ Gateway 返回 ${res.status} (${ms}ms)`
      } catch (e) {
        return `❌ 连接失败: ${e.message}`
      }
    },

    status: async () => {
      const url = advConfig.gatewayUrl || 'http://localhost:18789'
      try {
        const res = await fetch(`${url}/api/v1/status`)
        const data = await res.json()
        return JSON.stringify(data, null, 2)
      } catch (e) {
        return `❌ ${e.message}`
      }
    },

    config: () => {
      const cfg = getAllLocalStorage()
      const relevant = {}
      Object.keys(cfg).filter(k => k.includes('dev') || k.includes('config')).forEach(k => relevant[k] = cfg[k])
      return JSON.stringify(relevant, null, 2) || '(无配置数据)'
    },
  }

  async function runCommand(raw) {
    const trimmed = raw.trim()
    if (!trimmed) return

    // 加入历史
    setCmdInputHistory(prev => [trimmed, ...prev.slice(0, 49)])
    setHistoryIdx(-1)

    // 显示输入
    setCmdHistory(prev => [...prev, { type: 'input', text: `$ ${trimmed}` }])

    const parts = trimmed.split(/\s+/)
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)

    setCmdRunning(true)

    try {
      // 内置命令
      if (cmd === 'clear') {
        BUILTIN_CMDS.clear()
        setCmdRunning(false)
        return
      }

      if (cmd === 'get' && args[0]) {
        const val = localStorage.getItem(args[0])
        const out = val !== null ? val : `(key "${args[0]}" 不存在)`
        setCmdHistory(prev => [...prev, { type: 'output', text: out }])
        refreshLS()
        setCmdRunning(false)
        return
      }

      if (cmd === 'set' && args[0]) {
        const val = args.slice(1).join(' ')
        localStorage.setItem(args[0], val)
        setCmdHistory(prev => [...prev, { type: 'output', text: `✅ 已设置 ${args[0]} = ${val}` }])
        refreshLS()
        setCmdRunning(false)
        return
      }

      if (cmd === 'del' && args[0]) {
        localStorage.removeItem(args[0])
        setCmdHistory(prev => [...prev, { type: 'output', text: `✅ 已删除 ${args[0]}` }])
        refreshLS()
        setCmdRunning(false)
        return
      }

      if (BUILTIN_CMDS[cmd]) {
        const result = await BUILTIN_CMDS[cmd](args)
        if (result !== null && result !== undefined) {
          setCmdHistory(prev => [...prev, { type: 'output', text: String(result) }])
        }
        setCmdRunning(false)
        return
      }

      // 系统命令（Electron IPC）
      if (window.electronAPI?.runCommand) {
        const result = await window.electronAPI.runCommand(trimmed)
        setCmdHistory(prev => [...prev, {
          type: result.exitCode === 0 ? 'output' : 'error',
          text: result.stdout || result.stderr || '(无输出)',
        }])
      } else {
        // 网页模式 fallback：尝试 Gateway exec
        const url = advConfig.gatewayUrl || 'http://localhost:18789'
        try {
          const res = await fetch(`${url}/api/v1/exec`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: trimmed }),
          })
          if (res.ok) {
            const data = await res.json()
            setCmdHistory(prev => [...prev, { type: 'output', text: data.output || data.stdout || '(无输出)' }])
          } else {
            setCmdHistory(prev => [...prev, { type: 'error', text: `命令 "${cmd}" 未找到。网页模式下仅支持内置命令，桌面端支持系统命令。` }])
          }
        } catch {
          setCmdHistory(prev => [...prev, { type: 'error', text: `命令 "${cmd}" 未找到。网页模式下仅支持内置命令，桌面端支持系统命令。` }])
        }
      }
    } catch (e) {
      setCmdHistory(prev => [...prev, { type: 'error', text: `错误: ${e.message}` }])
    } finally {
      setCmdRunning(false)
    }
  }

  function handleCmdKeyDown(e) {
    if (e.key === 'Enter') {
      runCommand(cmdInput)
      setCmdInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = Math.min(historyIdx + 1, cmdInputHistory.length - 1)
      setHistoryIdx(idx)
      setCmdInput(cmdInputHistory[idx] || '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = Math.max(historyIdx - 1, -1)
      setHistoryIdx(idx)
      setCmdInput(idx === -1 ? '' : cmdInputHistory[idx] || '')
    }
  }

  // ── 渲染 ──
  return (
    <div style={{ padding: '16px 14px 80px', background: '#09090b', minHeight: '100vh' }}>

      {/* 头部 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          background: 'rgba(232,69,69,0.15)', border: '1px solid rgba(232,69,69,0.3)',
          borderRadius: 6, padding: '3px 8px', fontSize: '0.65rem', fontWeight: 700,
          color: '#f87171', letterSpacing: '0.1em',
        }}>DEV MODE</div>
        <div style={{ fontSize: '0.82rem', color: '#52525b' }}>开发者模式 — 仅供调试使用</div>
        <button onClick={() => navigate(-1)} style={{ ...BTN, marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', color: '#a1a1aa' }}>
          ✕ 关闭
        </button>
      </div>

      {/* ── A. 调试信息 ── */}
      <div style={SECTION_STYLE}>
        <div style={LABEL_STYLE}>A · 调试信息 / Gateway 连接</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            style={{ ...INPUT_STYLE, flex: 1 }}
            value={advConfig.gatewayUrl || 'http://localhost:18789'}
            onChange={e => saveAdvConfig({ gatewayUrl: e.target.value })}
            placeholder="Gateway URL"
          />
          <button
            style={{ ...BTN, background: '#E84545', color: '#fff', flexShrink: 0 }}
            onClick={checkGateway}
            disabled={checking}
          >
            {checking ? '检测中…' : '测试连接'}
          </button>
        </div>
        {gatewayStatus === 'ok' && (
          <div style={{ fontSize: '0.75rem', color: '#86efac', marginBottom: 8 }}>
            ✅ 已连接 · 版本 {statusData?.version ?? '--'} · 模型 {statusData?.agents?.defaults?.model ?? statusData?.model ?? '--'}
          </div>
        )}
        {gatewayStatus === 'fail' && (
          <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginBottom: 8 }}>❌ 连接失败</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            ['Electron 模式', window.electronAPI ? '✅ 是' : '❌ 否（网页）'],
            ['UA', navigator.userAgent.slice(0, 40) + '…'],
            ['localStorage 条数', localStorage.length + ' 条'],
            ['localStorage 大小', fmtSize(JSON.stringify(getAllLocalStorage()))],
          ].map(([k, v]) => (
            <div key={k} style={{ background: '#09090b', borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: '0.62rem', color: '#52525b', marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: '0.75rem', color: '#a1a1aa', fontFamily: 'monospace', wordBreak: 'break-all' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── B. 高级配置 ── */}
      <div style={SECTION_STYLE}>
        <div style={LABEL_STYLE}>B · 高级配置</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'systemPrompt', label: 'System Prompt（AI人设）', placeholder: '例如：你是一个专业的产品经理助手，回答要简洁专业', type: 'textarea' },
            { key: 'customModel',  label: '自定义模型名（覆盖预设列表）', placeholder: '例如：gpt-4o-2024-11-20', type: 'input' },
            { key: 'contextLimit', label: '对话上下文条数（默认6）', placeholder: '填数字，例如：10', type: 'input' },
            { key: 'requestTimeout', label: '请求超时秒数（默认30）', placeholder: '填数字，例如：60', type: 'input' },
          ].map(item => (
            <div key={item.key}>
              <div style={{ fontSize: '0.72rem', color: '#71717a', marginBottom: 4 }}>{item.label}</div>
              {item.type === 'textarea' ? (
                <textarea
                  style={{ ...INPUT_STYLE, height: 70, resize: 'vertical' }}
                  value={advConfig[item.key] || ''}
                  onChange={e => saveAdvConfig({ [item.key]: e.target.value })}
                  placeholder={item.placeholder}
                />
              ) : (
                <input
                  style={INPUT_STYLE}
                  value={advConfig[item.key] || ''}
                  onChange={e => saveAdvConfig({ [item.key]: e.target.value })}
                  placeholder={item.placeholder}
                />
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.65rem', color: '#3f3f46', marginTop: 10 }}>
          ⚠️ 修改后立即生效，重置应用数据不会清除这里的配置
        </div>
      </div>

      {/* ── C. 实验性功能开关 ── */}
      <div style={SECTION_STYLE}>
        <div style={LABEL_STYLE}>C · 实验性功能开关</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FEATURE_FLAGS.map(flag => (
            <div key={flag.key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#fafafa' }}>{flag.label}</div>
                <div style={{ fontSize: '0.68rem', color: '#52525b', marginTop: 2 }}>{flag.desc}</div>
              </div>
              <button
                onClick={() => toggleFlag(flag.key)}
                style={{
                  ...BTN, flexShrink: 0, marginLeft: 12,
                  background: flags[flag.key] ? '#E84545' : 'rgba(255,255,255,0.06)',
                  color: flags[flag.key] ? '#fff' : '#71717a',
                  minWidth: 52,
                }}
              >
                {flags[flag.key] ? '开启' : '关闭'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── D. localStorage 查看器 ── */}
      <div style={SECTION_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={LABEL_STYLE}>D · localStorage 查看器</div>
          <button onClick={refreshLS} style={{ ...BTN, background: 'rgba(255,255,255,0.06)', color: '#a1a1aa' }}>刷新</button>
        </div>
        <input
          style={{ ...INPUT_STYLE, marginBottom: 10 }}
          value={lsFilter}
          onChange={e => setLsFilter(e.target.value)}
          placeholder="过滤 key 名称…"
        />
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {lsKeys.map(k => (
            <div key={k} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6, marginBottom: 6 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                onClick={() => setLsExpanded(prev => ({ ...prev, [k]: !prev[k] }))}
              >
                <span style={{ fontSize: '0.65rem', color: '#52525b' }}>{lsExpanded[k] ? '▼' : '▶'}</span>
                <span style={{ fontSize: '0.78rem', color: '#e2e2e5', fontFamily: 'monospace', flex: 1 }}>{k}</span>
                <span style={{ fontSize: '0.62rem', color: '#3f3f46' }}>{fmtSize(localStorage.getItem(k))}</span>
                <button
                  onClick={e => { e.stopPropagation(); localStorage.removeItem(k); refreshLS() }}
                  style={{ ...BTN, padding: '2px 6px', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: '0.65rem' }}
                >删</button>
              </div>
              {lsExpanded[k] && (
                <pre style={{
                  margin: '6px 0 0 16px', fontSize: '0.68rem',
                  color: '#71717a', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  background: '#09090b', borderRadius: 4, padding: 8,
                  maxHeight: 150, overflowY: 'auto',
                }}>
                  {(() => { try { return JSON.stringify(JSON.parse(localStorage.getItem(k)), null, 2) } catch { return localStorage.getItem(k) } })()}
                </pre>
              )}
            </div>
          ))}
          {lsKeys.length === 0 && <div style={{ fontSize: '0.75rem', color: '#3f3f46' }}>没有匹配的数据</div>}
        </div>
      </div>

      {/* ── E. 数据管理 ── */}
      <div style={SECTION_STYLE}>
        <div style={LABEL_STYLE}>E · 数据管理</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleExport}
            style={{ ...BTN, background: 'rgba(34,197,94,0.15)', color: '#86efac' }}
          >
            {exportDone ? '✅ 已导出' : '📥 导出备份 JSON'}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            style={{ ...BTN, background: 'rgba(59,130,246,0.15)', color: '#93c5fd' }}
          >
            📤 导入备份
          </button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          <button
            onClick={handleReset}
            style={{ ...BTN, background: resetConfirm ? '#ef4444' : 'rgba(239,68,68,0.15)', color: resetConfirm ? '#fff' : '#fca5a5' }}
          >
            {resetConfirm ? '⚠️ 再次点击确认清空' : '🗑️ 重置龙虾数据'}
          </button>
          {resetConfirm && (
            <button onClick={() => setResetConfirm(false)} style={{ ...BTN, background: 'rgba(255,255,255,0.06)', color: '#a1a1aa' }}>取消</button>
          )}
        </div>
        {importErr && <div style={{ fontSize: '0.75rem', color: importErr.startsWith('✅') ? '#86efac' : '#fca5a5', marginTop: 8 }}>{importErr}</div>}
      </div>

      {/* ── F. 命令终端 ── */}
      <div style={{ ...SECTION_STYLE, marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={LABEL_STYLE}>F · 命令终端</div>
          <button
            onClick={() => setCmdHistory([{ type: 'system', text: '🦞 终端已清空' }])}
            style={{ ...BTN, background: 'rgba(255,255,255,0.06)', color: '#52525b', fontSize: '0.65rem' }}
          >清空</button>
        </div>

        {/* 终端输出区 */}
        <div
          ref={terminalRef}
          onClick={() => cmdInputRef.current?.focus()}
          style={{
            background: '#000', borderRadius: 8,
            padding: '12px 10px', height: 260, overflowY: 'auto',
            fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.7,
            cursor: 'text',
          }}
        >
          {cmdHistory.map((line, i) => (
            <div key={i} style={{
              color: line.type === 'input' ? '#fbbf24'
                   : line.type === 'error' ? '#fca5a5'
                   : line.type === 'system' ? '#52525b'
                   : '#a1a1aa',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {line.text}
            </div>
          ))}
          {cmdRunning && (
            <div style={{ color: '#52525b' }}>⏳ 执行中…</div>
          )}
        </div>

        {/* 输入行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 6,
          background: '#000', borderRadius: 6, padding: '6px 10px' }}>
          <span style={{ color: '#E84545', fontFamily: 'monospace', fontSize: '0.8rem', marginRight: 8 }}>$</span>
          <input
            ref={cmdInputRef}
            value={cmdInput}
            onChange={e => setCmdInput(e.target.value)}
            onKeyDown={handleCmdKeyDown}
            disabled={cmdRunning}
            placeholder="输入命令… (↑↓ 历史记录)"
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: '#fafafa', fontFamily: 'monospace', fontSize: '0.8rem',
              outline: 'none',
            }}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={() => { runCommand(cmdInput); setCmdInput('') }}
            disabled={cmdRunning || !cmdInput.trim()}
            style={{ ...BTN, background: cmdInput.trim() ? '#E84545' : 'transparent', color: cmdInput.trim() ? '#fff' : '#3f3f46', fontSize: '0.7rem' }}
          >执行</button>
        </div>
        <div style={{ fontSize: '0.62rem', color: '#27272a', marginTop: 4 }}>
          ↑↓ 历史记录 · Enter 执行 · 输入 help 查看内置命令
        </div>
      </div>

    </div>
  )
}
