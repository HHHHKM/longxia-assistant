import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── 共用样式常量 ───────────────────────────────────────────────────────────────
const INPUT_STYLE = {
  width: '100%', background: '#18181b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: '#fafafa',
  fontSize: '0.8rem', padding: '7px 10px',
  outline: 'none', boxSizing: 'border-box',
}
const SELECT_STYLE = { ...INPUT_STYLE, cursor: 'pointer' }
const LABEL_STYLE  = { fontSize: '0.72rem', color: '#71717a', display: 'block', marginBottom: 4 }
const ROW_STYLE    = { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }

// ─── Toggle 组件（与 Config.jsx 开发者开关保持一致） ──────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 10, border: 'none',
        cursor: 'pointer', position: 'relative', padding: 0, flexShrink: 0,
        background: value ? '#E84545' : 'rgba(255,255,255,0.1)',
        transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: value ? 18 : 3,
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  )
}

// ─── ToggleRow 组件 ────────────────────────────────────────────────────────────
function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', color: '#fafafa' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.68rem', color: '#52525b', marginTop: 1 }}>{desc}</div>}
      </div>
      <Toggle value={!!value} onChange={onChange} />
    </div>
  )
}

// ─── 密码输入框（可显隐） ────────────────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        style={{ ...INPUT_STYLE, paddingRight: 36 }}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem',
          color: '#71717a', padding: 2,
        }}
      >{show ? '🙈' : '👁'}</button>
    </div>
  )
}

