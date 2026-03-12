// =============================================
// 🦞 龙虾助手 — OpenClaw Gateway API 封装
// =============================================

let _gatewayUrl = null
let _gatewayToken = null

async function getGatewayInfo() {
  if (_gatewayUrl) return { url: _gatewayUrl, token: _gatewayToken }
  if (window.electronAPI?.gatewayUrl) {
    _gatewayUrl = await window.electronAPI.gatewayUrl()
    _gatewayToken = await window.electronAPI.gatewayToken()
  } else {
    _gatewayUrl = 'http://localhost:18789'
    _gatewayToken = ''
  }
  return { url: _gatewayUrl, token: _gatewayToken }
}

async function req(path, opts = {}) {
  const { url, token } = await getGatewayInfo()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  }
  const res = await fetch(`${url}${path}`, { ...opts, headers })
  if (!res.ok) throw new Error(`服务器返回 ${res.status}`)
  return res.json()
}

// ── 状态检测 ──
// OpenClaw Gateway 健康检查端点
export async function getStatus() {
  const { url, token } = await getGatewayInfo()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  // 先尝试 /api/v1/status，失败则尝试 /health
  try {
    const res = await fetch(`${url}/api/v1/status`, { headers })
    if (res.ok) {
      const data = await res.json()
      return {
        running: true,
        todayMessages: data.stats?.messagesTotal ?? 0,
        model: data.model ?? data.agents?.defaults?.model ?? '未知',
        channels: data.channels ?? [],
        version: data.version ?? '--',
      }
    }
  } catch {}
  // 回退：HTTP 探测
  try {
    const res = await fetch(`${url}/health`, { headers })
    if (res.ok || res.status === 404) {
      return { running: true, todayMessages: 0, model: '--', channels: [], version: '--' }
    }
  } catch {}
  throw new Error('无法连接到龙虾助手服务')
}

// ── 配置读取 ──
// 读取 openclaw.json，通过 Electron IPC（electronAPI.readConfig），web 模式走本地 fallback
export async function getConfig() {
  if (window.electronAPI?.readConfig) {
    const cfg = await window.electronAPI.readConfig()
    if (!cfg) throw new Error('配置文件不存在')
    // 从 openclaw.json 结构中提取前端需要的字段
    const providers = cfg.models?.providers ?? {}
    const providerKey = Object.keys(providers)[0] ?? 'openai'
    const apiKey = providers[providerKey]?.apiKey ?? ''
    const model = cfg.agents?.defaults?.model ?? ''
    const telegramToken = cfg.channels?.telegram?.botToken ?? ''
    // 推断 provider id（从 model 字符串前缀）
    let provider = 'openai'
    if (model.startsWith('deepseek')) provider = 'deepseek'
    else if (model.startsWith('anthropic')) provider = 'anthropic'
    else if (model.startsWith('qwen') || model.startsWith('alibaba')) provider = 'tongyi'
    else if (model.startsWith('openrouter')) provider = 'openrouter'
    return { provider, apiKey, model, telegramToken }
  }
  throw new Error('配置只能在桌面端读取')
}

// ── 配置保存 ──
// 通过 Electron IPC 写入 openclaw.json
export async function saveConfig(data) {
  if (window.electronAPI?.saveConfig) {
    const result = await window.electronAPI.saveConfig(
      data.provider ?? 'openai',
      data.apiKey ?? '',
      data.telegramToken ?? ''
    )
    if (result && !result.ok) throw new Error(result.error ?? '保存失败')
    return result
  }
  throw new Error('配置只能在桌面端保存')
}

// ── 聊天 ──
// 通过 OpenClaw Gateway sessions API 发送消息
export async function sendChat(message) {
  const { url, token } = await getGatewayInfo()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  // OpenClaw sessions/send API
  try {
    const res = await fetch(`${url}/api/v1/sessions/default/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
    })
    if (res.ok) {
      const data = await res.json()
      return { reply: data.reply ?? data.message ?? data.content ?? '（无回复）' }
    }
  } catch {}
  // fallback：尝试旧版接口格式
  const res = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error(`服务器返回 ${res.status}`)
  const data = await res.json()
  return { reply: data.reply ?? data.message ?? data.content ?? '（无回复）' }
}

// ── Cron 任务（自动任务） ──
// 通过 OpenClaw Gateway cron API 管理定时任务
export async function listCronJobs() {
  return req('/api/v1/cron/jobs')
}

export async function createCronJob({ name, cron, message }) {
  return req('/api/v1/cron/jobs', {
    method: 'POST',
    body: JSON.stringify({
      name,
      schedule: { kind: 'cron', expr: cron },
      payload: { kind: 'agentTurn', message: message || name },
      sessionTarget: 'isolated',
      enabled: true,
    }),
  })
}

export async function deleteCronJob(jobId) {
  return req(`/api/v1/cron/jobs/${jobId}`, { method: 'DELETE' })
}

// ── 功能插件（Skills）──
export const getInstalledSkills = () => req('/api/v1/skills')
export const installSkill   = (skillId) =>
  req('/api/v1/skills/install',   { method: 'POST', body: JSON.stringify({ skillId }) })
export const uninstallSkill = (skillId) =>
  req('/api/v1/skills/uninstall', { method: 'POST', body: JSON.stringify({ skillId }) })
