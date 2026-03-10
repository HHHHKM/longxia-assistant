'use strict'

const { exec, execSync, spawn } = require('child_process')
const https = require('https')
const http = require('http')
const fs = require('fs')
const os = require('os')
const path = require('path')

// Node 22 LTS
const NODE_VERSION = 'v22.14.0'
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'
const isLinux = process.platform === 'linux'

// ─── 工具函数 ───────────────────────────────────────

/**
 * 执行命令，返回 { ok, stdout, stderr }
 */
function runCommand(cmd, opts = {}) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 120000, shell: true, ...opts }, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout: (stdout || '').trim(), stderr: (stderr || '').trim(), err })
    })
  })
}

/**
 * 下载文件到指定路径
 */
function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const protocol = url.startsWith('https') ? https : http

    const request = protocol.get(url, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close()
        fs.unlink(dest, () => {})
        return downloadFile(response.headers.location, dest, onProgress).then(resolve).catch(reject)
      }

      if (response.statusCode !== 200) {
        file.close()
        fs.unlink(dest, () => {})
        return reject(new Error(`下载失败，状态码：${response.statusCode}`))
      }

      const totalBytes = parseInt(response.headers['content-length'], 10) || 0
      let downloadedBytes = 0

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length
        if (onProgress && totalBytes > 0) {
          onProgress(Math.round((downloadedBytes / totalBytes) * 100))
        }
      })

      response.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
      file.on('error', (err) => { fs.unlink(dest, () => {}); reject(err) })
    })

    request.on('error', (err) => { fs.unlink(dest, () => {}); reject(err) })
    request.setTimeout(120000, () => { request.destroy(); reject(new Error('下载超时')) })
  })
}

// ─── 检测 Node.js ───────────────────────────────────

async function isNodeInstalled() {
  // 尝试直接执行
  const result = await runCommand('node --version')
  if (result.ok && result.stdout.startsWith('v')) {
    // 检查版本是否 >= 22
    const match = result.stdout.match(/^v(\d+)\./)
    if (match && parseInt(match[1], 10) >= 22) return true
    // 版本太低，需要升级
    console.warn(`[installer] Node ${result.stdout} < v22，需要升级`)
    return false
  }

  // Windows：尝试常见安装路径
  if (isWindows) {
    const paths = [
      'C:\\Program Files\\nodejs\\node.exe',
      'C:\\Program Files (x86)\\nodejs\\node.exe',
      path.join(os.homedir(), 'AppData\\Roaming\\nvm\\current\\node.exe'),
    ]
    for (const p of paths) {
      if (fs.existsSync(p)) {
        // 检查版本
        const vResult = await runCommand(`"${p}" --version`)
        if (vResult.ok && vResult.stdout.startsWith('v')) {
          const m = vResult.stdout.match(/^v(\d+)\./)
          if (m && parseInt(m[1], 10) >= 22) return true
        }
      }
    }
  }

  // Mac：尝试 brew 安装路径
  if (isMac) {
    for (const p of ['/usr/local/bin/node', '/opt/homebrew/bin/node']) {
      const r = await runCommand(`"${p}" --version`)
      if (r.ok && r.stdout.startsWith('v')) {
        const m = r.stdout.match(/^v(\d+)\./)
        if (m && parseInt(m[1], 10) >= 22) return true
      }
    }
  }

  return false
}

// ─── 安装 Node.js ────────────────────────────────────

async function installNodeWindows(onProgress) {
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  const filename = `node-${NODE_VERSION}-${arch}.msi`
  // 优先 npmmirror
  const url = `https://npmmirror.com/mirrors/node/${NODE_VERSION}/${filename}`
  const tmpPath = path.join(os.tmpdir(), filename)

  if (onProgress) onProgress(`正在下载 Node.js ${NODE_VERSION}...`)
  await downloadFile(url, tmpPath, (pct) => {
    if (onProgress) onProgress(`下载 Node.js ${pct}%...`)
  })

  if (onProgress) onProgress('正在安装 Node.js，请稍候...')
  const result = await runCommand(
    `msiexec /i "${tmpPath}" /quiet /norestart ADDLOCAL=ALL`,
    { timeout: 300000 }
  )

  fs.unlink(tmpPath, () => {})

  if (!result.ok) {
    throw new Error(`Node.js 安装失败：${result.stderr || result.stdout}`)
  }

  // Windows：从注册表读取新的 PATH，而不是硬编码
  await refreshWindowsPath()
}

