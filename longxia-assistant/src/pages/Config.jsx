import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import HelpButton from '../components/HelpButton.jsx'
import { getConfig, saveConfig, getStatus } from '../api.js'

// ── 服务商与对应可选模型 ──
const PROVIDERS = {
  openai:     { label: 'OpenAI（ChatGPT）', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  anthropic:  { label: 'Anthropic（Claude）', models: ['claude-sonnet-4', 'claude-opus-4', 'claude-haiku-3-5'] },
  deepseek:   { label: 'DeepSeek（国产）', models: ['deepseek-chat', 'deepseek-reasoner'] },
  tongyi:     { label: '通义千问（阿里云）', models: ['qwen-turbo', 'qwen-plus', 'qwen-max'] },
  openrouter: { label: 'OpenRouter（聚合平台）', models: ['openai/gpt-4o', 'anthropic/claude-sonnet-4', 'deepseek/deepseek-chat'] },
}

// 默认表单值
const DEFAULT_FORM = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o',
  telegramToken: '',
}

// 设置页 — 可视化配置表单
// 代替直接编辑 JSON，适合不懂代码的用户
function Config() {
  const navigate = useNavigate()
  const [form, setForm]           = useState(DEFAULT_FORM)
  const [showKey, setShowKey]     = useState(false)
  const [showTgToken, setShowTgToken] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(true)
  const [apiAvailable, setApiAvailable] = useState(false)
  const [feedback, setFeedback]   = useState(null)
  // 一键检测状态
  const [devTapCount, setDevTapCount] = useState(0)
  const [devModeEnabled, setDevModeEnabled] = useState(
    () => localStorage.getItem('longxia_dev_enabled') === 'true'
  )
  // 权限/高级设置
  const [advSettings, setAdvSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('longxia_adv_settings') || '{}') } catch { return {} }
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  function saveAdvSettings(patch) {
    const next = { ...advSettings, ...patch }
    setAdvSettings(next)
    localStorage.setItem('longxia_adv_settings', JSON.stringify(next))
  }
  function toggleDevMode(v) {
    setDevModeEnabled(v)
    localStorage.setItem('longxia_dev_enabled', String(v))
  }
  const [detecting, setDetecting]     = useState(false)
  const [detectResult, setDetectResult] = useState(null) // null | 'ok' | 'fail'
  const [detectInfo, setDetectInfo]   = useState(null)   // { version, model }

  // 检测是否在 Electron 桌面环境
  const isDesktop = typeof window !== 'undefined' && !!window.electronAPI

  // 加载现有配置
  useEffect(() => {
    async function load() {
      try {
        const data = await getConfig()
        setForm({
          provider:      data.provider      ?? 'openai',
          apiKey:        data.apiKey        ?? '',
          model:         data.model         ?? 'gpt-4o',
          telegramToken: data.telegramToken ?? '',
        })
        setApiAvailable(true)
      } catch {
        // 非桌面端或服务未启动
        setApiAvailable(false)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // 修改表单字段
  function update(key, value) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      // 切换服务商时，自动选第一个模型
      if (key === 'provider') {
        next.model = PROVIDERS[value]?.models[0] ?? ''
      }
      return next
    })
  }

  // 一键检测并导入本机 OpenClaw 配置
  async function handleDetect() {
    setDetecting(true)
    setDetectResult(null)
    setDetectInfo(null)
    try {
      // 1. 检测服务是否在跑
      const status = await getStatus()
      // 2. 读取现有配置
      let cfg = null
      try { cfg = await getConfig() } catch {}
      // 3. 填入表单
      if (cfg) {
        setForm({
          provider:      cfg.provider      ?? 'openai',
          apiKey:        cfg.apiKey        ?? '',
          model:         cfg.model         ?? 'gpt-4o',
          telegramToken: cfg.telegramToken ?? '',
        })
      }
      setDetectInfo({ version: status.version ?? '--', model: status.model ?? cfg?.model ?? '--' })
      setDetectResult('ok')
      setApiAvailable(true)
    } catch {
      setDetectResult('fail')
    } finally {
      setDetecting(false)
    }
  }

  // 保存配置
  async function handleSave(e) {
    e.preventDefault()
    setFeedback(null)
    setSaving(true)
    try {
      await saveConfig(form)
      setFeedback({ type: 'success', text: '✅ 保存成功！配置已更新，立即生效。' })
    } catch {
      setFeedback({ type: 'error', text: '❌ 保存失败，请先启动龙虾助手服务再试。' })
    } finally {
      setSaving(false)
    }
  }

  const models = PROVIDERS[form.provider]?.models ?? []

  // 非桌面端提示
  if (!isDesktop) return (
    <div className="config-page page-padding">
      <h1 className="page-title">设置</h1>
      <div style={{
        marginTop: 32, padding: '24px 20px',
        background: 'rgba(245,158,11,0.07)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 12, textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💻</div>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fafafa', marginBottom: 8 }}>
          请在桌面应用中使用
        </div>
        <div style={{ fontSize: '0.82rem', color: '#71717a', lineHeight: 1.7 }}>
          设置功能需要读写本地配置文件<br/>
          请下载并安装龙虾助手桌面版后使用
        </div>
      </div>
    </div>
  )

  return (
    <div className="config-page">
      <h1 className="page-title">⚙️ 设置</h1>

      {/* 服务未启动提示 */}
      {!apiAvailable && !loading && (
        <div className="alert alert-warning">
          <span className="alert-icon">⚠️</span>
          <span>
            <strong>请先启动龙虾助手服务</strong>，才能读取和保存配置。
            启动后刷新此页面。下方表单可以先填写，但暂时无法保存。
          </span>
        </div>
      )}

      {loading && (
        <div className="loading-center">
          <span className="spinner" />
          <span>正在读取配置……</span>
        </div>
      )}

      {!loading && (
        <form onSubmit={handleSave}>

          {/* ── 一键检测并连接 ── */}
          <div style={{
            background: '#18181b',
            border: `1px solid ${detectResult === 'ok' ? 'rgba(34,197,94,0.25)' : detectResult === 'fail' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, padding: '16px 18px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fafafa', marginBottom: 3 }}>
                  已安装过 OpenClaw？
                </div>
                <div style={{ fontSize: '0.75rem', color: '#71717a' }}>
                  一键检测本机服务，自动导入现有配置
                </div>
              </div>
              <button
                type="button"
                onClick={handleDetect}
                disabled={detecting}
                style={{
                  flexShrink: 0,
                  padding: '9px 16px', borderRadius: 8, border: 'none',
                  background: detecting ? 'rgba(232,69,69,0.2)' : '#E84545',
                  color: detecting ? 'rgba(255,255,255,0.4)' : '#fff',
                  fontWeight: 600, fontSize: '0.82rem', cursor: detecting ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {detecting ? '🔍 检测中…' : '🔍 一键检测'}
              </button>
            </div>

            {/* 检测结果 */}
            {detectResult === 'ok' && detectInfo && (
              <div style={{
                marginTop: 12, paddingTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: '1rem' }}>✅</span>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#86efac', fontWeight: 600 }}>
                    已连接！配置已自动导入
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#52525b', marginTop: 2 }}>
                    服务版本 {detectInfo.version} · 当前模型 {detectInfo.model}
                  </div>
                </div>
              </div>
            )}
            {detectResult === 'fail' && (
              <div style={{
                marginTop: 12, paddingTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: '1rem' }}>❌</span>
                <div style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
                  未检测到本机服务，请手动填写下方配置
                </div>
              </div>
            )}
          </div>

          {/* ── AI 服务商 ── */}
          <div className="form-group">
            <label className="form-label">
              🏢 AI 服务商
              <HelpButton
                title="AI 服务商是什么？"
                content={
                  '提供 AI 大脑的公司。\n\n' +
                  '• OpenAI —— 做 ChatGPT 的公司，全球最知名\n' +
                  '• Anthropic —— 做 Claude 的公司，很安全\n' +
                  '• DeepSeek —— 国产 AI，便宜好用\n' +
                  '• 通义千问 —— 阿里巴巴出品，支持中文\n' +
                  '• OpenRouter —— 聚合平台，一个口令用多家\n\n' +
                  '不知道选哪个？推荐 DeepSeek（便宜）或 OpenAI（稳定）。'
                }
              />
            </label>
            <select
              className="form-select"
              value={form.provider}
              onChange={e => update('provider', e.target.value)}
            >
              {Object.entries(PROVIDERS).map(([key, p]) => (
                <option key={key} value={key}>{p.label}</option>
              ))}
            </select>
            <div className="form-hint">选择您购买了账号的那家公司</div>
          </div>

          {/* ── 专属口令（API Key） ── */}
          <div className="form-group">
            <label className="form-label">
              🔑 专属口令（API Key）
              <HelpButton
                title="专属口令是什么？"
                content={
                  '专属口令就像一把"钥匙"，用来证明您有权使用 AI 服务。\n\n' +
                  '获取方式：\n' +
                  '1. 登录您选的 AI 服务商官网\n' +
                  '2. 找到"API Key"或"密钥"选项\n' +
                  '3. 点"创建"并复制这串字符\n' +
                  '4. 粘贴到这里\n\n' +
                  '⚠️ 这个口令要保密，不要告诉别人！'
                }
              />
            </label>
            <div className="input-wrapper">
              <input
                className="form-input"
                type={showKey ? 'text' : 'password'}
                placeholder="请粘贴您的专属口令，例如：sk-xxxxxxxx"
                value={form.apiKey}
                onChange={e => update('apiKey', e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="input-eye-btn"
                onClick={() => setShowKey(v => !v)}
                title={showKey ? '隐藏口令' : '显示口令'}
              >
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
            <div className="form-hint">
              点右边的眼睛图标可以显示/隐藏内容。口令一般以 <code style={{color:'var(--lobster-red)'}}>sk-</code> 开头。
            </div>
          </div>

          {/* ── 模型选择 ── */}
          <div className="form-group">
            <label className="form-label">
              🧠 AI 模型
              <HelpButton
                title="AI 模型是什么？"
                content={
                  '同一家公司可能有多个不同版本的 AI，就像手机有"标准版"和"Pro版"。\n\n' +
                  '一般来说：\n' +
                  '• 名字带 "mini" / "turbo" / "haiku" ——速度快、便宜，适合日常聊天\n' +
                  '• 名字带 "plus" / "sonnet" / "pro" —— 更聪明，适合复杂任务\n' +
                  '• 名字带 "max" / "opus" —— 最强大，也最贵\n\n' +
                  '不确定？选第一个就好。'
                }
              />
            </label>
            <select
              className="form-select"
              value={form.model}
              onChange={e => update('model', e.target.value)}
            >
              {models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="form-hint">根据您的服务商自动推荐，直接用默认值即可</div>
          </div>

          <hr className="divider" />

          {/* ── Telegram 机器人令牌 ── */}
          <div className="form-group">
            <label className="form-label">
              📱 Telegram 机器人令牌
              <HelpButton
                title="Telegram 机器人令牌是什么？"
                content={
                  '如果您想在 Telegram 上跟龙虾助手聊天，需要先创建一个"机器人"。\n\n' +
                  '创建步骤：\n' +
                  '1. 打开 Telegram，搜索 @BotFather\n' +
                  '2. 发送 /newbot，按提示起名字\n' +
                  '3. 创建成功后，BotFather 会发给您一串令牌\n' +
                  '4. 复制那串令牌，粘贴到这里\n\n' +
                  '如果您不用 Telegram，这里可以不填。'
                }
              />
            </label>
            <div className="input-wrapper">
              <input
                className="form-input"
                type={showTgToken ? 'text' : 'password'}
                placeholder="不使用 Telegram 可留空"
                value={form.telegramToken}
                onChange={e => update('telegramToken', e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="input-eye-btn"
                onClick={() => setShowTgToken(v => !v)}
                title={showTgToken ? '隐藏令牌' : '显示令牌'}
              >
                {showTgToken ? '🙈' : '👁'}
              </button>
            </div>
            <div className="form-hint">格式示例：1234567890:ABCdefGHIjklMNOpqrsTUVwxyz</div>
          </div>

          {/* ── 保存按钮 ── */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ width: '100%', fontSize: '1.15rem', padding: '18px' }}
          >
            {saving
              ? <><span className="spinner" style={{ width: 18, height: 18 }} /> 正在保存……</>
              : '💾 保存设置'}
          </button>

          {/* 保存结果反馈（大字醒目） */}
          {feedback && (
            <div className={`feedback-msg ${feedback.type}`}>
              {feedback.text}
            </div>
          )}

          {/* ── OpenClaw 权限与高级设置跳转 ── */}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button type="button" onClick={() => navigate('/permissions')}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#71717a', fontSize: '0.78rem', padding: '8px 16px', cursor: 'pointer' }}>
              🔐 OpenClaw 权限与高级设置 →
            </button>
          </div>

          {/* ── 高级设置折叠区 ── */}
          <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#52525b', fontSize: '0.78rem', padding: '4px 0',
              }}
            >
              <span>{showAdvanced ? '▼' : '▶'}</span>
              <span>高级设置 / 权限管理</span>
            </button>

            {showAdvanced && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* AI 行为 */}
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3f3f46', letterSpacing: '0.08em', textTransform: 'uppercase' }}>🤖 AI 行为</div>
                {[
                  { key: 'systemPrompt', label: 'System Prompt（AI人设）', placeholder: '例如：你是专业产品经理助手，回答要简洁', type: 'textarea' },
                  { key: 'contextLimit', label: '对话上下文条数（默认6）', placeholder: '数字，例如：10' },
                  { key: 'maxTokens',    label: '单次最大 Token 数', placeholder: '数字，例如：2000' },
                  { key: 'temperature', label: '温度 Temperature（0~2，默认1）', placeholder: '例如：0.7' },
                ].map(item => (
                  <div key={item.key}>
                    <label style={{ fontSize: '0.72rem', color: '#71717a', display: 'block', marginBottom: 4 }}>{item.label}</label>
                    {item.type === 'textarea'
                      ? <textarea
                          style={{ width: '100%', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fafafa', fontSize: '0.8rem', padding: '7px 10px', outline: 'none', resize: 'vertical', height: 68, boxSizing: 'border-box', fontFamily: 'inherit' }}
                          value={advSettings[item.key] || ''}
                          onChange={e => saveAdvSettings({ [item.key]: e.target.value })}
                          placeholder={item.placeholder}
                        />
                      : <input
                          style={{ width: '100%', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fafafa', fontSize: '0.8rem', padding: '7px 10px', outline: 'none', boxSizing: 'border-box' }}
                          value={advSettings[item.key] || ''}
                          onChange={e => saveAdvSettings({ [item.key]: e.target.value })}
                          placeholder={item.placeholder}
                        />
                    }
                  </div>
                ))}

                {/* 网络 */}
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3f3f46', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>🌐 网络</div>
                {[
                  { key: 'gatewayUrl',  label: '自定义 Gateway 地址', placeholder: 'http://localhost:18789' },
                  { key: 'proxyUrl',    label: 'HTTP 代理地址（可选）', placeholder: 'http://127.0.0.1:7890' },
                  { key: 'reqTimeout',  label: '请求超时秒数（默认30）', placeholder: '例如：60' },
                ].map(item => (
                  <div key={item.key}>
                    <label style={{ fontSize: '0.72rem', color: '#71717a', display: 'block', marginBottom: 4 }}>{item.label}</label>
                    <input
                      style={{ width: '100%', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fafafa', fontSize: '0.8rem', padding: '7px 10px', outline: 'none', boxSizing: 'border-box' }}
                      value={advSettings[item.key] || ''}
                      onChange={e => saveAdvSettings({ [item.key]: e.target.value })}
                      placeholder={item.placeholder}
                    />
                  </div>
                ))}

                {/* 渠道权限 */}
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3f3f46', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>📱 渠道权限</div>
                {[
                  { key: 'telegramEnabled', label: 'Telegram 渠道', desc: '允许通过 Telegram Bot 收发消息' },
                  { key: 'webhookEnabled',  label: 'Webhook 推送', desc: '任务执行结果推送到指定 URL' },
                  { key: 'cronEnabled',     label: '定时任务', desc: '允许创建和执行定时任务' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', color: '#fafafa' }}>{item.label}</div>
                      <div style={{ fontSize: '0.68rem', color: '#52525b' }}>{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveAdvSettings({ [item.key]: !(advSettings[item.key] !== false) })}
                      style={{
                        flexShrink: 0, marginLeft: 12, padding: '5px 12px',
                        borderRadius: 6, border: 'none', fontWeight: 600,
                        fontSize: '0.75rem', cursor: 'pointer',
                        background: advSettings[item.key] !== false ? '#E84545' : 'rgba(255,255,255,0.06)',
                        color: advSettings[item.key] !== false ? '#fff' : '#71717a',
                      }}
                    >{advSettings[item.key] !== false ? '开启' : '关闭'}</button>
                  </div>
                ))}

                {/* 通知 */}
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3f3f46', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>🔔 通知</div>
                {[
                  { key: 'notifyOnTask',  label: '任务执行通知', desc: '定时任务完成时通知' },
                  { key: 'notifyOnError', label: '错误提醒', desc: '服务异常时通知' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', color: '#fafafa' }}>{item.label}</div>
                      <div style={{ fontSize: '0.68rem', color: '#52525b' }}>{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveAdvSettings({ [item.key]: !advSettings[item.key] })}
                      style={{
                        flexShrink: 0, marginLeft: 12, padding: '5px 12px',
                        borderRadius: 6, border: 'none', fontWeight: 600,
                        fontSize: '0.75rem', cursor: 'pointer',
                        background: advSettings[item.key] ? '#E84545' : 'rgba(255,255,255,0.06)',
                        color: advSettings[item.key] ? '#fff' : '#71717a',
                      }}
                    >{advSettings[item.key] ? '开启' : '关闭'}</button>
                  </div>
                ))}

                {/* 安全 */}
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3f3f46', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>🔒 安全</div>
                {[
                  { key: 'accessPassword', label: '访问密码（留空不启用）', placeholder: '设置后打开应用需要输入密码' },
                  { key: 'authToken',      label: 'API 鉴权 Token（留空不启用）', placeholder: '用于 API 接口鉴权' },
                ].map(item => (
                  <div key={item.key}>
                    <label style={{ fontSize: '0.72rem', color: '#71717a', display: 'block', marginBottom: 4 }}>{item.label}</label>
                    <input
                      type="password"
                      style={{ width: '100%', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fafafa', fontSize: '0.8rem', padding: '7px 10px', outline: 'none', boxSizing: 'border-box' }}
                      value={advSettings[item.key] || ''}
                      onChange={e => saveAdvSettings({ [item.key]: e.target.value })}
                      placeholder={item.placeholder}
                    />
                  </div>
                ))}

                {/* 数据 */}
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3f3f46', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>💾 数据</div>
                {[
                  { key: 'chatRetainDays', label: '聊天记录保留天数（0=永久）', placeholder: '例如：30' },
                ].map(item => (
                  <div key={item.key}>
                    <label style={{ fontSize: '0.72rem', color: '#71717a', display: 'block', marginBottom: 4 }}>{item.label}</label>
                    <input
                      style={{ width: '100%', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fafafa', fontSize: '0.8rem', padding: '7px 10px', outline: 'none', boxSizing: 'border-box' }}
                      value={advSettings[item.key] || ''}
                      onChange={e => saveAdvSettings({ [item.key]: e.target.value })}
                      placeholder={item.placeholder}
                    />
                  </div>
                ))}

                <div style={{ fontSize: '0.65rem', color: '#3f3f46', paddingTop: 4 }}>
                  ⚠️ 以上设置修改后立即保存到本地，无需点「保存设置」按钮
                </div>
              </div>
            )}
          </div>

        </form>
      )}

    {/* ── 开发者开关 + 关于 ── */}
    <div style={{ textAlign: 'center', marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => navigate('/about')}
        style={{ background: 'transparent', border: 'none', color: '#3f3f46', fontSize: '0.72rem', cursor: 'pointer', letterSpacing: '0.04em' }}
      >
        关于龙虾助手 v0.1.0
      </button>

      {/* 开发者开关 */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <span style={{ fontSize: '0.72rem', color: devModeEnabled ? '#71717a' : '#3f3f46' }}>开发者模式</span>
        <button
          type="button"
          onClick={() => toggleDevMode(!devModeEnabled)}
          style={{
            width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative', padding: 0,
            background: devModeEnabled ? '#E84545' : 'rgba(255,255,255,0.1)', transition: 'background 0.2s',
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: devModeEnabled ? 18 : 3,
            width: 14, height: 14, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s', display: 'block',
          }} />
        </button>
      </div>

      {/* 开发者模式入口按钮 */}
      {devModeEnabled && (
        <button
          type="button"
          onClick={() => navigate('/devmode')}
          style={{
            marginTop: 10, padding: '7px 18px', borderRadius: 8,
            border: '1px solid rgba(232,69,69,0.3)',
            background: 'rgba(232,69,69,0.08)', color: '#f87171',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          🛠 进入开发者模式 →
        </button>
      )}

      {/* 隐藏连点触发（仍然保留） */}
      <div
        onClick={() => {
          setDevTapCount(prev => {
            const next = prev + 1
            if (next >= 5) { navigate('/devmode'); return 0 }
            if (next >= 3) setTimeout(() => setDevTapCount(0), 3000)
            return next
          })
        }}
        style={{ marginTop: 4, fontSize: '0.55rem', color: devTapCount >= 3 ? '#3f3f46' : 'transparent', cursor: 'default', userSelect: 'none' }}
      >
        {devTapCount >= 3 ? `再点 ${5 - devTapCount} 次` : '·'}
      </div>
    </div>
    </div>
  )
}

export default Config
