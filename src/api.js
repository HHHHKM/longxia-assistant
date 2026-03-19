// =============================================
// 🦞 龙虾助手 — OpenClaw API 封装
// 所有网络请求统一走这里，失败时抛出错误
// =============================================

// 缓存 gateway 连接信息（首次调用时异步获取）
let _gatewayUrl = null
let _gatewayToken = null

async function getGatewayInfo() {
  if (_gatewayUrl) return { url: _gatewayUrl, token: _gatewayToken }

  if (window.electronAPI?.gatewayUrl) {
    _gatewayUrl = await window.electronAPI.gatewayUrl()
    _gatewayToken = await window.electronAPI.gatewayToken()
  } else {
    // 浏览器模式优先同源（由 Electron 本地 Web 服务代理 /api）
    const origin = window.location?.origin || ''
    const isHttpOrigin = /^https?:\/\//.test(origin)
    const isViteDev = /:(5173|4173)$/.test(origin)
    _gatewayUrl = isHttpOrigin && !isViteDev ? origin : 'http://localhost:18789'
    _gatewayToken = ''
  }

  return { url: _gatewayUrl, token: _gatewayToken }
}

// 通用请求（内部用）
async function req(path, opts = {}) {
  const { url, token } = await getGatewayInfo()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  }
  const res = await fetch(`${url}${path}`, {
    ...opts,
    headers,
  })
  if (!res.ok) throw new Error(`服务器返回 ${res.status}`)
  return res.json()
}

// ── 状态 ──
export const getStatus = () => req('/api/status')

// ── 配置 ──
export const getConfig   = ()      => req('/api/config')
export const saveConfig  = (data)  => req('/api/config', { method: 'POST', body: JSON.stringify(data) })

// ── 聊天 ──
export const sendChat = (message) =>
  req('/api/chat', { method: 'POST', body: JSON.stringify({ message }) })

// ── 功能插件 ──
export const getInstalledSkills = () => req('/api/skills/installed')
export const installSkill   = (skillId) =>
  req('/api/skills/install',   { method: 'POST', body: JSON.stringify({ skillId }) })
export const uninstallSkill = (skillId) =>
  req('/api/skills/uninstall', { method: 'POST', body: JSON.stringify({ skillId }) })