/**
 * Windows 专用：从注册表刷新系统 PATH
 */
async function refreshWindowsPath() {
  try {
    // 读取系统级 Path
    const sysResult = await runCommand(
      'reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment" /v Path',
      { timeout: 10000 }
    )
    // 读取用户级 Path
    const userResult = await runCommand(
      'reg query "HKCU\\Environment" /v PATH',
      { timeout: 10000 }
    )

    let combinedPath = process.env.PATH || ''

    if (sysResult.ok) {
      const m = sysResult.stdout.match(/Path\s+REG_(?:SZ|EXPAND_SZ)\s+(.+)/)
      if (m) combinedPath = `${m[1].trim()}${path.delimiter}${combinedPath}`
    }
    if (userResult.ok) {
      const m = userResult.stdout.match(/PATH\s+REG_(?:SZ|EXPAND_SZ)\s+(.+)/)
      if (m) combinedPath = `${m[1].trim()}${path.delimiter}${combinedPath}`
    }

    process.env.PATH = combinedPath
    console.log('[installer] Windows PATH 已从注册表刷新')
  } catch (e) {
    // 回退：手动加入常见 nodejs 路径
    process.env.PATH = `C:\\Program Files\\nodejs${path.delimiter}${process.env.PATH || ''}`
    console.warn('[installer] PATH 刷新失败，已使用回退路径:', e.message)
  }
}

