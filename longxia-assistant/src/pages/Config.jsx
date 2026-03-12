import React, { useState, useEffect } from 'react'
import HelpButton from '../components/HelpButton.jsx'
import { getConfig, saveConfig } from '../api.js'

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
  const [form, setForm]           = useState(DEFAULT_FORM)
  const [showKey, setShowKey]     = useState(false) // 专属口令显示/隐藏
  const [showTgToken, setShowTgToken] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(true)
  const [apiAvailable, setApiAvailable] = useState(false)
  const [feedback, setFeedback]   = useState(null) // 保存结果反馈

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

        </form>
      )}
    </div>
  )
}

export default Config
