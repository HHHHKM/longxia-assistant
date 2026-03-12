import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const PROVIDER_GROUPS = [
  {
    id: 'deepseek',
    name: 'DeepSeek（国产推荐）',
    emoji: '🐳',
    models: [
      { id: 'deepseek/deepseek-chat', name: 'deepseek-chat', desc: '综合能力强，适合日常对话' },
      { id: 'deepseek/deepseek-reasoner', name: 'deepseek-reasoner', desc: '推理增强，适合复杂问题' },
    ],
  },
  {
    id: 'qwen',
    name: '通义千问（阿里）',
    emoji: '☁️',
    models: [
      { id: 'qwen/qwen-turbo', name: 'qwen-turbo', desc: '速度快，适合简单问答' },
      { id: 'qwen/qwen-plus', name: 'qwen-plus', desc: '均衡，适合日常使用' },
      { id: 'qwen/qwen-max', name: 'qwen-max', desc: '最强，适合复杂任务' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI（国际）',
    emoji: '🤖',
    models: [
      { id: 'openai/gpt-4o-mini', name: 'gpt-4o-mini', desc: '快速，适合简单任务' },
      { id: 'openai/gpt-4o', name: 'gpt-4o', desc: '综合最强，全能选手' },
    ],
  },
  {
    id: 'siliconflow',
    name: '硅基流动（有免费额度）',
    emoji: '🆓',
    models: [
      { id: 'siliconflow/Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B-Instruct', desc: '注册即有免费额度，适合体验' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic（Claude）',
    emoji: '🧠',
    models: [
      { id: 'anthropic/claude-3-5-haiku', name: 'claude-3-5-haiku', desc: '速度快，日常使用' },
      { id: 'anthropic/claude-sonnet-4', name: 'claude-sonnet-4', desc: '综合能力强' },
    ],
  },
]

export default function ModelControl() {
  const [currentModel, setCurrentModel] = useState('')
  const [currentApiKey, setCurrentApiKey] = useState('')
  const [currentTgToken, setCurrentTgToken] = useState('')
  const [switching, setSwitching] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    async function load() {
      try {
        if (window.electronAPI?.readConfig) {
          const cfg = await window.electronAPI.readConfig()
          if (cfg) {
            const providers = cfg.models?.providers ?? {}
            const provKey = Object.keys(providers)[0] ?? ''
            setCurrentApiKey(providers[provKey]?.apiKey ?? '')
            setCurrentModel(cfg.agents?.defaults?.model ?? '')
            setCurrentTgToken(cfg.channels?.telegram?.botToken ?? '')
          }
        }
      } catch {}
    }
    load()
  }, [])

  async function handleSwitch(group, model) {
    if (!window.electronAPI?.saveConfig) {
      setSuccessMsg({ type: 'warn', text: '请在桌面端使用此功能' })
      setTimeout(() => setSuccessMsg(null), 3000)
      return
    }
    setSwitching(model.id)
    try {
      await window.electronAPI.saveConfig(group.id, currentApiKey, currentTgToken)
      // 额外保存 model 到配置
      try {
        await fetch('http://localhost:18789/api/v1/config', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model.id })
        })
      } catch {}
      setCurrentModel(model.id)
      setSuccessMsg({ type: 'success', text: `✅ 已切换到 ${model.name}，下次对话生效` })
    } catch {
      setSuccessMsg({ type: 'error', text: '❌ 切换失败，请重试' })
    } finally {
      setSwitching(null)
      setTimeout(() => setSuccessMsg(null), 3500)
    }
  }

  function toggleGroup(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const currentModelName = currentModel.split('/').pop() || '未知'
  const currentGroup = PROVIDER_GROUPS.find(g => PROVIDER_GROUPS.some(() => currentModel.startsWith(g.id)))

  return (
    <div className="model-page">
      <h1 className="page-title">🧠 AI 大脑管理</h1>
      <p className="page-subtitle">切换不同的 AI 模型，找到最适合你的那个</p>

      {successMsg && (
        <div className={`task-feedback ${successMsg.type === 'success' ? 'success' : 'warning'}`}>
          {successMsg.text}
        </div>
      )}

      {/* 当前模型 */}
      <div className="model-current-card">
        <div className="model-current-label">当前使用的模型</div>
        {currentModel ? (
          <>
            <div className="model-current-name">{currentModelName}</div>
            <div className="model-current-full">{currentModel}</div>
            <div className="model-current-badge">🟢 使用中</div>
          </>
        ) : (
          <div className="model-current-empty">点下方按钮查看可用模型</div>
        )}
      </div>

      {/* 分组列表 */}
      {PROVIDER_GROUPS.map(group => (
        <div key={group.id} className="model-group">
          <button
            className="model-group-header"
            onClick={() => toggleGroup(group.id)}
          >
            <span>{group.emoji} {group.name}</span>
            <span>{expanded[group.id] ? '▲' : '▼'}</span>
          </button>
          {expanded[group.id] && (
            <div className="model-group-body">
              {group.models.map(model => (
                <div key={model.id} className={`model-card ${currentModel === model.id ? 'model-card--active' : ''}`}>
                  <div className="model-card-info">
                    <div className="model-card-name">{model.name}</div>
                    <div className="model-card-desc">{model.desc}</div>
                  </div>
                  <button
                    className={`model-switch-btn ${currentModel === model.id ? 'model-switch-btn--current' : ''}`}
                    disabled={switching === model.id || currentModel === model.id}
                    onClick={() => handleSwitch(group, model)}
                  >
                    {switching === model.id ? '切换中...' : currentModel === model.id ? '✓ 当前' : '使用这个'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="tasks-tip-box" style={{ marginTop: 24 }}>
        <p>💡 <strong>不知道选哪个？</strong>没关系，默认的就很好用。有问题随时可以换。</p>
      </div>
    </div>
  )
}