// ─── 折叠卡片 ──────────────────────────────────────────────────────────────────
function Section({ emoji, title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      background: '#18181b',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, marginBottom: 12, overflow: 'hidden',
    }}>
      {/* 标题行 */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '14px 16px', background: 'transparent',
          border: 'none', cursor: 'pointer', gap: 8,
        }}
      >
        <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fafafa', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{emoji}</span><span>{title}</span>
        </span>
        <span style={{ fontSize: '0.75rem', color: '#52525b', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>
      {/* 内容区 */}
      {open && (
        <div style={{ padding: '4px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── 深层 get/set 工具 ─────────────────────────────────────────────────────────
function deepGet(obj, path, fallback = undefined) {
  return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj) ?? fallback
}

function deepSet(obj, path, value) {
  const clone = JSON.parse(JSON.stringify(obj))
  const keys = path.split('.')
  let cur = clone
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] === undefined || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {}
    cur = cur[keys[i]]
  }
  cur[keys[keys.length - 1]] = value
  return clone
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function Permissions() {
  const navigate = useNavigate()
  const [config, setConfig]       = useState(null)   // 完整配置对象
  const [loading, setLoading]     = useState(true)
  const [dirty, setDirty]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const [feedback, setFeedback]   = useState(null)   // { type: 'success'|'error', text }

  const isDesktop = typeof window !== 'undefined' && !!window.electronAPI

  // ── 加载配置 ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        let data = null
        if (window.electronAPI?.readConfig) {
          data = await window.electronAPI.readConfig()
        } else {
          // 尝试 REST API
          const res = await fetch('/api/v1/config')
          if (res.ok) data = await res.json()
        }
        setConfig(data || {})
      } catch {
        setConfig({})
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── 修改某个路径的值 ──────────────────────────────────────────────────────────
  const update = useCallback((path, value) => {
    setConfig(prev => deepSet(prev || {}, path, value))
    setDirty(true)
  }, [])

  // ── 保存 ──────────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    setFeedback(null)
    try {
      if (window.electronAPI?.saveFullConfig) {
        await window.electronAPI.saveFullConfig(config)
      } else {
        const res = await fetch('/api/v1/config', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        })
        if (!res.ok) throw new Error('API error')
      }
      setDirty(false)
      setFeedback({ type: 'success', text: '✅ 保存成功！配置已更新。' })
    } catch {
      setFeedback({ type: 'error', text: '❌ 保存失败，请检查服务是否运行。' })
    } finally {
      setSaving(false)
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  // ── 非桌面端提示 ───────────────────────────────────────────────────────────────
  if (!isDesktop && !loading && config !== null && Object.keys(config).length === 0) {
    return (
      <div style={{ padding: '16px 16px 80px', background: '#09090b', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button type="button" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '1.1rem' }}>←</button>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fafafa' }}>OpenClaw 权限与高级设置</h1>
        </div>
        <div style={{
          padding: '24px 20px', background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, textAlign: 'center', marginTop: 32,
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💻</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fafafa', marginBottom: 8 }}>请在桌面应用中使用</div>
          <div style={{ fontSize: '0.82rem', color: '#71717a', lineHeight: 1.7 }}>
            权限设置需要读写 OpenClaw 本地配置文件<br />
            请下载并安装龙虾助手桌面版后使用
          </div>
        </div>
      </div>
    )
  }

  // ── get 快捷函数 ───────────────────────────────────────────────────────────────
  const g = (path, fallback) => deepGet(config || {}, path, fallback)

  return (
    <div style={{ padding: '0 0 80px', background: '#09090b', minHeight: '100vh' }}>

      {/* ── 顶栏 ──────────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#09090b', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button type="button" onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '1.1rem', padding: '2px 4px' }}>
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fafafa', flex: 1 }}>
            🔐 OpenClaw 权限与高级设置
          </h1>
        </div>

        {/* 保存按钮 */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: saving ? 'rgba(232,69,69,0.4)' : '#E84545',
            color: '#fff', fontWeight: 700, fontSize: '0.92rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {dirty && !saving && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#fbbf24', display: 'inline-block', flexShrink: 0,
            }} />
          )}
          {saving ? '正在保存…' : dirty ? '保存所有更改（有未保存的修改）' : '💾 保存所有更改'}
        </button>

        {/* 反馈 */}
        {feedback && (
          <div style={{
            marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
            background: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            {feedback.text}
          </div>
        )}
      </div>

      {/* ── 内容区 ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#52525b', fontSize: '0.85rem' }}>
          正在读取配置…
        </div>
      ) : (
        <div style={{ padding: '16px' }}>

          {/* ─────────── 区块1：AI 模型与代理 ─────────── */}
          <Section emoji="🤖" title="AI 模型与代理">
            <div style={{ marginTop: 12 }}>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>主模型 (primary model)</label>
                <input style={INPUT_STYLE}
                  value={g('agents.defaults.model.primary', '')}
                  onChange={e => update('agents.defaults.model.primary', e.target.value)}
                  placeholder="例如：openai/claude-sonnet-4-6"
                />
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>上下文 Token 数</label>
                <input style={INPUT_STYLE} type="number" min={1000}
                  value={g('agents.defaults.contextTokens', 180000)}
                  onChange={e => update('agents.defaults.contextTokens', Number(e.target.value))}
                />
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>最大并发代理数</label>
                <input style={INPUT_STYLE} type="number" min={1} max={32}
                  value={g('agents.defaults.maxConcurrent', 4)}
                  onChange={e => update('agents.defaults.maxConcurrent', Number(e.target.value))}
                />
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>子代理最大并发数</label>
                <input style={INPUT_STYLE} type="number" min={1} max={64}
                  value={g('agents.defaults.subagents.maxConcurrent', 8)}
                  onChange={e => update('agents.defaults.subagents.maxConcurrent', Number(e.target.value))}
                />
              </div>
            </div>
          </Section>

          {/* ─────────── 区块2：工具权限 ─────────── */}
          <Section emoji="🔧" title="工具权限">
            <div style={{ marginTop: 12 }}>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>工具配置方案</label>
                <select style={SELECT_STYLE}
                  value={g('tools.profile', 'full')}
                  onChange={e => update('tools.profile', e.target.value)}
                >
                  <option value="full">full（完整权限）</option>
                  <option value="standard">standard（标准）</option>
                  <option value="minimal">minimal（最小权限）</option>
                </select>
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>命令执行安全级别</label>
                <select style={SELECT_STYLE}
                  value={g('tools.exec.security', 'full')}
                  onChange={e => update('tools.exec.security', e.target.value)}
                >
                  <option value="full">full（完全允许）</option>
                  <option value="allowlist">allowlist（白名单）</option>
                  <option value="deny">deny（禁止）</option>
                </select>
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>命令执行确认模式</label>
                <select style={SELECT_STYLE}
                  value={g('tools.exec.ask', 'off')}
                  onChange={e => update('tools.exec.ask', e.target.value)}
                >
                  <option value="off">off（不确认）</option>
                  <option value="on-miss">on-miss（白名单外才确认）</option>
                  <option value="always">always（始终确认）</option>
                </select>
              </div>
              <ToggleRow
                label="允许提权操作"
                desc="tools.elevated.enabled"
                value={g('tools.elevated.enabled', true)}
                onChange={v => update('tools.elevated.enabled', v)}
              />
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>网页搜索提供商</label>
                <select style={SELECT_STYLE}
                  value={g('tools.web.search.provider', 'grok')}
                  onChange={e => update('tools.web.search.provider', e.target.value)}
                >
                  <option value="grok">grok</option>
                  <option value="brave">brave</option>
                  <option value="none">none（禁用）</option>
                </select>
              </div>
            </div>
          </Section>

          {/* ─────────── 区块3：命令权限 ─────────── */}
          <Section emoji="⌨️" title="命令权限">
            <div style={{ marginTop: 12 }}>
              {[
                { path: 'commands.native',      label: '原生命令',  desc: 'commands.native' },
                { path: 'commands.nativeSkills', label: '技能命令',  desc: 'commands.nativeSkills' },
                { path: 'commands.text',         label: '文本命令',  desc: 'commands.text' },
                { path: 'commands.bash',         label: 'Bash 命令', desc: 'commands.bash' },
                { path: 'commands.config',       label: '配置命令',  desc: 'commands.config' },
                { path: 'commands.debug',        label: '调试命令',  desc: 'commands.debug' },
                { path: 'commands.restart',      label: '重启命令',  desc: 'commands.restart' },
              ].map(item => (
                <ToggleRow
                  key={item.path}
                  label={item.label}
                  desc={item.desc}
                  value={g(item.path, true)}
                  onChange={v => update(item.path, v)}
                />
              ))}
            </div>
          </Section>

          {/* ─────────── 区块4：Telegram 渠道 ─────────── */}
          <Section emoji="📱" title="Telegram 渠道">
            <div style={{ marginTop: 12 }}>
              <ToggleRow
                label="启用 Telegram"
                desc="channels.telegram.enabled"
                value={g('channels.telegram.enabled', true)}
                onChange={v => update('channels.telegram.enabled', v)}
              />
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>Bot Token</label>
                <PasswordInput
                  value={g('channels.telegram.botToken', '')}
                  onChange={v => update('channels.telegram.botToken', v)}
                  placeholder="格式：1234567890:ABCdef…"
                />
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>私信策略</label>
                <select style={SELECT_STYLE}
                  value={g('channels.telegram.dmPolicy', 'allowlist')}
                  onChange={e => update('channels.telegram.dmPolicy', e.target.value)}
                >
                  <option value="allowlist">allowlist（仅允许名单内用户）</option>
                  <option value="open">open（开放）</option>
                  <option value="disabled">disabled（禁用私信）</option>
                </select>
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>允许的用户 ID（每行一个）</label>
                <textarea
                  style={{ ...INPUT_STYLE, resize: 'vertical', height: 72, fontFamily: 'inherit' }}
                  value={(g('channels.telegram.allowFrom', []) || []).join('\n')}
                  onChange={e => {
                    const arr = e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                    update('channels.telegram.allowFrom', arr)
                  }}
                  placeholder="每行填写一个 Telegram 用户 ID"
                />
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>允许的群组 ID（每行一个）</label>
                <textarea
                  style={{ ...INPUT_STYLE, resize: 'vertical', height: 72, fontFamily: 'inherit' }}
                  value={(g('channels.telegram.groupAllowFrom', []) || []).join('\n')}
                  onChange={e => {
                    const arr = e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                    update('channels.telegram.groupAllowFrom', arr)
                  }}
                  placeholder="每行填写一个 Telegram 群组 ID（负数）"
                />
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>流式响应</label>
                <select style={SELECT_STYLE}
                  value={g('channels.telegram.streaming', 'partial')}
                  onChange={e => update('channels.telegram.streaming', e.target.value)}
                >
                  <option value="partial">partial（部分流式）</option>
                  <option value="full">full（全量流式）</option>
                  <option value="off">off（关闭）</option>
                </select>
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>反应级别</label>
                <select style={SELECT_STYLE}
                  value={g('channels.telegram.reactionLevel', 'extensive')}
                  onChange={e => update('channels.telegram.reactionLevel', e.target.value)}
                >
                  <option value="extensive">extensive（丰富）</option>
                  <option value="standard">standard（标准）</option>
                  <option value="off">off（关闭）</option>
                </select>
              </div>
              <ToggleRow
                label="允许配置写入"
                desc="channels.telegram.configWrites"
                value={g('channels.telegram.configWrites', true)}
                onChange={v => update('channels.telegram.configWrites', v)}
              />
              <div style={{ marginTop: 8, marginBottom: 4, fontSize: '0.65rem', fontWeight: 700, color: '#3f3f46', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Bot 操作权限</div>
              <ToggleRow
                label="启用 Emoji 反应"
                desc="channels.telegram.actions.reactions"
                value={g('channels.telegram.actions.reactions', true)}
                onChange={v => update('channels.telegram.actions.reactions', v)}
              />
              <ToggleRow
                label="启用发送消息"
                desc="channels.telegram.actions.sendMessage"
                value={g('channels.telegram.actions.sendMessage', true)}
                onChange={v => update('channels.telegram.actions.sendMessage', v)}
              />
              <ToggleRow
                label="启用删除消息"
                desc="channels.telegram.actions.deleteMessage"
                value={g('channels.telegram.actions.deleteMessage', true)}
                onChange={v => update('channels.telegram.actions.deleteMessage', v)}
              />
            </div>
          </Section>

          {/* ─────────── 区块5：Gateway 服务 ─────────── */}
          <Section emoji="🌐" title="Gateway 服务">
            <div style={{ marginTop: 12 }}>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>端口号</label>
                <input style={INPUT_STYLE} type="number" min={1024} max={65535}
                  value={g('gateway.port', 18789)}
                  onChange={e => update('gateway.port', Number(e.target.value))}
                />
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>运行模式</label>
                <select style={SELECT_STYLE}
                  value={g('gateway.mode', 'local')}
                  onChange={e => update('gateway.mode', e.target.value)}
                >
                  <option value="local">local（本地）</option>
                  <option value="remote">remote（远程）</option>
                </select>
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>绑定地址</label>
                <select style={SELECT_STYLE}
                  value={g('gateway.bind', 'loopback')}
                  onChange={e => update('gateway.bind', e.target.value)}
                >
                  <option value="loopback">loopback（仅本机 127.0.0.1）</option>
                  <option value="lan">lan（局域网）</option>
                  <option value="all">all（所有接口）</option>
                </select>
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>鉴权模式</label>
                <select style={SELECT_STYLE}
                  value={g('gateway.auth.mode', 'token')}
                  onChange={e => update('gateway.auth.mode', e.target.value)}
                >
                  <option value="token">token（Token 鉴权）</option>
                  <option value="none">none（无鉴权）</option>
                </select>
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>鉴权 Token</label>
                <PasswordInput
                  value={g('gateway.auth.token', '')}
                  onChange={v => update('gateway.auth.token', v)}
                  placeholder="Gateway API Token"
                />
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>Tailscale 模式</label>
                <select style={SELECT_STYLE}
                  value={g('gateway.tailscale.mode', 'off')}
                  onChange={e => update('gateway.tailscale.mode', e.target.value)}
                >
                  <option value="off">off（关闭）</option>
                  <option value="on">on（开启）</option>
                  <option value="auto">auto（自动）</option>
                </select>
              </div>
            </div>
          </Section>

          {/* ─────────── 区块6：消息行为 ─────────── */}
          <Section emoji="💬" title="消息行为">
            <div style={{ marginTop: 12 }}>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>私信范围</label>
                <select style={SELECT_STYLE}
                  value={g('session.dmScope', 'per-channel-peer')}
                  onChange={e => update('session.dmScope', e.target.value)}
                >
                  <option value="per-channel-peer">per-channel-peer（每个渠道独立）</option>
                  <option value="global">global（全局共享）</option>
                </select>
              </div>
              <div style={ROW_STYLE}>
                <label style={LABEL_STYLE}>消息确认反应范围</label>
                <select style={SELECT_STYLE}
                  value={g('messages.ackReactionScope', 'group-mentions')}
                  onChange={e => update('messages.ackReactionScope', e.target.value)}
                >
                  <option value="group-mentions">group-mentions（群里@才反应）</option>
                  <option value="all">all（所有消息）</option>
                  <option value="none">none（不反应）</option>
                </select>
              </div>
            </div>
          </Section>

          {/* 底部提示 */}
          <div style={{ marginTop: 16, fontSize: '0.68rem', color: '#3f3f46', textAlign: 'center', lineHeight: 1.6 }}>
            修改后请点顶部「保存所有更改」按钮写入配置文件<br/>
            部分配置修改后需要重启 OpenClaw 才会生效
          </div>
        </div>
      )}
    </div>
  )
}