async function installNodeMac(onProgress) {
  // 优先尝试 brew
  const hasBrew = await runCommand('which brew')
  if (hasBrew.ok) {
    if (onProgress) onProgress('正在通过 Homebrew 安装 Node.js 22...')
    const result = await runCommand(
      '/opt/homebrew/bin/brew install node@22 || /usr/local/bin/brew install node@22',
      { timeout: 300000 }
    )
    if (result.ok) {
      process.env.PATH = `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
      return
    }
  }

  // 备选：下载 .pkg
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  const filename = `node-${NODE_VERSION}-${arch}.pkg`
  const url = `https://npmmirror.com/mirrors/node/${NODE_VERSION}/${filename}`
  const tmpPath = path.join(os.tmpdir(), filename)

  if (onProgress) onProgress(`正在下载 Node.js ${NODE_VERSION}...`)
  await downloadFile(url, tmpPath, (pct) => {
    if (onProgress) onProgress(`下载 Node.js ${pct}%...`)
  })

  if (onProgress) onProgress('正在安装 Node.js，请稍候...')
  const result = await runCommand(`sudo installer -pkg "${tmpPath}" -target /`, { timeout: 300000 })

  fs.unlink(tmpPath, () => {})

  if (!result.ok) {
    throw new Error(`Node.js 安装失败。请手动安装：https://nodejs.org/zh-cn/download`)
  }

  process.env.PATH = `/usr/local/bin:${process.env.PATH || ''}`
}

async function installNodeLinux(onProgress) {
  if (onProgress) onProgress('正在安装 Node.js 22...')

  // 方式1：NodeSource
  const nsResult = await runCommand(
    `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt-get install -y nodejs`,
    { timeout: 300000 }
  )
  if (nsResult.ok) return

  // 方式2：snap
  const snapResult = await runCommand('sudo snap install node --classic --channel=22', { timeout: 300000 })
  if (snapResult.ok) return

  // 方式3：下载二进制
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  const filename = `node-${NODE_VERSION}-linux-${arch}.tar.xz`
  const url = `https://npmmirror.com/mirrors/node/${NODE_VERSION}/${filename}`
  const tmpPath = path.join(os.tmpdir(), filename)

  if (onProgress) onProgress(`正在下载 Node.js ${NODE_VERSION}...`)
  await downloadFile(url, tmpPath, (pct) => {
    if (onProgress) onProgress(`下载 Node.js ${pct}%...`)
  })

  const installDir = path.join(os.homedir(), '.local', 'node')
  await runCommand(`mkdir -p "${installDir}" && tar -xf "${tmpPath}" -C "${installDir}" --strip-components=1`)
  fs.unlink(tmpPath, () => {})

  process.env.PATH = `${installDir}/bin${path.delimiter}${process.env.PATH || ''}`
}

async function checkAndInstallNode(onProgress) {
  const installed = await isNodeInstalled()
  if (installed) return

  if (isWindows) {
    await installNodeWindows(onProgress)
  } else if (isMac) {
    await installNodeMac(onProgress)
  } else {
    await installNodeLinux(onProgress)
  }

  // 再次验证
  const verify = await isNodeInstalled()
  if (!verify) {
    throw new Error('Node.js 安装完成，但仍无法检测到。请重启电脑后再试。')
  }
}

// ─── 检测 & 安装 OpenClaw ────────────────────────────

async function isOpenClawInstalled() {
  const result = await runCommand('openclaw --version')
  if (result.ok) return true

  // 检查常见全局 bin 路径
  const bins = [
    path.join(os.homedir(), '.npm-global', 'bin', 'openclaw'),
    path.join(os.homedir(), '.local', 'bin', 'openclaw'),
  ]
  if (isWindows) {
    const appData = process.env.APPDATA || ''
    bins.push(path.join(appData, 'npm', 'openclaw.cmd'))
  }
  for (const b of bins) {
    if (fs.existsSync(b)) return true
  }

  return false
}

async function checkAndInstallOpenClaw(onProgress) {
  const installed = await isOpenClawInstalled()
  if (installed) return

  if (onProgress) onProgress('正在安装龙虾助手服务（openclaw）...')

  const npmCmd = isWindows ? 'npm.cmd' : 'npm'
  const mirror = '--registry=https://registry.npmmirror.com'

  // 先尝试 openclaw（标准包名）
  const result = await runCommand(
    `${npmCmd} install -g openclaw ${mirror}`,
    { timeout: 180000 }
  )

  if (!result.ok) {
    // 降级：官方 registry
    if (onProgress) onProgress('正在从官方源安装 openclaw...')
    const result2 = await runCommand(
      `${npmCmd} install -g openclaw`,
      { timeout: 180000 }
    )
    if (!result2.ok) {
      throw new Error(
        `OpenClaw 安装失败：${result2.stderr || result2.stdout}\n` +
        '请手动执行：npm install -g openclaw'
      )
    }
  }

  // 更新 PATH
  const npmBinResult = await runCommand(`${npmCmd} bin -g`)
  if (npmBinResult.ok && npmBinResult.stdout) {
    process.env.PATH = `${npmBinResult.stdout}${path.delimiter}${process.env.PATH || ''}`
  }

  // 验证
  const verify = await isOpenClawInstalled()
  if (!verify) {
    throw new Error('OpenClaw 安装完成，但无法启动。请重启后重试。')
  }
}

// ─── 配置文件管理 ────────────────────────────────────

function getConfigPath() {
  return path.join(os.homedir(), '.openclaw', 'openclaw.json')
}

function hasConfig() {
  return fs.existsSync(getConfigPath())
}

function readConfig() {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// ─── 服务商映射表 ────────────────────────────────────

const PROVIDER_MAP = {
  deepseek: {
    providerKey: 'deepseek',
    model: 'deepseek/deepseek-chat',
  },
  siliconflow: {
    providerKey: 'siliconflow',
    model: 'siliconflow/Qwen/Qwen2.5-7B-Instruct',
  },
  qwen: {
    providerKey: 'alibaba',
    model: 'qwen/qwen-plus',
  },
  openai: {
    providerKey: 'openai',
    model: 'openai/gpt-4o-mini',
  },
  claude: {
    providerKey: 'anthropic',
    model: 'anthropic/claude-3-5-haiku',
  },
  openrouter: {
    providerKey: 'openrouter',
    model: 'openrouter/auto',
  },
}

// ─── 写配置辅助 ──────────────────────────────────────

function ensureConfigDir() {
  const configDir = path.join(os.homedir(), '.openclaw')
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }
}

function loadExistingConfig() {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function buildBaseConfig(provider, apiKey) {
  const pm = PROVIDER_MAP[provider] || PROVIDER_MAP.deepseek
  return {
    models: {
      providers: {
        [pm.providerKey]: { apiKey },
      },
    },
    agents: {
      defaults: {
        model: pm.model,
        workspace: `~/.openclaw/workspace`,
      },
    },
    session: {
      dmScope: 'per-channel-peer',
    },
  }
}

/**
 * 保存配置文件 — 仅 AI 服务商 + 可选 Telegram
 *
 * 正确的 OpenClaw 格式：
 * {
 *   "models": { "providers": { "<name>": { "apiKey": "..." } } },
 *   "agents": { "defaults": { "model": "...", "workspace": "~/.openclaw/workspace" } },
 *   "session": { "dmScope": "per-channel-peer" },
 *   "channels": { "telegram": { "botToken": "...", "dmPolicy": "pairing" } }
 * }
 *
 * @param {string} provider - 服务商 ID
 * @param {string} apiKey   - API Key
 * @param {string} [telegramBotToken] - Telegram Bot Token (可选)
 */
function saveConfig(provider, apiKey, telegramBotToken) {
  ensureConfigDir()

  const existingConfig = loadExistingConfig()
  const base = buildBaseConfig(provider, apiKey)

  const config = { ...existingConfig, ...base }

  if (telegramBotToken && telegramBotToken.trim()) {
    config.channels = {
      ...(existingConfig.channels || {}),
      telegram: {
        botToken: telegramBotToken.trim(),
        dmPolicy: 'pairing',
      },
    }
  } else if (existingConfig.channels) {
    config.channels = existingConfig.channels
  }

  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf8')
}

/**
 * 保存完整配置 — 支持飞书渠道（saveConfigFull）
 *
 * 飞书渠道格式：
 * {
 *   "channels": {
 *     "feishu": {
 *       "enabled": true,
 *       "dmPolicy": "pairing",
 *       "accounts": {
 *         "main": { "appId": "cli_xxx", "appSecret": "xxx" }
 *       }
 *     }
 *   }
 * }
 *
 * @param {object} opts
 * @param {string} opts.provider          - 服务商 ID
 * @param {string} opts.apiKey            - API Key
 * @param {string} [opts.telegramBotToken] - Telegram Bot Token
 * @param {string} [opts.feishuAppId]     - 飞书 App ID
 * @param {string} [opts.feishuAppSecret] - 飞书 App Secret
 */
function saveConfigFull({ provider, apiKey, telegramBotToken, feishuAppId, feishuAppSecret }) {
  ensureConfigDir()

  const existingConfig = loadExistingConfig()
  const base = buildBaseConfig(provider, apiKey)

  const config = { ...existingConfig, ...base }
  const channels = { ...(existingConfig.channels || {}) }

  // Telegram 渠道
  if (telegramBotToken && telegramBotToken.trim()) {
    channels.telegram = {
      botToken: telegramBotToken.trim(),
      dmPolicy: 'pairing',
    }
  }

  // 飞书渠道
  if (feishuAppId && feishuAppId.trim() && feishuAppSecret && feishuAppSecret.trim()) {
    channels.feishu = {
      enabled: true,
      dmPolicy: 'pairing',
      accounts: {
        main: {
          appId: feishuAppId.trim(),
          appSecret: feishuAppSecret.trim(),
        },
      },
    }
  }

  if (Object.keys(channels).length > 0) {
    config.channels = channels
  }

  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf8')
}

module.exports = {
  checkAndInstallNode,
  checkAndInstallOpenClaw,
  hasConfig,
  readConfig,
  saveConfig,
  saveConfigFull,
  getConfigPath,
  isNodeInstalled,
  isOpenClawInstalled,
  runCommand,
  refreshWindowsPath,
  NODE_VERSION,
}
